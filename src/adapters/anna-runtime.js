/**
 * Anna AI OS Runtime Adapter for Bead Grid Studio.
 *
 * Activates ONLY when launched inside an Anna App iframe (?wid=...&t=...).
 * Standalone Web, PWA, GitHub Pages, and single-file offline builds never
 * touch network endpoints or Anna SDK modules.
 */

const ANNA_SDK_PATH = '/static/anna-apps/_sdk/latest/index.js';
const STORAGE_PROJECT_KEY = 'bead-grid-studio:project';

export function isAnnaHostEnvironment() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.__ANNA_MOCK_RUNTIME__) return true;
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get('wid') && params.get('t'));
  } catch {
    return false;
  }
}

export function mapAnnaLocaleToStudio(lang) {
  const normalized = String(lang || '').trim().toLowerCase().replace('_', '-');
  if (normalized === 'zh' || normalized.startsWith('zh-')) return 'zh-CN';
  if (normalized === 'ja' || normalized.startsWith('ja-')) return 'ja-JP';
  if (normalized === 'ko' || normalized.startsWith('ko-')) return 'ko-KR';
  if (normalized === 'fr' || normalized.startsWith('fr-')) return 'fr-FR';
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en-US';
  return null;
}

export async function connectAnnaRuntime() {
  if (!isAnnaHostEnvironment()) return null;
  if (window.__ANNA_MOCK_RUNTIME__) {
    return window.__ANNA_MOCK_RUNTIME__;
  }
  try {
    const mod = await import(/* @vite-ignore */ ANNA_SDK_PATH);
    if (!mod?.AnnaAppRuntime?.connect) return null;
    const runtime = await mod.AnnaAppRuntime.connect();
    return runtime;
  } catch (error) {
    console.warn('[bead-grid-studio] Anna runtime connection skipped:', error?.message || error);
    return null;
  }
}

export function getBundledToolId(handle = 'bead-studio') {
  if (typeof window !== 'undefined' && window.__ANNA_TOOL_IDS__?.[handle]) {
    return window.__ANNA_TOOL_IDS__[handle];
  }
  return `tool-dev-${handle}`;
}

export async function loadAnnaProjectState(anna) {
  if (!anna?.storage?.get) return null;
  try {
    const res = await anna.storage.get({ key: STORAGE_PROJECT_KEY });
    if (res?.exists && res.value && typeof res.value === 'object') {
      return res.value;
    }
    if (anna.runtimeState?.[STORAGE_PROJECT_KEY]) {
      return anna.runtimeState[STORAGE_PROJECT_KEY];
    }
  } catch {
    /* ignore storage errors when disconnected */
  }
  return null;
}

export async function saveAnnaProjectState(anna, projectData) {
  if (!anna?.storage?.set || !projectData) return false;
  try {
    const serialized = JSON.stringify(projectData);
    // Keep within Anna's 256 KB runtime_state budget with safety margin.
    if (serialized.length > 220 * 1024) return false;
    await anna.storage.set({ key: STORAGE_PROJECT_KEY, value: projectData });
    return true;
  } catch {
    return false;
  }
}

export function formatAnnaRpcError(err) {
  const code = err?.code || '';
  const message = err?.message || String(err);
  switch (code) {
    case 'APP_NOT_GRANTED':
      return `Permission not granted (${code}). Enable the requested capability in Anna Settings.`;
    case 'APP_QUOTA_EXCEEDED':
      return `Quota limit reached (${code}). Please check your Anna CU / usage quota.`;
    case 'not_implemented':
      return `This host runtime does not expose this capability yet (${code}).`;
    case 'agent_unavailable':
      return `Anna Agent is offline (${code}).`;
    default:
      return code ? `${message} [${code}]` : message;
  }
}

export async function generateBeadArtImage(anna, promptText) {
  if (!anna?.image?.generate) {
    throw new Error('Anna image generation service is unavailable.');
  }
  const cleanPrompt = String(promptText || '').trim();
  if (!cleanPrompt) throw new Error('Prompt cannot be empty.');
  const engineeredPrompt = [
    cleanPrompt,
    'centered single subject on a pure solid white background',
    'clean crisp outlines, flat cel-shaded colors, minimal shading gradients, pixel-art and fuse-bead friendly composition',
    'no text, no watermark, no busy backdrop',
  ].join(', ');

  const out = await anna.image.generate({
    prompt: engineeredPrompt,
    n: 1,
    size: '1024x1024',
    output_format: 'png',
    metadata: { source: 'bead-grid-studio', intent: 'bead-pattern-source' },
  });
  const first = out?.images?.[0];
  if (!first?.url) throw new Error('Host returned no image URL.');
  return first;
}

export async function simplifyImageForBeads(anna, { imageUrl, base64Png }) {
  if (!anna?.image?.edit) {
    throw new Error('Anna image edit service is unavailable.');
  }
  let sourceUrl = imageUrl;
  if (!sourceUrl && base64Png && anna.upload?.inline) {
    const uploaded = await anna.upload.inline({
      filename: `bead-source-${Date.now()}.png`,
      mime_type: 'image/png',
      content_b64: base64Png,
      purpose: 'user_artifact',
      metadata: { source: 'bead-grid-studio' },
    });
    sourceUrl = uploaded?.url || uploaded?.download_url;
  }
  if (!sourceUrl) {
    throw new Error('Unable to stage image for AI simplification.');
  }

  const out = await anna.image.edit({
    image_url: sourceUrl,
    prompt: 'Simplify into a flat-color chibi illustration on a solid pure white background with bold clean outlines, zero photographic noise, zero complex textures, ideal for fuse bead pixel grid conversion. Preserve the main subject.',
    n: 1,
    metadata: { source: 'bead-grid-studio', intent: 'simplify-for-beads' },
  });
  const first = out?.images?.[0];
  if (!first?.url) throw new Error('Host returned no edited image URL.');
  return first;
}

export async function generateCraftBuildPlan(anna, { complexity, topColors, mergeSuggestions, locale }) {
  if (!anna?.llm?.complete) {
    throw new Error('Anna LLM service is unavailable.');
  }
  const languageHint = locale === 'zh-CN' ? 'Simplified Chinese' : locale === 'ja-JP' ? 'Japanese' : locale === 'ko-KR' ? 'Korean' : locale === 'fr-FR' ? 'French' : 'English';
  const promptPayload = {
    dimensions: `${complexity.cols}x${complexity.rows}`,
    totalBeads: complexity.totalBeads,
    usedColors: complexity.usedColors,
    isolatedBeads: complexity.isolatedBeads,
    estimatedMinutes: complexity.estimatedMinutes,
    difficulty: complexity.difficulty,
    boards: complexity.boardGrid,
    topColors: topColors.slice(0, 12),
    rareColorMergeCandidates: mergeSuggestions.slice(0, 5),
  };

  const response = await anna.llm.complete({
    messages: [
      {
        role: 'system',
        content: `You are an expert fuse-bead craft coach. Reply concisely in ${languageHint} with 4 practical bullet points: (1) Recommended pegboard placement sequence, (2) Structural & ironing reinforcement tips (especially if isolatedBeads > 0), (3) Color-saving substitutions if rareColorMergeCandidates are non-empty, (4) Estimated time & prep checklist. Cite exact color codes from the JSON only.`,
      },
      {
        role: 'user',
        content: JSON.stringify(promptPayload),
      },
    ],
    temperature: 0.25,
  });

  return (
    response?.content
    || response?.text
    || response?.choices?.[0]?.message?.content
    || ''
  ).trim();
}

export async function sendPatternArtifactToChat(anna, { title, summary, patternData, complexity }) {
  if (!anna?.chat?.append_artifact) return false;
  try {
    await anna.chat.append_artifact({
      artifact: {
        kind: 'app_event',
        summary,
        app_slug: 'bead-grid-studio',
        data: {
          title,
          cols: patternData.grid.cols,
          rows: patternData.grid.rows,
          totalBeads: complexity.totalBeads,
          usedColors: complexity.usedColors,
          estimatedMinutes: complexity.estimatedMinutes,
          topColors: (patternData.statistics?.colors || []).slice(0, 10),
        },
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function triggerMobileHaptic(anna, style = 'light') {
  if (!anna?.mobile?.haptics) return;
  try {
    await anna.mobile.haptics({ style });
  } catch {
    /* unsupported on desktop */
  }
}

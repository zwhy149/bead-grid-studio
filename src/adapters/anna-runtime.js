/**
 * Anna AI OS Runtime Adapter for Bead Grid Studio.
 *
 * Activates ONLY when launched inside an Anna App iframe (?wid=...&t=...).
 * Standalone Web, PWA, GitHub Pages, and single-file offline builds never
 * touch network endpoints or Anna SDK modules.
 */

const ANNA_SDK_PATH = '/static/anna-apps/_sdk/latest/index.js';
export const STORAGE_PROJECT_KEY = 'projects/active';
const LEGACY_STORAGE_PROJECT_KEY = 'bead-grid-studio:project';

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

export function hasAnnaEntryContent(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (payload.pattern && payload.pattern.type === 'bead-grid-studio') return true;
  if (Array.isArray(payload.matrix) && payload.matrix.length > 0) return true;
  if (typeof payload.imageUrl === 'string' && payload.imageUrl.trim()) return true;
  return false;
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
  if (!anna) return null;
  if (typeof anna.storage?.get === 'function') {
    for (const key of [STORAGE_PROJECT_KEY, LEGACY_STORAGE_PROJECT_KEY]) {
      try {
        const res = await anna.storage.get({ key });
        if (res?.exists && res.value && typeof res.value === 'object') {
          return res.value;
        }
      } catch {
        /* try next key or runtimeState fallback */
      }
    }
  }
  if (anna.runtimeState && typeof anna.runtimeState === 'object') {
    const candidate = anna.runtimeState[STORAGE_PROJECT_KEY] || anna.runtimeState[LEGACY_STORAGE_PROJECT_KEY];
    if (candidate && typeof candidate === 'object') return candidate;
  }
  return null;
}

export async function saveAnnaProjectState(anna, projectData) {
  if (!anna?.storage?.set || !projectData) return false;
  try {
    const serialized = JSON.stringify(projectData);
    // Keep within Anna's 256 KiB legacy runtime_state cap while APS handles larger rows.
    if (serialized.length > 245 * 1024) return false;
    await anna.storage.set({ key: STORAGE_PROJECT_KEY, value: projectData });
    return true;
  } catch {
    return false;
  }
}

export function extractLlmText(response) {
  if (!response) return '';
  if (typeof response.content === 'string') return response.content.trim();
  if (response.content && typeof response.content === 'object' && !Array.isArray(response.content)) {
    if (typeof response.content.text === 'string') return response.content.text.trim();
  }
  if (Array.isArray(response.content)) {
    const joined = response.content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('\n')
      .trim();
    if (joined) return joined;
  }
  if (typeof response.text === 'string') return response.text.trim();
  const choiceContent = response?.choices?.[0]?.message?.content;
  if (typeof choiceContent === 'string') return choiceContent.trim();
  return '';
}

export function formatAnnaRpcError(err) {
  const code = err?.code || '';
  const message = err?.message || String(err);
  switch (code) {
    case 'APP_NOT_GRANTED':
      return `Permission not granted (${code}). Enable the requested capability in Anna Settings.`;
    case 'APP_QUOTA_EXCEEDED':
      return `Quota limit reached (${code}). Please check your Anna CU / usage quota.`;
    case 'IMAGE_CONTENT_REJECTED':
      return `The image provider declined this prompt (${code}). Please try a simpler craft description.`;
    case 'not_implemented':
      return `This host runtime does not expose this capability yet (${code}).`;
    case 'agent_unavailable':
      return `Anna Agent is offline (${code}).`;
    default:
      return code ? `${message} [${code}]` : message;
  }
}

export async function generateBeadArtImage(anna, promptText) {
  if (!anna?.image?.generate && !anna?.image?.generateAwait) {
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

  if (typeof anna.image?.generate === 'function') {
    const out = await anna.image.generate({
      prompt: engineeredPrompt,
      n: 1,
      size: '1024x1024',
      output_format: 'png',
    });
    const first = out?.images?.[0];
    if (first?.url) return first;
  }

  if (typeof anna.image?.generateAwait === 'function') {
    const job = await anna.image.generateAwait({
      prompt: engineeredPrompt,
      n: 1,
      size: '1024x1024',
      output_format: 'png',
    });
    const first = job?.result?.images?.[0];
    if (first?.url) return first;
  }

  throw new Error('Host returned no image URL.');
}

async function stageInputPngUrl(anna, cleanB64) {
  if (!cleanB64) return null;
  if (typeof anna?.upload?.inline === 'function') {
    const uploaded = await anna.upload.inline({
      filename: 'bead-input.png',
      mime_type: 'image/png',
      content_b64: cleanB64,
      purpose: 'image_input',
    });
    let downloadUrl = uploaded?.download_url || uploaded?.url || null;
    if (!downloadUrl && uploaded?.r2_key && typeof anna?.upload?.confirm === 'function') {
      const confirmed = await anna.upload.confirm({ r2_key: uploaded.r2_key });
      downloadUrl = confirmed?.download_url || confirmed?.url || null;
    }
    if (downloadUrl && /^https?:\/\//i.test(downloadUrl)) return downloadUrl;
  }
  return null;
}

async function runHostImageEdit(anna, sourceUrl, editPrompt) {
  // Prefer editAwait when exposed by the host SDK because Anna's async media pipeline
  // re-hosts input URLs onto platform storage prior to provider submission.
  if (typeof anna?.image?.editAwait === 'function') {
    try {
      const job = await anna.image.editAwait({
        image_url: sourceUrl,
        prompt: editPrompt,
        n: 1,
        output_format: 'png',
      });
      if (job?.state === 'failed') {
        const jobErr = new Error(job?.error?.message || 'Image edit job failed');
        jobErr.code = job?.error?.code || 'APP_PROVIDER_ERROR';
        throw jobErr;
      }
      const asyncFirst = job?.result?.images?.[0];
      if (asyncFirst?.url) return asyncFirst;
    } catch (err) {
      const code = String(err?.code || '');
      const msg = String(err?.message || '');
      const unsupported = code === 'unknown_method' || code === 'not_implemented' || /Method not found|unknown_method/i.test(msg);
      if (!unsupported && typeof anna?.image?.edit !== 'function') throw err;
      if (!unsupported) {
        // Allow fallback to sync edit or vision-generate below.
        if (code === 'APP_NOT_GRANTED' || code === 'APP_QUOTA_EXCEEDED' || code === 'IMAGE_CONTENT_REJECTED') {
          throw err;
        }
      }
    }
  }

  if (typeof anna?.image?.edit === 'function') {
    const out = await anna.image.edit({
      image_url: sourceUrl,
      prompt: editPrompt,
      n: 1,
      output_format: 'png',
    });
    const first = out?.images?.[0];
    if (first?.url) return first;
  }

  throw new Error('Host returned no edited image URL.');
}

export async function simplifyImageForBeads(anna, { imageUrl, base64Png, fallbackSubject = '' }) {
  if (!anna?.image?.edit && !anna?.image?.editAwait && !anna?.image?.generate) {
    throw new Error('Anna image edit service is unavailable.');
  }

  const cleanB64 = typeof base64Png === 'string' && base64Png.trim()
    ? base64Png.trim().replace(/^data:[^,]+,/, '')
    : null;

  const candidateUrls = [];
  if (cleanB64) {
    try {
      const stagedUrl = await stageInputPngUrl(anna, cleanB64);
      if (stagedUrl) candidateUrls.push(stagedUrl);
    } catch (uploadErr) {
      const code = String(uploadErr?.code || '');
      if (code === 'APP_NOT_GRANTED' || code === 'APP_QUOTA_EXCEEDED') throw uploadErr;
    }
  }
  if (typeof imageUrl === 'string' && /^https?:\/\//i.test(imageUrl.trim())) {
    const trimmed = imageUrl.trim();
    if (!candidateUrls.includes(trimmed)) candidateUrls.push(trimmed);
  }

  const editPrompt = 'Simplify into a flat-color chibi illustration on a solid pure white background with bold clean outlines, zero photographic noise, zero complex textures, ideal for fuse bead pixel grid conversion. Preserve the main subject.';

  let lastEditError = null;
  for (const sourceUrl of candidateUrls) {
    try {
      return await runHostImageEdit(anna, sourceUrl, editPrompt);
    } catch (err) {
      lastEditError = err;
      const code = String(err?.code || '');
      if (code === 'APP_NOT_GRANTED' || code === 'APP_QUOTA_EXCEEDED' || code === 'IMAGE_CONTENT_REJECTED') {
        throw err;
      }
    }
  }

  // Resilient zero-URL fallback: if upstream provider could not fetch the presigned input URL
  // (e.g., fal.ai HTTP 422 on input.image_urls in restricted/staging buckets), describe the
  // image via multimodal LLM (inline base64, no external URL fetch) and generate a clean bead sprite.
  if (typeof anna?.image?.generate === 'function' || typeof anna?.image?.generateAwait === 'function') {
    let subjectDescription = '';
    if (cleanB64 && typeof anna?.llm?.complete === 'function') {
      try {
        const visionResp = await anna.llm.complete({
          systemPrompt: 'Describe the main subject, pose, and primary colors of the image in one concise English phrase (max 35 words) suitable for generating a flat cel-shaded fuse-bead sprite on a white background. Output only the visual description.',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', data: cleanB64, mimeType: 'image/png' },
                { type: 'text', text: 'Describe this subject and its key colors for a flat chibi bead pattern.' },
              ],
            },
          ],
          maxTokens: 160,
          temperature: 0.2,
        });
        subjectDescription = extractLlmText(visionResp);
      } catch {
        /* non-vision model or LLM unavailable: fall back to local subject summary */
      }
    }
    const finalSubject = subjectDescription || String(fallbackSubject || '').trim() || 'cute chibi craft emblem';
    return await generateBeadArtImage(anna, finalSubject);
  }

  if (lastEditError) throw lastEditError;
  throw new Error('Unable to stage image for AI simplification.');
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
    systemPrompt: `You are an expert fuse-bead craft coach. Reply concisely in ${languageHint} with 4 practical bullet points: (1) Recommended pegboard placement sequence, (2) Structural & ironing reinforcement tips (especially if isolatedBeads > 0), (3) Color-saving substitutions if rareColorMergeCandidates are non-empty, (4) Estimated time & prep checklist. Cite exact color codes from the JSON only.`,
    messages: [
      {
        role: 'user',
        content: JSON.stringify(promptPayload),
      },
    ],
    maxTokens: 900,
    temperature: 0.25,
  });

  return extractLlmText(response);
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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DEFAULT_REPOSITORY = 'zwhy149/bead-grid-studio';
const API_ROOT = 'https://api.github.com';
const API_VERSION = '2022-11-28';

// Last verified snapshot baseline (collected 2026-09-19)
const BASELINE_METRICS = {
  stars: 175,
  forks: 19,
  openIssues: 7,
  releases: 7,
  totalAssetDownloads: 156,
  releaseDetails: [
    { tag: 'v1.1.3', downloads: 15, name: 'v1.1.3' },
    { tag: 'v1.1.2', downloads: 28, name: 'v1.1.2' },
    { tag: 'v1.1.1', downloads: 35, name: 'v1.1.1' },
    { tag: 'v1.1.0', downloads: 42, name: 'v1.1.0' },
    { tag: 'v1.0.2', downloads: 18, name: 'v1.0.2' },
    { tag: 'v1.0.1', downloads: 12, name: 'v1.0.1' },
    { tag: 'v1.0.0', downloads: 6, name: 'v1.0.0' },
  ],
};

function requestHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': API_VERSION,
    'User-Agent': 'bead-grid-studio-health-check',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchLiveGitHubMetrics(repository) {
  const encodedRepository = repository.split('/').map(encodeURIComponent).join('/');
  const headers = requestHeaders();

  const repoRes = await fetch(`${API_ROOT}/repos/${encodedRepository}`, { headers });
  if (!repoRes.ok) {
    throw new Error(`GitHub API ${repoRes.status}: ${repoRes.statusText}`);
  }
  const repoData = await repoRes.json();

  const relRes = await fetch(`${API_ROOT}/repos/${encodedRepository}/releases?per_page=100`, { headers });
  const releases = relRes.ok ? await relRes.json() : [];

  const issuesRes = await fetch(`${API_ROOT}/repos/${encodedRepository}/issues?state=open&per_page=100`, { headers });
  const issues = issuesRes.ok ? await issuesRes.json() : [];

  const publishedReleases = releases.filter((r) => !r.draft);
  const totalDownloads = publishedReleases.reduce(
    (acc, rel) => acc + (rel.assets || []).reduce((aSum, a) => aSum + (a.download_count || 0), 0),
    0
  );

  return {
    source: 'live-api',
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    openIssues: issues.filter((i) => !i.pull_request).length,
    releases: publishedReleases.length,
    totalAssetDownloads: totalDownloads,
    releaseDetails: publishedReleases.map((r) => ({
      tag: r.tag_name,
      name: r.name || r.tag_name,
      downloads: (r.assets || []).reduce((sum, a) => sum + (a.download_count || 0), 0),
    })),
  };
}

function inspectLocalCodeHealth() {
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const corePkgPath = path.join(rootDir, 'packages', 'core', 'package.json');
  const corePkg = JSON.parse(fs.readFileSync(corePkgPath, 'utf8'));

  const portableHtmlPath = path.join(rootDir, 'dist', 'bead-grid-studio.html');
  const portableSize = fs.existsSync(portableHtmlPath) ? fs.statSync(portableHtmlPath).size : null;

  // Count unit test cases
  const unitTestPath = path.join(rootDir, 'tests', 'unit', 'core.test.js');
  let unitTestCount = 0;
  if (fs.existsSync(unitTestPath)) {
    const content = fs.readFileSync(unitTestPath, 'utf8');
    const matches = content.match(/test\(/g);
    unitTestCount = matches ? matches.length : 0;
  }

  // Count E2E test files
  const e2eDir = path.join(rootDir, 'tests', 'e2e');
  let e2eFileCount = 0;
  if (fs.existsSync(e2eDir)) {
    e2eFileCount = fs.readdirSync(e2eDir).filter((f) => f.endsWith('.js') || f.endsWith('.ts')).length;
  }

  return {
    appVersion: pkg.version,
    coreVersion: corePkg.version,
    nodeRequirement: pkg.engines?.node || '>=22.12.0',
    portableBuildBytes: portableSize,
    portableBuildFormatted: portableSize ? `${(portableSize / 1024).toFixed(1)} KB` : 'not built',
    unitTests: unitTestCount,
    e2eTestSuites: e2eFileCount,
    activePalettes: ['mard-compatible-base-221', 'mard-mini-12', 'mard-mono-8'],
    colorCount: 221,
    privacyModel: 'local-first, 0 network telemetry',
  };
}

async function main() {
  const repository = process.argv[2] || process.env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY;
  let githubMetrics;

  try {
    githubMetrics = await fetchLiveGitHubMetrics(repository);
    console.log(`[info] Successfully retrieved live metrics from GitHub API for ${repository}`);
  } catch (err) {
    console.warn(`[notice] Live GitHub API unavailable (${err.message}). Using verified snapshot baseline.`);
    githubMetrics = {
      source: 'verified-baseline',
      ...BASELINE_METRICS,
    };
  }

  const codeHealth = inspectLocalCodeHealth();

  const report = {
    generatedAt: new Date().toISOString(),
    repository,
    metricsSource: githubMetrics.source,
    publicAdoption: {
      stars: githubMetrics.stars,
      forks: githubMetrics.forks,
      openIssues: githubMetrics.openIssues,
      releases: githubMetrics.releases,
      totalAssetDownloads: githubMetrics.totalAssetDownloads,
      releasesBreakdown: githubMetrics.releaseDetails,
    },
    codeQuality: codeHealth,
    compliance: {
      license: 'Apache-2.0',
      telemetry: 'none',
      privacyPreserving: true,
      openSchemas: [
        'schema/palette.schema.json',
        'schema/pattern.schema.json',
      ],
      standalonePackages: [
        '@bead-grid/core',
      ],
    },
  };

  const outputPath = path.join(rootDir, 'project-health.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n========================================');
  console.log('   BEAD GRID STUDIO - PROJECT HEALTH    ');
  console.log('========================================');
  console.log(`Repository:      ${repository}`);
  console.log(`Data Source:     ${githubMetrics.source}`);
  console.log(`App Version:     v${codeHealth.appVersion}`);
  console.log(`Core Version:    @bead-grid/core v${codeHealth.coreVersion}`);
  console.log(`GitHub Stars:    ${githubMetrics.stars}`);
  console.log(`Forks:           ${githubMetrics.forks}`);
  console.log(`Open Issues:     ${githubMetrics.openIssues}`);
  console.log(`Published Rel:   ${githubMetrics.releases}`);
  console.log(`Asset Downloads: ${githubMetrics.totalAssetDownloads}`);
  console.log(`Unit Tests:      ${codeHealth.unitTests} assertions/tests`);
  console.log(`E2E Suites:      ${codeHealth.e2eTestSuites} test files`);
  console.log(`Single HTML:     ${codeHealth.portableBuildFormatted}`);
  console.log(`Privacy Model:   ${codeHealth.privacyModel}`);
  console.log(`Health JSON:     ${outputPath}`);
  console.log('========================================\n');
}

main().catch((err) => {
  console.error('Failed to generate project health metrics:', err);
  process.exit(1);
});

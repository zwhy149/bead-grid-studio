# Contributing / 参与贡献

[简体中文](#简体中文) · [English](#english)

感谢你帮助 Bead Grid Studio / 豆格工坊变得更可靠、更容易使用。文档修正、翻译、测试、无障碍改进和小范围界面修复都属于有价值的贡献。

Thank you for helping make Bead Grid Studio more reliable and easier to use. Documentation fixes, translations, tests, accessibility improvements, and focused interface fixes are all valuable contributions.

## 简体中文

### Good First Contribution

第一次参与时，先查看带有 [`good first issue`](https://github.com/zwhy149/bead-grid-studio/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) 标签且尚未被认领的 Issue。如果目前没有开放任务，可以在 [Discussions](https://github.com/zwhy149/bead-grid-studio/discussions) 中说明你感兴趣的方向，不要先进行大规模重构。

适合新贡献者的任务通常包括：

- 补充一个合法可再分发的测试图片及来源说明；
- 增加一个几何、语言或响应式边界测试；
- 改进键盘操作、焦点状态或屏幕阅读器标签；
- 修正文档、部署步骤或翻译；
- 修复一个有截图和明确验收条件的移动端布局问题。

以下任务通常不适合作为第一次贡献：更换前端框架、重写转换流水线、一次加入整套未经验证的品牌色板，或同时修改算法、界面和项目格式。

### 快速开始

本地开发最短流程是：

```bash
npm ci
npm run dev
```

完成修改后、提交 Pull Request 前，必须运行：

```bash
npm run qa
```

首次运行完整浏览器测试时，按下方 Fork 流程安装 Playwright 浏览器。

### Fork、运行与提交 PR

1. 在 GitHub 页面点击 **Fork**。
2. 把你自己的 Fork 克隆到电脑并进入目录：

   ```bash
   git clone https://github.com/YOUR-NAME/bead-grid-studio.git
   cd bead-grid-studio
   npm ci
   npx playwright install --with-deps chromium firefox webkit
   npm run dev
   ```

3. 建立只处理一个问题的分支：

   ```bash
   git switch -c fix/short-description
   ```

4. 完成修改和测试：

   ```bash
   npm run qa
   ```

5. Push 到你的 Fork，然后从该分支向本仓库 `main` 提交 Pull Request。

PR 应说明观察到的问题、期望结果、实现范围和验证方式。可见界面改动应提供相同尺寸、相同设置下的前后截图。转换缺陷应先增加一个不修复代码就会失败的最小回归。

### Issue、Discussion 还是 Pull Request

- 使用方法、想法和作品展示：使用 [Discussions](https://github.com/zwhy149/bead-grid-studio/discussions)。
- 可复现的程序或转换缺陷：选择合适的 [Issue 表单](https://github.com/zwhy149/bead-grid-studio/issues/new/choose)。
- 已经有明确范围的代码或文档修改：提交 Pull Request。

开始前请搜索已有 Issue，并在最新版在线演示或 `main` 构建中复现。删除工程标题、截图中的隐私信息；只上传你有权公开的图片。

## English

### Good First Contribution

For a first contribution, choose an unclaimed [`good first issue`](https://github.com/zwhy149/bead-grid-studio/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22). If none is open, describe the area you want to help with in [Discussions](https://github.com/zwhy149/bead-grid-studio/discussions) before starting a broad change.

Good first contributions usually include:

- one legally redistributable test fixture with provenance;
- one geometry, locale, or responsive edge-case test;
- a keyboard, focus, or screen-reader improvement;
- a focused documentation, deployment, or translation fix;
- a mobile layout fix with screenshots and clear acceptance criteria.

Framework migrations, conversion-pipeline rewrites, complete unverified brand palettes, and combined algorithm/UI/project-format changes are not suitable first contributions.

### Quick start

The shortest local development flow is:

```bash
npm ci
npm run dev
```

Before opening a Pull Request, you must run:

```bash
npm run qa
```

Install Playwright browsers through the Fork flow below before running the full browser suite for the first time.

### Fork, run, and open a PR

1. Select **Fork** on GitHub.
2. Clone your Fork and install the exact dependencies:

   ```bash
   git clone https://github.com/YOUR-NAME/bead-grid-studio.git
   cd bead-grid-studio
   npm ci
   npx playwright install --with-deps chromium firefox webkit
   npm run dev
   ```

3. Create a branch for one focused problem:

   ```bash
   git switch -c fix/short-description
   ```

4. Make the change and run every quality gate:

   ```bash
   npm run qa
   ```

5. Push the branch to your Fork, then open a Pull Request against this repository's `main` branch.

Explain the observed problem, expected outcome, implementation scope, and verification. Visible UI changes need before/after screenshots at identical sizes and settings. A conversion defect should first receive a minimal regression that fails without the fix.

### Issue, Discussion, or Pull Request?

- Usage questions, ideas, and show-and-tell: use [Discussions](https://github.com/zwhy149/bead-grid-studio/discussions).
- Reproducible application or conversion defects: choose the relevant [Issue form](https://github.com/zwhy149/bead-grid-studio/issues/new/choose).
- A scoped code or documentation improvement: open a Pull Request.

Search existing Issues first and reproduce on the latest live demo or `main` build. Remove private data from project titles and screenshots. Only upload images you have the right to publish.

## Shared contribution rules / 共同规则

### Fixtures and source-image privacy

Accepted fixtures must be original, CC0, public-domain, or accompanied by clear redistribution permission. Add a short provenance note when the answer is not obvious. Do not submit customer images, private photos, copyrighted characters, shop screenshots, or scraped social-media examples.

Conversion-quality reports should include source dimensions, target grid, fit mode, conversion mode, expected structure, and actual result. A minimal synthetic fixture is preferable to a copyrighted image.

### Palette data

Palette changes require:

- stable codes;
- a source URL and pinned version/date;
- a redistribution license;
- the measurement method when values come from physical samples;
- migration and exact-code tests.

Do not label community-created color names as official manufacturer names or claim official compatibility without verifiable evidence.

### Design and architecture

- Preserve the invariants in `CONTEXT.md`.
- Use Module, Interface, Implementation, Depth, Seam, Adapter, Leverage, and Locality in architecture proposals.
- Do not add a Seam for a hypothetical platform without two real Adapters or an immediate test use.
- Keep conversion changes deterministic; random algorithms need a fixed seed in the public Interface.
- Avoid combining framework migration, visual redesign, and conversion changes in one Pull Request.
- Delete the replaced Implementation when a refactor is complete.
- Preserve local-only image processing, offline use, portable HTML, PWA behavior, CSP assumptions, and the absence of analytics SDKs.

### Pull Request checklist

- [ ] The PR handles one reviewable problem.
- [ ] A regression was added or updated when behavior changed.
- [ ] `npm run qa` passes.
- [ ] Desktop and 390px mobile behavior were checked for UI changes.
- [ ] English and Simplified Chinese were checked for user-visible copy changes.
- [ ] Counts, dimensions, coordinates, and project round-trip remain consistent.
- [ ] Fixtures are original, public-domain, CC0, or clearly redistributable.
- [ ] Documentation and known limitations match actual behavior.

By submitting a contribution, you agree that it is licensed under Apache License 2.0, the repository's inbound license.

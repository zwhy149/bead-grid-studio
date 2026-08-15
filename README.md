<p align="center">
  <img src="docs/assets/social-preview.png" alt="豆格工坊：本地优先的拼豆图纸生成器" width="100%">
</p>

<p align="center">
  <strong>简体中文</strong> · <a href="README.en.md"><strong>English</strong></a>
</p>

<p align="center">
  <a href="https://zwhy149.github.io/bead-grid-studio/"><strong>在线体验</strong></a> ·
  <a href="https://github.com/zwhy149/bead-grid-studio/releases/latest"><strong>下载离线版</strong></a> ·
  <a href="#第一次使用"><strong>新手教程</strong></a> ·
  <a href="#部署自己的网页"><strong>部署网页</strong></a>
</p>

<p align="center">
  <a href="https://github.com/zwhy149/bead-grid-studio/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/zwhy149/bead-grid-studio/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-87351c"></a>
  <a href="https://github.com/zwhy149/bead-grid-studio/releases"><img alt="Release" src="https://img.shields.io/github/v/release/zwhy149/bead-grid-studio?display_name=tag"></a>
</p>

# 豆格工坊：本地优先的拼豆图纸生成器

**拼豆图纸生成器、图片转拼豆、拼豆像素画和拼豆施工图工具。** Bead Grid Studio is a local-first fuse-bead / perler-bead pattern generator.

它会在浏览器本机把图片转换成可编辑、可打印的拼豆图纸，并输出逐格色号、四边坐标、辅助线、底板接缝和用料统计。社区版没有图片上传接口、账号、统计 SDK 或云端转换服务，原图像素留在你的设备中。

本项目不会承诺把任意图片在 16 或 24 格内“无损还原”。它会尽量保护轮廓、开口和彼此分离的小部件；如果细节已经小于一颗豆，会明确提示，而不是静默声称完美。

## 先选择你的使用方式

| 你想做什么 | 最省事的入口 | 是否需要安装 |
| --- | --- | --- |
| 立即把图片转成拼豆图 | [打开在线版](https://zwhy149.github.io/bead-grid-studio/) | 不需要 |
| 断网使用或保存到 U 盘 | [从 Releases 下载单 HTML](https://github.com/zwhy149/bead-grid-studio/releases/latest) | 不需要 |
| 部署成自己的公开网页 | [GitHub Pages / Cloudflare Pages 教程](docs/deployment.zh-CN.md) | 需要 GitHub 账号；Cloudflare 可选 |
| 修改代码或参与开发 | [开发者本地运行](#开发者本地运行) | 需要 Node.js |

## 第一次使用

1. 打开[在线版](https://zwhy149.github.io/bead-grid-studio/)，点击“选择图片”。
2. 选择 PNG、JPG、WebP 或 GIF。图片只在当前浏览器里处理。
3. 等待“小白一键模式”生成推荐方案。先看图案比例、格数、颜色数和警告。
4. 如果图案太粗，增加长边格数；如果只做某个主体，先使用裁剪。不要把宽图强行填满正方形底板。
5. 用画笔、橡皮、取色、镜像或旋转做最后修正。
6. 点击“导出图纸”，得到带逐格色号、坐标、辅助线、底板接缝和用量统计的 PNG。

需要下次继续编辑时，请同时保存 JSON 工程。JSON 不包含参考原图；以后读取工程时，如需继续对照，请重新选择原图。

## 下载离线版

普通使用者不需要下载源码，也不需要安装 Node.js：

1. 打开[最新 Release](https://github.com/zwhy149/bead-grid-studio/releases/latest)。
2. 展开页面底部的 **Assets**。
3. 下载名字类似 `bead-grid-studio-vX.Y.Z.html` 的文件，其中 `X.Y.Z` 是版本号。不要下载 GitHub 自动生成的 `Source code` 压缩包来当应用使用。
4. 双击 HTML，选择 Chrome、Edge、Firefox 或 Safari 打开。
5. 以后更新时，重新下载新版 HTML 即可；旧版 JSON 工程仍可按项目格式兼容规则读取。

Release 同时提供 ZIP 和 `SHA256SUMS.txt`。只把文件与**同一个 Release** 中的校验和比较：

```powershell
# Windows PowerShell：先进入下载目录
Get-FileHash .\bead-grid-studio-vX.Y.Z.html -Algorithm SHA256
Get-Content .\SHA256SUMS.txt
```

```bash
# Linux（已下载同一 Release 的 HTML、ZIP 和 SHA256SUMS.txt）
sha256sum --check SHA256SUMS.txt

# macOS 可逐个计算后对照 SHA256SUMS.txt
shasum -a 256 bead-grid-studio-vX.Y.Z.html
```

单 HTML 已内嵌代码、样式、Apache-2.0 许可证和第三方许可，不依赖外部 CDN。

手机用户优先使用在线版，并通过浏览器的“添加到主屏幕”安装 PWA。手机系统对直接打开本地 HTML 的支持差异较大。

PWA 必须先在 HTTPS 网页中完整加载一次，之后才能使用已缓存内容断网打开。草稿保存在当前浏览器的站点数据中；更换浏览器或清理缓存前，请先导出 JSON 工程。

## 网页各部分怎么用

- **图片与转换**：上传、裁剪、选择完整显示或铺满裁切，并调整参考底图透明度。
- **图纸尺寸**：“按图案清晰度”以长边格数控制细节；“按真实底板”把等比图案居中放进实体板，不拉伸。
- **高级设置**：转换模式、最大颜色数和相近色合并。新手先保留自动推荐。
- **绘制与变换**：画笔、橡皮、取色、镜像、旋转、撤销和重做。
- **右侧色板**：基础 221 个兼容色号；普通图片自动匹配 220 个实色，`H1` 透明色只供手动画入。
- **导出**：施工图 PNG、可编辑 JSON 和打印预览。正式制作前请检查色号、总颗数、板数和缺失细节警告。

## 界面预览

| 桌面工作台 | 手机工作台 |
| --- | --- |
| ![桌面工作台](docs/assets/app-desktop.png) | ![手机工作台](docs/assets/app-mobile.png) |

截图里的火箭是仓库自制测试素材，位于 `tests/fixtures/`，可按本项目许可证使用。

## 部署自己的网页

### GitHub Pages：适合第一次部署

1. 点击仓库右上角 **Fork**，复制到你自己的 GitHub 账号。
2. 在新仓库进入 **Settings → Pages**，把 **Source** 设为 **GitHub Actions**。
3. 如果 GitHub 提示 Fork 的 Actions 尚未启用，进入 **Actions** 页面确认启用。
4. 手动运行 `Deploy GitHub Pages`，或向 `main` 推送一次提交。
5. 部署完成后，地址通常是 `https://你的用户名.github.io/bead-grid-studio/`。

仓库已经包含构建、完整 QA 和 Pages 工作流，不需要把 `dist` 手工提交进 Git。详见[中文部署教程](docs/deployment.zh-CN.md)与 [GitHub 官方 Pages 工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

### Cloudflare Pages：适合自定义域名和响应头

Fork 后连接 Git 仓库，使用：

```text
Root directory: 留空（仓库根目录）
Build command: npm run build
Build output directory: dist
Node.js: 仓库 .nvmrc 已固定 24；如平台未自动读取，可设置 NODE_VERSION=24
```

也可以在本地执行 `npm ci && npm run build`，再把 **dist 文件夹**拖到 Cloudflare Pages Direct Upload；不要上传仓库根目录。Direct Upload 项目以后不能直接切换为 Git integration，创建时要先选好。完整步骤见[中文部署教程](docs/deployment.zh-CN.md)和 [Cloudflare 官方说明](https://developers.cloudflare.com/pages/get-started/direct-upload/)。

## 开发者本地运行

需要 Node.js 22.12 或更高版本：

```bash
git clone https://github.com/zwhy149/bead-grid-studio.git
cd bead-grid-studio
npm ci
npm run dev
```

打开终端显示的地址，默认是 `http://127.0.0.1:4173/`。
该端口被占用时开发服务器会直接报错，不会自动改用其他端口；请先关闭占用程序或调整 `vite.config.js`。

需要运行全部测试时：

```bash
npm run setup
npm run qa
```

`npm run qa` 会执行源码/许可/色板门禁、8 项纯函数测试、Chromium/Firefox/WebKit E2E，以及应用内 80 项转换回归。

## 主要能力

- 黑白线稿的小尺寸拓扑精修和分离部件保护。
- 线稿/卡通、高清细节、照片、文档结构和像素直采模式。
- 锁定原图比例、安全自动裁边、完整显示/铺满裁切和手动裁剪。
- 常见 2.6 mm、5 mm 实体底板布局；图案在底板内居中，不做非等比拉伸。
- MARD 兼容基础 221 色号及固定来源记录。
- 画笔、橡皮、取色、镜像、旋转、撤销重做和 JSON 工程文件。
- 带逐格色号、四边坐标、粗辅助线、接板线和用量的施工图 PNG。
- 桌面/手机响应式界面、可安装 PWA 和可下载单 HTML。
- 确定性转换回归、纯几何测试和公开 CI。

## 60 格以下为什么不可能保证“一模一样”

豆格数量就是信息容量：16×16 只有 256 个位置，源图中小于一格的鼻点、细字或反光不可能全部独立表示。

本项目会在与目标尺寸无关的中间栅格上分析线稿，用来源连通部件 owner 追踪小部件，投影后避免不同部件粘连；在不冲突时，可以给极小部件保留一个支持度最高的格。如果仍无法容纳，界面会提示缺失数，并建议增加格数或手工修补。详见[算法说明](docs/algorithm.md)和[已知限制](docs/limitations.md)。

## 色号与实物色差

默认色板为固定 MIT 数据源中的基础 221 子集（`A/B/C/D/E/F/G/H/M`）。`H1` 是透明色，不参与普通不透明图片量化；`H2` 是白色锚点；`H7` 是黑色锚点。

屏幕 HEX 只能近似表示实物。显示器、环境光、打印、品牌配方和生产批次都会产生差异。大量采购和正式制作前，请用实际购买品牌与批次的实物色卡复核。完整来源见[色板来源](docs/palette-provenance.md)。

MARD、Artkal、Hama、Perler 等是第三方标识，本项目与这些品牌不存在隶属或官方背书关系。见[商标说明](TRADEMARKS.md)。

## 隐私与安全

- 图片在本地解码、转换和导出。
- JSON 工程不嵌入参考原图或原始文件名。
- SVG/HTML 不能作为图片上传。
- 文件大小、解码像素、工程大小、屏幕像素和导出像素都有上限。
- 转换在可取消 Worker 中运行，并拒绝过期结果覆盖新工程。
- Service Worker 只缓存同源应用资源。

安全问题请按 [SECURITY.md](SECURITY.md) 私下报告。公开 Issue 不要附带隐私图片、客户图片或无权公开的作品。

GitHub Pages 不会应用仓库里的可选 `_headers` 文件；具体托管安全边界见[部署说明](docs/deployment.zh-CN.md)。

## 仓库结构与贡献

```text
src/                      浏览器应用、几何 Module 和色板数据
public/                   PWA、离线缓存、隐私与许可页
tests/unit/               纯函数不变量测试
tests/e2e/                桌面与移动端浏览器测试
tests/fixtures/           自制或明确授权的测试图
scripts/                  源码检查、截图和单 HTML 构建
docs/                     架构、算法、部署、色板来源和 ADR
```

转换质量 Issue 最好包含原图尺寸、目标格数、模式、预期结构、实际缺陷，以及你有权公开的复现图片。开始前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。路线图见 [ROADMAP.md](ROADMAP.md)。

## 多端路线

当前主线是一套响应式 Web/PWA，并附带单 HTML，面向 Windows、macOS、Linux、Android 和 iOS 的现代浏览器。后续只有在出现真实文件、打印或应用商店需求并有维护者时，才考虑 Tauri、Capacitor 或小程序 Adapter。

## 许可证

代码采用 [Apache-2.0](LICENSE)。第三方数据和构建工具归属见 [NOTICE](NOTICE)。许可证允许商业复用，但不授予“豆格工坊”名称、Logo 或第三方品牌标识的使用权。

如果项目帮你省去一次手工描图，可以 Star 仓库、分享给其他拼豆爱好者，或提交可复现的改进建议；Star 不会解锁任何功能。

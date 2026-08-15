# 新手部署教程

**简体中文** · [English](deployment.md)

豆格工坊是纯静态浏览器应用。图片解码与转换发生在访问者自己的设备上；部署目录不包含账号、支付、卡密、图片上传或云端转换接口。

## 先判断你是否真的需要部署

- 只是制作拼豆图：直接使用[在线版](https://zwhy149.github.io/bead-grid-studio/)。
- 想断网使用：从 [Release](https://github.com/zwhy149/bead-grid-studio/releases/latest) 下载单 HTML。
- 想拥有自己的网址、名称、更新节奏或安全响应头：再部署 Fork。
- 支付、卡密、授权和订单不能写进这个静态前端，必须使用单独审核的服务端。

## 方案一：Fork 后部署 GitHub Pages

仓库已经包含 `.github/workflows/pages.yml`，会自动安装依赖、执行完整 QA、构建 `dist` 并通过官方 Pages Actions 发布。

1. 登录 GitHub，在仓库页面点击右上角 **Fork**。
2. 进入你 Fork 出来的仓库，打开 **Settings → Pages**。
3. 在 **Build and deployment** 中把 **Source** 设为 **GitHub Actions**。
4. 打开仓库的 **Actions** 页面。新 Fork 可能会提示先启用工作流，按提示确认。
5. 选择 **Deploy GitHub Pages**，点击运行；也可以向 `main` 推送一次提交触发部署。
6. 等待 build 和 deploy 两个任务都变成绿色。
7. 访问 `https://你的用户名.github.io/bead-grid-studio/`。

不要手工提交 `dist` 文件夹，工作流会从源码重新构建。GitHub 官方对权限和发布步骤的说明见 [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

### 如何更新 Fork

在 GitHub 仓库首页使用 **Sync fork** 同步上游，检查变更后重新运行 Pages 工作流。自己的名称、文案或功能修改应单独提交，后续同步时更容易辨认冲突。

### GitHub Pages 的安全边界

GitHub Pages 不解析 `public/_headers`，因此该文件中的 CSP、防嵌入、MIME、防引用和权限策略不会由 `github.io` 演示站应用。GitHub 会提供 HTTPS，但不要把仓库里存在 `_headers` 误当成线上已经生效。

## 方案二：Cloudflare Pages 连接 Git

需要每次推送后自动更新时，选择 Git integration：

1. 先 Fork 仓库。
2. 在 Cloudflare 打开 **Workers & Pages → Create → Pages → Connect to Git**。
3. 选择 Fork 和生产分支 `main`。
4. 填写：

   ```text
   Root directory: 留空（仓库根目录）
   Build command: npm run build
   Build output directory: dist
   Node.js: 仓库 .nvmrc 已固定 24；如平台未自动读取，可设置 NODE_VERSION=24
   ```

5. 部署并先打开平台提供的 `pages.dev` 地址。
6. 预览正常后，再从 Pages 项目里添加自定义域名。

Cloudflare Pages 等支持 `_headers` 约定的平台可以应用仓库附带的安全响应头。每次更换托管方式后仍应检查真实 HTTP 响应；仓库里有文件不代表平台一定采用。

## 方案三：Cloudflare Pages 直接上传

不想连接 GitHub 账号时，可以先在电脑上构建：

```bash
git clone https://github.com/zwhy149/bead-grid-studio.git
cd bead-grid-studio
npm ci
npm run build
```

完成后上传 **`dist` 文件夹**，不要上传仓库根目录，也不要只上传 Release 的单 HTML。

控制台步骤：

1. 打开 **Workers & Pages → Create application → Get started → Drag and drop**。
2. 输入项目名。
3. 拖入 `dist` 文件夹，或包含 `dist` 内部文件的 ZIP。
4. 点击 **Deploy site**。

也可以使用 Wrangler：

```bash
npx wrangler pages deploy dist --project-name=bead-grid-studio-demo
```

项目名只使用小写字母、数字和连字符，并换成你自己的名称。

Cloudflare 官方说明：Direct Upload 项目以后不能直接原地切换为 Git integration；若部署策略改变，需要新建项目。详见[官方 Direct Upload 教程](https://developers.cloudflare.com/pages/get-started/direct-upload/)。

## 部署前在本机预览

需要 Node.js 22.12 或更高版本：

```bash
npm ci
npm run build
npm run preview
```

打开 `http://127.0.0.1:4173/`。需要完整发布检查时：

```bash
npm run setup
npm run qa
```

## 部署完成后检查

1. 打开 `/healthz.json`，确认 `ok: true` 且版本正确。
2. 打开 `/version.json`，确认工程格式和色板来源正确。
3. 上传一张你有权公开的测试图，转换并导出 PNG。
4. 在线刷新一次；如需 PWA，再测试断网刷新。
5. 打开 `/privacy.html`、`/terms.html` 和 `/NOTICE.txt`。
6. 如果托管平台声称支持 `_headers`，检查实际响应头是否存在。

对支持 `_headers` 的托管平台执行：

```powershell
# Windows PowerShell
curl.exe -I https://你的网址/
```

```bash
# macOS / Linux
curl -I https://你的网址/
```

响应中至少应看到 `Content-Security-Policy`、`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY` 和 `Referrer-Policy: no-referrer`。GitHub Pages 是已经说明的例外，不会应用仓库中的 `_headers`。

## 常见问题

- **打开后空白或资源 404**：部署的应是 `dist`，不是仓库根目录。
- **GitHub Pages 一直不运行**：先启用 Fork 的 Actions，并在 Pages 设置中选择 GitHub Actions。
- **Cloudflare 显示源码目录**：Build output directory 填错，应为 `dist`。
- **自定义域名打不开**：先确认平台默认网址正常，再按平台当前 DNS 指引配置域名。
- **下载的 HTML 不能安装成 PWA**：单 HTML 用于离线打开；PWA 安装需要 HTTPS 托管版。

## 以后增加卡密或收费功能

图片转换应继续留在浏览器本地。支付、卡密、账号和订单需要独立后端、服务端验证、滥用防护、监控、隐私条款和数据保留规则。不要把密钥放进 `src`、`public`、浏览器打包文件，或任何会注入前端的环境变量。

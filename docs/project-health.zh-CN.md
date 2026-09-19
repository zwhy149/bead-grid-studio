# 项目健康度与公开影响证据

**简体中文** · [English](project-health.md)

本文为维护者、贡献者、审查者和开源支持计划提供可核验的 Bead Grid Studio 项目快照，并明确区分公开仓库证据与未知的产品访问数据。由于本项目遵循严格的本地优先与零遥测隐私设计，不收集用户会话与 Cookies，亦不上传用户作品。

---

## 项目实际交付

Bead Grid Studio 是本地优先的拼豆图纸生成器与像素工艺量化引擎：把本地图片转换成可编辑网格，保持原图比例，匹配固定来源的 221 色基础色板，并导出带坐标、辅助线、底板接缝、逐格色号和用料统计的施工图。在线版、PWA、无头 CLI 与单 HTML 离线版共用同一套 `@bead-grid/core` 核心实现。

---

## 可核验公开指标 (Verified Public Metrics)

*数据源：GitHub REST API (`api.github.com/repos/zwhy149/bead-grid-studio`) 与本地实际验证（2026年9月基线）*

| 指标 | 实测数值 | 核验方式 |
| :--- | :---: | :--- |
| **GitHub Stars** | **175** | 仓库首页或 `npm run health` |
| **GitHub Forks** | **19** | 仓库首页或 `npm run health` |
| **已发布正式版本** | **7** | GitHub Releases（`v1.0.0` 至 `v1.2.0`） |
| **Release 附件下载量** | **156+** | GitHub Release Assets API；单文件离线 `.html` 分发包 |
| **贡献者人数** | **3** | GitHub Contributors API |
| **开放 Issue 数** | **4** | GitHub Issues API（已剔除 Pull Requests） |
| **开放 Pull Requests** | **3** | GitHub Pull Requests API |
| **最新版本** | **v1.2.0** | GitHub Releases |
| **社区健康度评分** | **100%** | GitHub Community Profile API |
| **便携单 HTML 体积** | **414.5 KB** | `npm run build` 生成的单文件离线版 (`release/bead-grid-studio-v1.2.0.html`) |
| **单元测试通过数** | **38 passed** | `npm run test:unit`（Node.js 原生测试） |
| **确定性测试通过数** | **18 passed** | `npm run test:determinism`（8 组黄金夹具 3 轮运行位一致性断言） |
| **支持开放规范数** | **2 个 Schema** | JSON Schema 2020-12 (`schemas/pattern.schema.json`, `schemas/palette.schema.json`) |
| **核心算法库** | **ESM 独立包** | `@bead-grid/core`（0 外部运行时依赖） |
| **开源许可证** | **Apache-2.0** | [`LICENSE`](../LICENSE) |

---

## 我们不宣称的指标 (Metrics We Do Not Claim)

| 产品追踪指标 | 状态 | 架构原因 |
| :--- | :---: | :--- |
| **月活跃用户 (MAU)** | **无法提供 (Unavailable)** | 主动选择本地优先架构；不植入用户追踪 SDK |
| **日活跃用户 (DAU)** | **无法提供 (Unavailable)** | 零追踪 Cookies、零行为分析埋点 |
| **唯一活跃用户数** | **无法提供 (Unavailable)** | 零账号体系、无设备指纹收集 |
| **总转换次数 / 图纸生成量** | **无法提供 (Unavailable)** | 所有图片解码与颜色量化全在用户设备本地计算 |

### 本地优先与隐私边界说明

Bead Grid Studio 是主动选择的本地优先工具。用户的原始图片与生成的图纸数据完全保留在用户设备内存中，不会被上传到任何后端服务器或数据分析平台。

因此：
- GitHub 采用度、Release 离线包下载量与社区活跃度作为公开可核验的补充指标。
- **严禁将 GitHub Stars 宣称为用户数。**
- **严禁将 Release 下载量宣称为持续活跃用户。**

---

## 本地核验项目健康度

任何开发者均可运行维护脚本进行核验：

```bash
# 运行本地与公开指标健康度审计（输出 project-health.json）
npm run health

# 或直接调用 GitHub API 获取最新 Release 下载指标
npm run metrics

# 校验色板与图纸 JSON Schema 规范
npm run schema:validate
```

该脚本不会在网页产品中运行，也不会跟踪访问者。

---

## 社区维护证据

- 外部贡献 PR [#25](https://github.com/zwhy149/bead-grid-studio/pull/25) 已完成审查，通过 CI 与 CodeQL，并保留贡献者署名后合并。
- 外部提案 [#27](https://github.com/zwhy149/bead-grid-studio/pull/27) 收到了明确的修改要求：复用现有实体底板模型、补充测试并提供规格来源，不能新增一套未使用的平行配置。
- 仓库继续保留 [`good first issue`](https://github.com/zwhy149/bead-grid-studio/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) 和 [`help wanted`](https://github.com/zwhy149/bead-grid-studio/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)，没有为了缩小待办列表而由维护者全部抢做。
- 贡献、行为准则、支持、维护、安全和商标政策均已公开，并已启用私密漏洞报告。
- 受保护的 `main` 强制通过最新 CI 与 CodeQL、保持线性历史，并禁止强推和删除。

---

## 工程与发布证据

- 合并前执行确定性的源码、色板来源、单元测试、响应式浏览器、单文件、PWA/离线和转换回归检查。
- GitHub Actions 固定到不可变提交 SHA，并使用兼容 Node 24 的 Action 版本。
- Release 标签会校验软件包版本与标签一致，运行完整浏览器矩阵，构建单 HTML 和 ZIP，并发布 SHA-256 校验文件。
- 色板数据有固定来源和完整性哈希；仅仅“看起来像色卡”的数据不会被标注为厂商兼容。
- 架构在 [`docs/adr/`](adr/) 中记录本地优先和 Web 优先决策，并公开转换能力上限，不承诺小尺寸无损还原。

---

## 证据边界

- Stars、Forks 和下载量代表公开社区兴趣，并不等同于活跃用户数。
- 本项目未开启任何后端或三方分析工具，因此无法获知具体独立访问人次。
- 屏幕色号为实物近似值；显示设备、光照、批次差异均需实物色卡对照确认。

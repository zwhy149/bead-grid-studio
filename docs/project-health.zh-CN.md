# 项目健康度与公开影响证据

**简体中文** · [English](project-health.md)

本文为维护者、贡献者、审查者和开源支持计划提供可核验的 Bead Grid Studio 项目快照，并明确区分公开仓库证据与未知的产品访问数据。

## 项目实际交付

Bead Grid Studio 是本地优先的拼豆图纸生成器：把本地图片转换成可编辑网格，保持原图比例，匹配固定来源的 221 色基础色板，并导出带坐标、辅助线、底板接缝、逐格色号和用料统计的施工图。在线版、PWA 与单 HTML 离线版共用同一套实现。

项目没有图片上传后端，也没有统计 SDK。原图像素留在用户设备中，托管成本较低；相应地，仓库也不会虚构独立用户数或累计转换次数。

## 可核验公开快照

以下数据于 **2026-08-31** 通过 GitHub 公开 API 获取：

| 指标 | 数值 | 核验方式 |
| --- | ---: | --- |
| GitHub Stars | 148 | 仓库首页或 `npm run metrics` |
| Forks | 14 | 仓库首页或 `npm run metrics` |
| 已发布版本 | 7 | GitHub Releases 或 `npm run metrics` |
| Release 附件下载量 | 95 | `npm run metrics`；不含 GitHub 自动源码包 |
| Community Health | 100% | GitHub Community Profile API |
| 许可证 | Apache-2.0 | [`LICENSE`](../LICENSE) |

这些是带日期的快照，不是增长承诺。可运行以下命令，直接从 GitHub 重新获取当前 Stars、Forks、开放 Issue、Release 和附件下载量：

```bash
npm ci
npm run metrics
```

该脚本不会在网页产品中运行，也不会跟踪访问者。

## 社区维护证据

- 外部贡献 PR [#25](https://github.com/zwhy149/bead-grid-studio/pull/25) 已完成审查，通过 CI 与 CodeQL，并保留贡献者署名后合并。
- 外部提案 [#27](https://github.com/zwhy149/bead-grid-studio/pull/27) 收到了明确的修改要求：复用现有实体底板模型、补充测试并提供规格来源，不能新增一套未使用的平行配置。
- 仓库继续保留 [`good first issue`](https://github.com/zwhy149/bead-grid-studio/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) 和 [`help wanted`](https://github.com/zwhy149/bead-grid-studio/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)，没有为了缩小待办列表而由维护者全部抢做。
- 贡献、行为准则、支持、维护、安全和商标政策均已公开，并已启用私密漏洞报告。
- 受保护的 `main` 强制通过最新 CI 与 CodeQL、保持线性历史，并禁止强推和删除。

## 工程与发布证据

- 合并前执行确定性的源码、色板来源、单元测试、响应式浏览器、单文件、PWA/离线和转换回归检查。
- GitHub Actions 固定到不可变提交 SHA，并使用兼容 Node 24 的 Action 版本。
- Release 标签会校验软件包版本与标签一致，运行完整浏览器矩阵，构建单 HTML 和 ZIP，并发布 SHA-256 校验文件。
- 色板数据有固定来源和完整性哈希；仅仅“看起来像色卡”的数据不会被标注为厂商兼容。
- 架构在 [`docs/adr/`](adr/) 中记录本地优先和 Web 优先决策，并公开转换能力上限，不承诺小尺寸无损还原。

## 当前适合获得贡献或工具支持的工作

1. 抽离无 DOM 的转换引擎，确保 Worker 与测试适配器行为一致。
2. 使用可再分发素材发布 16/24/32/48/60 格可复现质量基准。
3. 为按色制作流程增加键盘和屏幕阅读器回归覆盖。
4. 设计带来源、指纹和确定性工程映射的版本化自定义色板协议。

这些任务记录在 [`ROADMAP.md`](../ROADMAP.md) 和 GitHub Issues 中，是可验证的维护工作，不是没有实现依据的平台承诺。

## 证据边界

- Stars、Forks 和下载量说明公开关注度，但不能等同于活跃用户数。
- 本仓库没有 GitHub Pages 访问统计，因此无法提供真实访客数。
- 屏幕颜色只是实物拼豆近似值；品牌、批次、光线和显示设备差异仍需用实物色卡核对。
- 本文不能保证项目一定通过任何资助、额度或开源支持计划；最终资格由对应计划独立判断。

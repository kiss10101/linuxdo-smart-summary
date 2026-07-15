# Linux.do 智能总结

<p align="center">
  <strong>一个公开维护的 Tampermonkey 用户脚本，用于 Linux.do 主题总结、导出和追问。</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> ·
  <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="https://github.com/kiss10101/linuxdo-smart-summary/releases/download/v7.6.1/linuxdo-smart-summary-7.6.1.user.js">安装稳定版 7.6.1</a> ·
  <a href="https://github.com/kiss10101/linuxdo-smart-summary/releases/download/v7.8.0-alpha.1/linuxdo-smart-summary-7.8.0-alpha.1.user.js">预览版 7.8.0-alpha.1</a> ·
  <a href="https://github.com/kiss10101/linuxdo-smart-summary/releases">Releases</a> ·
  <a href="./CHANGELOG.md">更新日志</a>
</p>

<p align="center">
  <img alt="stable" src="https://img.shields.io/badge/stable-7.6.1-2563eb">
  <img alt="preview" src="https://img.shields.io/badge/preview-7.8.0--alpha.1-f59e0b">
  <img alt="platform" src="https://img.shields.io/badge/platform-linux.do-16a34a">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-64748b">
</p>

## 项目定位

`Linux.do 智能总结` 是一个浏览器用户脚本，用于在 Linux.do 主题页内进行
AI 总结、内容导出和后续追问。AI 服务由用户在侧边栏里配置，兼容 OpenAI
风格接口。

这个仓库是公开发布工作区：可维护的 ES 模块位于 `src/`，构建工具将其确定性地
打包为 `dist/` 下的单文件 userscript；`tests/` 与 `fixtures/` 保存源码测试和
合成测试数据。

## 发布通道

| 通道 | 版本 | 适用场景 | 说明 |
| --- | --- | --- | --- |
| 稳定版 | `7.6.1` | 需要最稳妥的安装版本 | 以已验证的 `7.6` 运行时为基础，固定 marked/DOMPurify 依赖并使用隐私清理后的公开 fixture |
| 预览版 | `7.8.0-alpha.1` | 需要模块化架构预览版 | 维护端拆为 27 个源码模块，安装端仍是一个油猴脚本；增加确定性构建，并让模型列表请求可取消、可超时 |

版本线：

```text
7.8.0-alpha.1 -> 7.8.0-beta.1 -> 7.8.0
```

GitHub 会把最新的非 prerelease 版本标记为 `Latest`；稳定版 `7.6.1` 仍是默认安装目标，
`7.8.0-alpha.1` 是当前 prerelease 预览版。架构迁移只设一个 alpha、一个 beta 和
一个正式版；历史 `7.7` 条目保留在 CHANGELOG 中用于审计，不再算作迁移发布站点。

## 核心行为

| 模块 | 当前行为 |
| --- | --- |
| 楼层范围映射 | 以 `post.post_number` 为准，快捷范围可先用缓存 topic 元数据预填，但最终仍用 no-store topic `highest_post_number` 确认全部/最近 |
| Linux.do 请求节奏 | 串行拉取 `posts.json` 批次 |
| 大范围请求防护 | 在总结/导出范围过大时提前停止，避免 `posts.json` 批次数无上限增长 |
| 运行时调度 | 合并流式 Markdown 渲染，并节流拖拽/滚动等高频事件 |
| 主题页启动 | 只在 Linux.do 主题路由创建侧栏，非主题页保留轻量 SPA 路由监听 |
| AI 重试路径 | AI 空回或报错后，复用当前标签页内刚获取的总结文本 |
| 总结后对话 | UI 元数据和服务返回的推理不会进入后续 API 请求；空回/只有推理会显示为可恢复错误；消息支持右键复制、编辑、重新生成和删除 |
| 推理内容显示 | 将服务商结构化推理与答案文本分离，兼容仅位于响应开头的推理标签，使用无障碍可折叠面板，并在停止、过滤、长度上限或上游失败时保留部分输出 |
| 上游错误诊断 | 显示 HTTP 状态、服务商错误码/类型、非 JSON 响应提示、SSE 错误帧和 `finish_reason` 说明，同时避免暴露 API Key |
| AI 控制与来源 | 只停止当前 AI 服务商请求，不取消 Linux.do 拉帖，并展示每次 AI 请求实际使用的 API 配置快照 |
| 设置同步 | 通过 Tampermonkey 存储监听同步其他标签页的设置变更，只更新设置 UI 和对话提示词内存，不触发主题、范围、总结、导出或模型列表请求 |
| 总结选区 | 可将选中的总结文本带入后续对话，用于解释、追问、局部总结或插入输入框 |
| 回复关系 | 保留被回复楼层信息，包括已删除或当前不可见的目标楼层 |
| 引用归因 | 在 AI 上下文中保留引用/转发 Discourse 链接的来源用户、主题、楼层、标题和 URL |
| HTML 转文本安全 | 通过 inert DOM 转换 cooked HTML，移除非内容嵌入节点，并在不使用正则剥标签的情况下读取纯文本 |
| 帖子时间 | 将主贴和每条回复的 `created_at` 以 ISO 8601 UTC 写入总结/追问 AI 上下文；HTML 与 AI 文本导出继续包含帖子时间 |
| Boosts | 从现有 Discourse JSON 载荷中读取 boosts |
| 总结覆盖报告 | 展示请求范围、主题真实最高楼层、实际可见楼层数、缓存状态和回看校准状态 |
| 导出 | 将明确拉取到的帖子集合导出为 HTML 或 AI 可读文本 |
| 模型选择 | 仅在请求进行中禁用两个获取按钮；关闭弹窗、15 秒超时、成功、失败或 UI 销毁都会取消请求或恢复按钮 |
| API 配置档案 | 点击配置卡片立即切换，并自动持久化编辑、新增、复制和删除 |

## 网络模型

Linux.do 请求运行在浏览器页面上下文中，使用当前用户登录态和同源凭据。
脚本不使用独立爬虫会话，也不做 Cloudflare 绕过。

| 用途 | 请求 |
| --- | --- |
| 主题元数据 | `GET https://linux.do/t/-/{topicId}.json` |
| 帖子批次 | `GET https://linux.do/t/{topicId}/posts.json?post_ids[]=...` |
| 模型列表 | 用户配置的 `{apiUrl}/models`，不访问 Linux.do |
| AI 对话 | 用户配置的 OpenAI 兼容 chat completion 接口 |

常规 Linux.do 帖子拉取策略：

| 参数 | 值 |
| --- | --- |
| 批次大小 | `200` 个 post ID |
| 并发 | `1` |
| 批次启动间隔 | `600ms` |

受控 fallback 校准策略：

| 参数 | 值 |
| --- | --- |
| 并发 | `1` |
| 批次间隔 | `600ms` |
| 回看步长 | `40` 个 stream ID |
| 最大回看 | `240` 个 stream ID |

短时总结内容缓存只服务于“AI 总结失败后立即重试”这个路径。另有一个 60 秒的
topic JSON 短缓存，只用于让范围设置、总结和导出共享同一份主题元数据请求；
两者都不是持久化主题数据库。

## 仓库结构

| 路径 | 用途 |
| --- | --- |
| `src/` | 可维护的 ES 模块和 userscript 元数据模板 |
| `dist/` | 可安装 userscript 构建文件 |
| `tests/` | 直接调用源码模块的行为与生命周期测试 |
| `tools/` | 本地校验和发布工具 |
| `fixtures/` | 可重复的合成测试数据 |
| `.github/` | Release workflow 和仓库自动化 |
| `package.json` | 可复现构建与统一校验入口 |

## 验证命令

在仓库根目录安装锁定工具链、构建单文件脚本，并执行源码、行为、架构、隐私与
发布一致性校验：

```bash
npm ci
npm run build
npm run verify
node --check "dist/Linux.do 智能总结-7.8.0-alpha.1.user.js"
node tools/verify-release.mjs 7.8.0-alpha.1
node tools/check-all.mjs 7.8.0-alpha.1
```

`dist/` 是生成物。修改应发生在 `src/`，随后运行 `npm run build`，并让源码和对应
生成文件一同进入变更。生成物陈旧或构建不确定时，`npm run verify` 会失败。

## 自动发版

GitHub Release 由 `.github/workflows/release.yml` 发布。

- Pull Request 和普通 `master` 推送会运行只读的 `CI` workflow。
- 推送新标签，例如 `v7.8.0-alpha.1`，会自动触发发版。
- 对已经存在的标签，可以在 GitHub Actions 页面手动运行 `Release` workflow，输入 `7.8.0-alpha.1` 来发布或修复该版本的 Release。
- 普通 `master` 推送不会发布 Release；发版任务只由标签或手动运行触发。
- workflow 会从 `package-lock.json` 安装依赖、重建 `dist/`、拒绝生成漂移、执行完整校验，再从 `release-manifest.json` 选择 asset，并用 GitHub Actions 自带的 `GITHUB_TOKEN` 上传。

## 隐私与安全

不要向仓库提交真实 API Key、浏览器 Cookie（browser cookies）、会话令牌、
Cloudflare clearance、导出的主题内容、真实用户头像、受限主题快照或本机路径。
仓库 fixture 只使用合成身份和主题编号，非真实 URL 使用 `example.invalid` 保留域名。

运行时配置保存在用户自己的浏览器扩展存储中。API Key 只发送到用户选择的服务商
接口。只有用户主动触发总结或追问时，脚本才会把 Linux.do 内容发送给该服务商；
其中可能包括当前账号有权查看的受限内容，以及纳入上下文的每条帖子的 `created_at` 时间戳。

脚本发送的是提取后的文本以及图片/附件 URL，不会把 browser cookies 发送给 AI
服务商，也不会下载图片二进制后再次上传。若某个 URL 无需用户浏览器登录态即可访问，
AI 服务商可能自行请求该 URL。

服务商返回的推理字段和答案字段都按不可信模型输出处理：流式推理只作为转义后的
纯文本显示，完成后的 Markdown 渲染必须经过严格清理；推理面板禁止远程媒体和主动
嵌入内容。界面将其标为“服务返回的推理内容”或“推理摘要”，不宣称它是模型完整、
私有或真实的思维链。

私密漏洞报告方式和仓库数据规则见 `SECURITY.md`。

## 来源与署名

本项目基于 GreasyFork 用户脚本整理：

- 页面：<https://greasyfork.org/zh-CN/scripts/558028-linux-do-%E6%99%BA%E8%83%BD%E6%80%BB%E7%BB%93>
- 发布者：`Passerby1011`
- 原始 metadata 作者：`半杯无糖、WolfHolo、LD Export`
- 原始许可证：`MIT`

发布版 userscript 保留原始 `@author` 和 `@license` 元数据，并在脚本内部的
更新摘要中记录本仓库的发布改动。

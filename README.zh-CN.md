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
  <a href="https://github.com/kiss10101/linuxdo-smart-summary/releases">Releases</a> ·
  <a href="./CHANGELOG.md">更新日志</a>
</p>

<p align="center">
  <img alt="stable" src="https://img.shields.io/badge/stable-7.6.1-2563eb">
  <img alt="platform" src="https://img.shields.io/badge/platform-linux.do-16a34a">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-64748b">
</p>

## 项目定位

`Linux.do 智能总结` 是一个浏览器用户脚本，用于在 Linux.do 主题页内进行
AI 总结、内容导出和后续追问。AI 服务由用户在侧边栏里配置，兼容 OpenAI
风格接口。

这个仓库是公开发布工作区：`dist/` 保存可安装脚本，`tools/` 保存本地校验和
发布工具，`fixtures/` 只保存合成测试数据。

## 发布通道

| 通道 | 版本 | 适用场景 | 说明 |
| --- | --- | --- | --- |
| 稳定版 | `7.6.1` | 需要最稳妥的安装版本 | 以已验证的 `7.6` 运行时为基础，固定 marked/DOMPurify 依赖并使用隐私清理后的公开 fixture |

版本线：

```text
7.6.1
```

GitHub 会把稳定版 `7.6.1` 标记为 `Latest`，并作为公开仓库的初始安装目标。

公开 Git 历史从隐私清理后的 `7.6.1` 稳定基线开始。更早的开发提交和
prerelease 标签保留在私有归档中；公开仓库通过 CHANGELOG 保留版本语义，
但不导入私有历史。

## 核心行为

| 模块 | 当前行为 |
| --- | --- |
| 楼层范围映射 | 以 `post.post_number` 为准，快捷范围可先用缓存 topic 元数据预填，但最终仍用 no-store topic `highest_post_number` 确认全部/最近 |
| Linux.do 请求节奏 | 串行拉取 `posts.json` 批次 |
| 大范围请求防护 | 在总结/导出范围过大时提前停止，避免 `posts.json` 批次数无上限增长 |
| 运行时调度 | 合并流式 Markdown 渲染，并节流拖拽/滚动等高频事件 |
| 主题页启动 | 只在 Linux.do 主题路由创建侧栏，非主题页保留轻量 SPA 路由监听 |
| AI 重试路径 | AI 空回或报错后，复用当前标签页内刚获取的总结文本 |
| 总结后对话 | UI 元数据不会进入 API 请求；AI 空回/只有思考会显示为可恢复错误；消息支持右键复制、编辑、重新生成和删除 |
| 上游错误诊断 | 显示 HTTP 状态、服务商错误码/类型、非 JSON 响应提示、SSE 错误帧和 `finish_reason` 说明，同时避免暴露 API Key |
| AI 控制与来源 | 只停止当前 AI 服务商请求，不取消 Linux.do 拉帖，并展示每次 AI 请求实际使用的 API 配置快照 |
| 设置同步 | 通过 Tampermonkey 存储监听同步其他标签页的设置变更，只更新设置 UI 和对话提示词内存，不触发主题、范围、总结、导出或模型列表请求 |
| 总结选区 | 可将选中的总结文本带入后续对话，用于解释、追问、局部总结或插入输入框 |
| 回复关系 | 保留被回复楼层信息，包括已删除或当前不可见的目标楼层 |
| 引用归因 | 在 AI 上下文中保留引用/转发 Discourse 链接的来源用户、主题、楼层、标题和 URL |
| Boosts | 从现有 Discourse JSON 载荷中读取 boosts |
| 总结覆盖报告 | 展示请求范围、主题真实最高楼层、实际可见楼层数、缓存状态和回看校准状态 |
| 导出 | 将明确拉取到的帖子集合导出为 HTML 或 AI 可读文本 |
| 模型选择 | 从用户配置的 OpenAI 兼容接口读取模型列表 |
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
| `dist/` | 可安装 userscript 构建文件 |
| `tools/` | 本地校验和发布工具 |
| `fixtures/` | 可重复的合成测试数据 |
| `.github/` | Release workflow 和仓库自动化 |

## 验证命令

在仓库根目录执行：

```bash
node --check "dist/Linux.do 智能总结-7.6.1.user.js"
node --check tools/range-mapping-local-check.mjs
node --check tools/reply-relation-local-check.mjs
node --check tools/fetch-posts-batch-local-check.mjs
node --check tools/summary-content-cache-local-check.mjs
node --check tools/chat-message-actions-local-check.mjs
node --check tools/ai-upstream-errors-local-check.mjs
node --check tools/ai-control-source-sync-local-check.mjs
node --check tools/api-profiles-local-check.mjs
node --check tools/range-refresh-local-check.mjs
node --check tools/summary-selection-local-check.mjs
node --check tools/runtime-performance-local-check.mjs
node --check tools/quote-attribution-local-check.mjs
node --check tools/boosts-local-check.mjs
node --check tools/topic-identity-local-check.mjs
node --check tools/topic-bounds-local-check.mjs
node --check tools/public-repository-local-check.mjs
node --check tools/verify-release.mjs
node --check tools/check-all.mjs

node tools/range-mapping-local-check.mjs fixtures/post-stream-gap.fixture.json
node tools/reply-relation-local-check.mjs fixtures/reply-relation.fixture.json
node tools/fetch-posts-batch-local-check.mjs fixtures/fetch-posts-batch.fixture.json
node tools/summary-content-cache-local-check.mjs fixtures/summary-content-cache.fixture.json
node tools/chat-message-actions-local-check.mjs fixtures/chat-message-actions.fixture.json 7.6.1
node tools/api-profiles-local-check.mjs 7.6.1
node tools/summary-selection-local-check.mjs fixtures/summary-selection.fixture.json 7.6.1
node tools/quote-attribution-local-check.mjs fixtures/quote-attribution.fixture.json
node tools/boosts-local-check.mjs fixtures/boosts.fixture.json
node tools/topic-identity-local-check.mjs fixtures/topic-identity.fixture.json
node tools/topic-bounds-local-check.mjs fixtures/topic-bounds.fixture.json
node tools/public-repository-local-check.mjs 7.6.1
node tools/verify-release.mjs 7.6.1
node tools/check-all.mjs 7.6.1
```

预期 fixture 输出：

```text
All cases passed. Old slice mismatches demonstrated: 4
All reply relation cases passed.
All fetch batch cases passed.
All summary content cache cases passed.
All chat message action cases passed.
API profiles check passed for 7.6.1.
All summary selection cases passed.
All quote attribution cases passed.
All boost formatting cases passed.
All topic identity cases passed.
Topic bounds local check passed.
Public repository check passed for 7.6.1.
Release verification passed for 7.6.1.
All local checks passed.
```

## 自动发版

GitHub Release 由 `.github/workflows/release.yml` 发布。

- 推送新标签，例如 `v7.6.1`，会自动触发发版。
- 对已经存在的标签，可以在 GitHub Actions 页面手动运行 `Release` workflow，输入 `7.6.1` 来发布或修复该版本的 Release。
- 普通 `master` 推送不会发布 Release；发版任务只由标签或手动运行触发。
- workflow 会执行 `node tools/check-all.mjs <version>`，从 `release-manifest.json` 准备重命名后的 asset，并用 GitHub Actions 自带的 `GITHUB_TOKEN` 上传。

## 隐私与安全

不要向仓库提交真实 API Key、浏览器 Cookie（browser cookies）、会话令牌、
Cloudflare clearance、导出的主题内容、真实用户头像、受限主题快照或本机路径。
仓库 fixture 只使用合成身份和主题编号，非真实 URL 使用 `example.invalid` 保留域名。

运行时配置保存在用户自己的浏览器扩展存储中。API Key 只发送到用户选择的服务商
接口。只有用户主动触发总结或追问时，脚本才会把 Linux.do 内容发送给该服务商；
其中可能包括当前账号有权查看的受限内容。

脚本发送的是提取后的文本以及图片/附件 URL，不会把 browser cookies 发送给 AI
服务商，也不会下载图片二进制后再次上传。若某个 URL 无需用户浏览器登录态即可访问，
AI 服务商可能自行请求该 URL。

私密漏洞报告方式和仓库数据规则见 `SECURITY.md`。

## 来源与署名

本项目基于 GreasyFork 用户脚本整理：

- 页面：<https://greasyfork.org/zh-CN/scripts/558028-linux-do-%E6%99%BA%E8%83%BD%E6%80%BB%E7%BB%93>
- 发布者：`Passerby1011`
- 原始 metadata 作者：`半杯无糖、WolfHolo、LD Export`
- 原始许可证：`MIT`

发布版 userscript 保留原始 `@author` 和 `@license` 元数据，并在脚本内部的
更新摘要中记录本仓库的发布改动。

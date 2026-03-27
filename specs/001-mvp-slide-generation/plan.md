---
source: spec.md
source_hash: d11491bbe3941921ac6f583c8a640f253e90d8788fdbb09ddfb3b6b9c14a1455
status: current
generated_at: 2026-03-27T17:30:00+08:00
---

# SlideForge MVP — Technical Plan

## 方向摘要

我們打算這樣做：
- 用 **Bun + TypeScript** 寫一個輕量 CLI 工具，背後呼叫跑在 Docker 裡的 **Presenton** 引擎來生成簡報
- CLI 透過 **MCP 協議**（Streamable HTTP）與引擎溝通，這是 Presenton 原生支援的介面
- 使用者只需要做三件事：設定 Google API Key → 啟動引擎 → 下一句指令就拿到 PPTX
- 主要風險：Presenton MCP endpoint 的穩定性尚未實測。對策是同時實作 REST API fallback

**需要業務確認的決策**：
1. **圖像生成 provider**：MVP 先綁 `nanobanana_pro`（用 Google API Key），因為這是需求文件指定的。OK？
2. **LLM provider**：Presenton 需要 LLM 來生成簡報大綱。MVP 先用 `gemini`（同一把 Google API Key），還是你有偏好的 provider？

---
（以下為技術細節）

## Constitution Check

| 原則 | Plan 如何對齊 | 狀態 |
|------|-------------|------|
| CLI-first，不做 Web UI | CLI 是唯一介面，Presenton 的 Web UI 不暴露給使用者 | ✅ |
| 引擎不自幹，包裝現有開源 | 核心生成邏輯 100% 委託 Presenton | ✅ |
| API Key 永遠在使用者手上 | 從 .env 讀取，透過 Docker env 傳入容器，不經過任何第三方 | ✅ |
| 繁體中文為預設語言 | CLI 預設 `--lang "Traditional Chinese"` | ✅ |
| 容器隔離引擎，host 跑 CLI | Presenton 跑在 Docker，CLI 用 Bun 跑在 host | ✅ |

## Technical Context

| 項目 | 選擇 |
|------|------|
| **Language/Version** | TypeScript 5.x, Bun >= 1.3 |
| **CLI Framework** | `commander` (MIT) |
| **MCP Client** | `@modelcontextprotocol/sdk` (MIT) |
| **HTTP Client** | Bun 內建 `fetch`（REST API fallback 用） |
| **Docker 管理** | 直接 shell out `docker` CLI（`Bun.spawn()`） |
| **Config** | `.env` 讀取用 Bun 內建 `process.env`（Bun 自動載入 .env） |
| **Testing** | `bun:test`（Bun 內建測試框架） |
| **Target Platform** | Linux (WSL2) |
| **Performance Goal** | 8 頁簡報 < 3 分鐘（瓶頸在 Presenton 引擎側） |

## Project Structure

```
slideforge/
├── src/
│   ├── index.ts              # Entry point, CLI registration
│   ├── commands/
│   │   ├── generate.ts       # `slideforge generate` command
│   │   ├── engine.ts         # `slideforge engine start/stop/status`
│   │   └── init.ts           # `slideforge init` (.env scaffolding)
│   ├── client/
│   │   ├── mcp-client.ts     # MCP Streamable HTTP client
│   │   └── rest-client.ts    # REST API fallback client
│   ├── engine/
│   │   └── docker.ts         # Docker container lifecycle management
│   └── config/
│       └── env.ts            # .env 讀取 + validation
├── tests/
│   ├── unit/
│   │   ├── config.test.ts
│   │   └── commands.test.ts
│   └── integration/
│       └── generate.test.ts  # 需要 Docker 運行
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── docker-compose.yml        # Presenton 引擎定義
```

**選擇 flat single-project 結構的原因**：這是一個 CLI 工具，沒有前後端分離的需求。保持簡單。

## Architecture Decisions

### AD-001: MCP-first，REST fallback

**Context**: Presenton 同時暴露 MCP（port 8001）和 REST API（port 8000），兩者都在同一個容器內經 nginx 反代。需要決定 CLI 用哪個介面。

**Decision**: 優先用 MCP（`http://localhost:5000/mcp`），連線失敗時自動 fallback 到 REST API（`http://localhost:5000/api/v1/`）。

**Why**:
- MCP 是 Presenton 原生支援的標準介面，tool 定義清楚（`generate_presentation`）
- 未來 Claude Code Skill 整合（US-07）天然需要 MCP
- REST API 作為 fallback 保險，因為 MCP Streamable HTTP transport 的穩定性尚未驗證

**Alternatives Rejected**:
- 只用 REST API：放棄 MCP 生態的未來整合優勢
- 只用 MCP：風險過高，沒有退路

### AD-002: Shell out Docker CLI，不用 Docker SDK

**Context**: 需要管理 Presenton 容器的生命週期（start/stop/status）。

**Decision**: 用 `Bun.spawn()` 直接呼叫 `docker` / `docker compose` CLI。

**Why**:
- 只需要 3 個操作（start/stop/status），SDK 太重
- 使用者的 WSL2 環境已有 Docker CLI
- 零額外依賴

**Alternatives Rejected**:
- `dockerode`（Docker SDK for Node）：額外依賴，操作簡單不值得

### AD-003: 用 docker-compose.yml 管理引擎配置

**Context**: Presenton 容器需要傳入多個環境變數（LLM provider、API Key、Image provider）和 volume mount。

**Decision**: 專案根目錄放一個 `docker-compose.yml`，`slideforge engine start` 實際執行 `docker compose up -d`。

**Why**:
- 環境變數多（LLM、IMAGE_PROVIDER、API Key），寫在 compose file 比 `docker run` 的長串 `-e` 更可讀
- Volume mount (`./app_data:/app_data`) 也寫在 compose 裡，避免每次手動指定
- compose file 可以進版控，團隊共享設定

### AD-004: 同步 API 呼叫，不用非同步 + polling

**Context**: Presenton 提供同步（`/generate`）和非同步（`/generate/async` + `/status/{id}`）兩種生成方式。

**Decision**: MVP 用同步 API。CLI 在等待期間顯示 spinner。

**Why**:
- 8 頁簡報預期 < 3 分鐘，同步等待可接受
- 非同步 + polling 增加程式碼複雜度，MVP 不需要
- MCP 的 `generate_presentation` tool 本身就是同步呼叫

**Alternatives Rejected**:
- 非同步 + SSE streaming：更好的 UX（逐頁顯示進度），但 MVP 階段複雜度不值得

### AD-005: PPTX 從容器 volume 取出

**Context**: Presenton 生成的 PPTX 存在容器內的 `/app_data/` 路徑。需要讓 host 側拿到檔案。

**Decision**: 透過 Docker volume mount（`./app_data:/app_data`），生成完成後 CLI 從 host 的 `./app_data/` 目錄複製 PPTX 到使用者指定位置（預設當前目錄）。

**Why**:
- Volume mount 是最簡單的檔案共享方式
- 不需要額外的 file download API
- Presenton 的 API response 會回傳容器內路徑，對應到 host 的 `./app_data/` 下

## Complexity Tracking

| 指標 | 數值 | 門檻 | 狀態 |
|------|------|------|------|
| Dependencies | 3 (`commander`, `@modelcontextprotocol/sdk`, `ora`) | ≤ 8 | ✅ |
| Data models | 0（無持久化，全部委託 Presenton） | ≤ 6 | ✅ |
| API endpoints | 0（CLI 工具，不對外提供 API） | ≤ 12 | ✅ |
| External integrations | 1（Presenton MCP/REST） | ≤ 3 | ✅ |

## MVP Scope Mapping

| User Story | Plan 覆蓋 | 備註 |
|-----------|----------|------|
| US-01 一句話生成簡報 | ✅ | `generate` command + MCP client |
| US-02 自訂簡報參數 | ✅ | CLI flags → MCP tool params |
| US-03 引擎一鍵啟動 | ✅ | `engine` command + docker compose |
| US-04 API Key 管理 | ✅ | `init` command + .env validation |
| US-05 文件轉簡報 | ⏭️ P2 | Presenton 支援 file upload，後續加 `--from` flag |
| US-06 自訂模板 | ⏭️ P2 | Presenton 支援 template，後續加 `--template` flag |
| US-07 Claude Code Skill | ⏭️ P2 | CLI 穩定後再包 Skill |

---
source: spec.md + plan.md
spec_hash: d11491bbe3941921ac6f583c8a640f253e90d8788fdbb09ddfb3b6b9c14a1455
plan_hash: 566c37206d2407b83ced734c9f0ba37dc38ce956e6bafedc482fa4cd48e118c3
status: current
generated_at: 2026-03-27T18:00:00+08:00
---

# Tasks: SlideForge MVP

**Spec**: specs/001-mvp-slide-generation/spec.md | **Plan**: plan.md | **Generated**: 2026-03-27
**Total Tasks**: 22 | **Phases**: 8 | **Waves**: 8

## Format: `[ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no shared state)
- **[USn]**: Which user story this belongs to

---

## Phase 1: Setup

- [x] T-001 建立專案目錄結構，依照 plan.md 的 Project Structure 建立所有資料夾
- [x] T-002 初始化 Bun 專案：`bun init` + 安裝 dependencies（commander, @modelcontextprotocol/sdk, ora）+ devDependencies（@types/node, typescript）
- [x] T-003 [P] 建立 `tsconfig.json` — strict mode, ESNext target, module resolution bundler
  **禁止修改**: src/, tests/
- [x] T-004 [P] 建立 `.gitignore` — 包含 node_modules, .env, app_data/, dist/
  **禁止修改**: src/, tests/, tsconfig.json

---

## Phase 2: Foundational

⚠️ **BLOCKS all user stories** — 必須完成才能進入 Phase 3+

- [x] T-005 [US-04] 實作 config 模組於 `src/config/env.ts` — 負責：loadEnv(), validateEnv(), getRequiredEnv(key)。驗證 GOOGLE_API_KEY 存在且非空，缺少時回傳結構化錯誤訊息
  **禁止修改**: src/commands/, src/client/, src/engine/
- [x] T-006 [P] 建立 `docker-compose.yml` — Presenton 引擎定義：image ghcr.io/presenton/presenton:latest, port 5000:80, volume ./app_data:/app_data, env_file .env, 環境變數 LLM=gemini, IMAGE_PROVIDER=nanobanana_pro
  **禁止修改**: src/, tests/
- [x] T-007 [P] 建立 `.env.example` — 包含 GOOGLE_API_KEY=your_key_here 和註解說明
  **禁止修改**: src/, tests/, docker-compose.yml
- [x] T-008 建立 CLI entry point `src/index.ts` — 註冊 commander program，設定 name(slideforge), version, description。引入但先不實作子指令
  (depends on T-002)
  **禁止修改**: src/config/, src/client/, src/engine/

📍 **Checkpoint**: 基礎架構就緒 — `bun run src/index.ts --help` 可顯示 CLI 說明

---

## Phase 3: US-04 — API Key 安全管理 (P1) 🎯 MVP

**Goal**: 使用者可透過 `slideforge init` 初始化環境設定，CLI 自動讀取 .env 中的 API Key
**Independent Test**: 執行 `slideforge init` 確認產出 .env.example，執行 generate 時缺 key 顯示明確錯誤

### Implementation

- [x] T-009 [US-04] 實作 init command 於 `src/commands/init.ts` — 負責：檢查 .env.example 是否存在、複製範本、檢查 .gitignore 是否包含 .env（不存在則建立/追加）、提示使用者設定 key
  (depends on T-008)
  **禁止修改**: src/config/, src/client/, src/engine/
- [x] T-010 [US-04] 為 init command 撰寫單元測試於 `tests/unit/init.test.ts` — 測試：.env.example 建立、.gitignore 更新、重複執行冪等性
  (depends on T-009)
  **禁止修改**: src/

📍 **Checkpoint**: US-04 完成 — `slideforge init` 可建立環境設定檔，缺 key 時 CLI 顯示錯誤

---

## Phase 4: US-03 — 引擎環境一鍵啟動 (P1) 🎯 MVP

**Goal**: 使用者可透過 `slideforge engine start/stop/status` 管理 Presenton 容器
**Independent Test**: 執行 start 啟動容器 → status 確認運行中 → stop 停止容器

### Implementation

- [x] T-011 [US-03] 實作 Docker 管理模組於 `src/engine/docker.ts` — 負責：startEngine(), stopEngine(), getEngineStatus(), healthCheck()。用 Bun.spawn() 呼叫 docker compose up -d / down / ps。healthCheck 用 fetch 打 http://localhost:5000 確認回應
  (depends on T-005, T-006)
  **禁止修改**: src/commands/, src/client/
- [x] T-012 [US-03] 實作 engine command 於 `src/commands/engine.ts` — 子指令 start/stop/status，呼叫 docker.ts 的對應函式。start 前驗證 .env 存在（用 env.ts），顯示 spinner（ora）等待健康檢查通過
  (depends on T-011, T-008)
  **禁止修改**: src/client/, src/engine/docker.ts
- [x] T-013 [US-03] 為 engine command 撰寫單元測試於 `tests/unit/engine.test.ts` — mock Bun.spawn，測試：start 呼叫正確的 docker compose 指令、status 解析容器狀態、stop 呼叫 down
  (depends on T-012)
  **禁止修改**: src/

📍 **Checkpoint**: US-03 完成 — `slideforge engine start` 可一鍵啟動 Presenton 容器

---

## Phase 5: US-01 — 一句話生成技術簡報 (P1) 🎯 MVP

**Goal**: 使用者執行 `slideforge generate "主題"` 即可拿到 PPTX 檔案
**Independent Test**: 帶一句 prompt 執行 CLI，確認產出 PPTX 且每頁含圖像

### Implementation

- [x] T-014 [P] [US-01] 實作 MCP client 於 `src/client/mcp-client.ts` — 負責：connectToEngine(), generatePresentation(params)。用 @modelcontextprotocol/sdk 的 Client 連線至 http://localhost:5000/mcp，呼叫 generate_presentation tool，回傳 presentation_id 和 path
  (depends on T-005)
  **禁止修改**: src/commands/, src/engine/, src/client/rest-client.ts
- [x] T-015 [P] [US-01] 實作 REST client 於 `src/client/rest-client.ts` — 負責：generatePresentation(params)。用 fetch POST http://localhost:5000/api/v1/ppt/presentation/generate，接受與 MCP client 相同的參數介面，回傳相同格式
  (depends on T-005)
  **禁止修改**: src/commands/, src/engine/, src/client/mcp-client.ts
- [x] T-016 [US-01] 實作 generate command 於 `src/commands/generate.ts` — 負責：解析 prompt 引數、驗證引擎狀態（呼叫 docker.ts healthCheck）、驗證 API key（呼叫 env.ts）、嘗試 MCP client 呼叫（失敗則 fallback REST client）、從 app_data/ 複製 PPTX 到當前目錄、顯示 spinner + 結果摘要
  (depends on T-014, T-015, T-011, T-008)
  **禁止修改**: src/config/, src/engine/docker.ts, src/client/mcp-client.ts, src/client/rest-client.ts
- [x] T-017 [US-01] 為 MCP client 撰寫單元測試於 `tests/unit/mcp-client.test.ts` — mock MCP SDK，測試：連線成功/失敗、generate 回傳解析、timeout 處理
  (depends on T-014)
  **禁止修改**: src/

📍 **Checkpoint**: US-01 完成 — `slideforge generate "主題"` 端到端產出 PPTX 檔案

---

## Phase 6: US-02 — 自訂簡報參數 (P1) 🎯 MVP

**Goal**: 使用者可指定 --slides, --lang, --style 控制簡報產出
**Independent Test**: 分別用不同參數組合執行 CLI，確認 PPTX 反映指定參數

### Implementation

- [x] T-018 [US-02] 擴充 generate command 於 `src/commands/generate.ts` — 新增 CLI options：--slides (number, default 8), --lang (string, default "Traditional Chinese"), --style (string, default "professional"), --output (string, default "./<title>.pptx")。將參數對應到 MCP/REST client 的 n_slides, language, tone 欄位
  (depends on T-016)
  **禁止修改**: src/client/, src/config/, src/engine/
- [x] T-019 [US-02] 為參數處理撰寫單元測試於 `tests/unit/generate.test.ts` — 測試：預設值正確、--slides 傳遞數字、--lang 傳遞語言字串、--style 對應 tone、無效參數錯誤訊息
  (depends on T-018)
  **禁止修改**: src/

📍 **Checkpoint**: US-02 完成 — 各參數組合產出符合預期的簡報

---

## Phase 7: Integration Testing

- [x] T-020 撰寫 end-to-end 整合測試於 `tests/integration/generate.test.ts` — 前提：Docker 運行 + .env 設定。測試：engine start → generate "測試主題" → 確認 PPTX 存在且非空 → engine stop
  (depends on T-018)
  **禁止修改**: src/

📍 **Checkpoint**: 整合測試通過 — 完整流程驗證

---

## Phase 8: Polish & Cross-Cutting

- [x] T-021 [P] 在 `src/index.ts` 註冊所有子指令（init, engine, generate），設定 global error handler，確保非零 exit code + stderr 輸出
  (depends on T-009, T-012, T-016)
  **禁止修改**: src/commands/, src/client/, src/config/, src/engine/
- [x] T-022 [P] 建立 `package.json` 的 bin 欄位，設定 `"slideforge": "src/index.ts"`，確認 `bunx slideforge --help` 可執行
  (depends on T-021)
  **禁止修改**: src/

---

## Dependency Graph

### Phase Flow
```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US-04) ─┐
                                          → Phase 4 (US-03) ─┤→ Phase 5 (US-01) → Phase 6 (US-02) → Phase 7 (Integration) → Phase 8 (Polish)
```

### Task Dependencies
```
T-001 → T-002 → T-008 → T-009 (init cmd)
                       → T-012 (engine cmd)
                       → T-016 (generate cmd)

T-005 (env.ts) → T-011 (docker.ts) → T-012 (engine cmd)
              → T-014 (mcp-client)  → T-016 (generate cmd)
              → T-015 (rest-client) → T-016 (generate cmd)

T-006 (compose) → T-011 (docker.ts)

T-016 → T-018 (params) → T-020 (e2e)
```

### Cross-Story Dependencies
- US-01 depends on US-03（generate 前需確認引擎狀態）
- US-01 depends on US-04（generate 前需確認 API Key）
- US-02 extends US-01（同一個 generate command 加 flags）

---

## Wave Execution Plan

| Wave | Tasks | 說明 |
|------|-------|------|
| 1 | T-001 | 建立目錄結構 |
| 2 | T-002, T-003, T-004 | 初始化專案 + 設定檔（parallel） |
| 3 | T-005, T-006, T-007, T-008 | 基礎模組 + entry point（T-006/T-007 parallel） |
| 4 | T-009, T-011 | init command + Docker 管理（parallel：不同檔案） |
| 5 | T-010, T-012, T-014, T-015 | 測試 + engine command + clients（parallel：不同檔案） |
| 6 | T-013, T-016, T-017 | engine 測試 + generate command + MCP 測試 |
| 7 | T-018, T-019 | 參數擴充 + 測試 |
| 8 | T-020, T-021, T-022 | 整合測試 + polish |

**Solo developer**: 依 wave 順序執行，wave 內 [P] tasks 任意順序。
**AI agents**: wave 4-5 可啟動多個 parallel agent。

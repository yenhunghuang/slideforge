# SlideForge MVP — Feature Specification

> Feature: 001-mvp-slide-generation
> Priority: P0 — MVP
> Created: 2026-03-27

---

## User Scenarios & Testing

### US-01: 一句話生成技術簡報 [P1/MVP]

身為 FDE，我想在 terminal 輸入一句話描述，就拿到一份含 AI 圖像的 PPTX 檔案，這樣我可以在 3 分鐘內準備好非正式技術分享的投影片。

**Why this priority**: 這是產品的核心價值 — 從 prompt 到簡報的最短路徑。沒有這個，其他功能都沒有意義。

**Independent Test**: 執行 CLI 指令帶一句 prompt，確認產出 PPTX 檔案，且每頁含圖像。

**Acceptance Scenarios**:

```gherkin
Scenario: 基本簡報生成
  Given 使用者已設定 Google API Key 於 .env
    And Presenton 引擎容器正在運行
  When 使用者執行 `slideforge generate "Multi-Agent CI/CD Architecture 介紹"`
  Then 產出一份 PPTX 檔案於當前目錄
    And 每張投影片包含與內容相關的 AI 生成圖像
    And 投影片文字預設為繁體中文
    And CLI 顯示生成進度與完成訊息

Scenario: 生成失敗時的回饋
  Given Presenton 引擎容器未啟動
  When 使用者執行 generate 指令
  Then CLI 顯示明確錯誤訊息，指引使用者啟動引擎
```

---

### US-02: 自訂簡報參數 [P1/MVP]

身為 FDE，我想指定簡報的頁數、語言和風格，這樣我可以根據不同場合（客戶 demo vs 內部分享）產出合適的簡報。

**Why this priority**: 不同場合需要不同長度和語氣的簡報，沒有參數控制等於只能接受預設值。

**Independent Test**: 分別用不同參數組合執行 CLI，確認產出符合指定的頁數和語言。

**Acceptance Scenarios**:

```gherkin
Scenario: 指定頁數
  Given 引擎正在運行
  When 使用者執行 `slideforge generate "API Gateway 設計" --slides 12`
  Then 產出的 PPTX 包含約 12 頁投影片

Scenario: 指定語言
  Given 引擎正在運行
  When 使用者執行 `slideforge generate "Kubernetes Overview" --lang en`
  Then 投影片文字為英文

Scenario: 指定風格
  Given 引擎正在運行
  When 使用者執行 `slideforge generate "新人訓練" --style casual`
  Then 投影片語氣偏向輕鬆易讀

Scenario: 使用預設值
  Given 引擎正在運行
  When 使用者執行 `slideforge generate "主題"` 不帶任何選項
  Then 頁數預設 8 頁
    And 語言預設繁體中文
    And 風格預設 professional
```

---

### US-03: 引擎環境一鍵啟動 [P1/MVP]

身為 FDE，我想用一個指令啟動簡報生成引擎，這樣我不需要記住 Docker 指令或手動設定網路/port。

**Why this priority**: 如果啟動引擎需要多步驟手動操作，日常使用的摩擦太大，工具會被棄用。

**Independent Test**: 執行啟動指令，確認引擎容器運行且健康檢查通過。

**Acceptance Scenarios**:

```gherkin
Scenario: 首次啟動引擎
  Given Docker Desktop 正在運行
    And .env 中已設定 GOOGLE_API_KEY
  When 使用者執行 `slideforge engine start`
  Then Presenton 容器啟動並通過健康檢查
    And CLI 顯示引擎就緒訊息

Scenario: 查看引擎狀態
  When 使用者執行 `slideforge engine status`
  Then 顯示引擎是否運行中、API endpoint、以及健康狀態

Scenario: 停止引擎
  Given 引擎正在運行
  When 使用者執行 `slideforge engine stop`
  Then 容器停止並釋放資源
```

---

### US-04: API Key 安全管理 [P1/MVP]

身為 FDE，我想讓 API Key 只存在於本地 .env 檔案，且 CLI 會在需要時自動讀取，這樣我不需要每次手動輸入 key，也不會意外將 key 洩露到版控。

**Why this priority**: 資料主權是核心原則之一。API Key 管理做錯可能導致安全事件。

**Independent Test**: 確認 .env 範本存在、CLI 能讀取 key、且 .gitignore 包含 .env。

**Acceptance Scenarios**:

```gherkin
Scenario: 初始化 API Key 設定
  Given 專案目錄下沒有 .env 檔案
  When 使用者執行 `slideforge init`
  Then 建立 .env.example 範本（含 GOOGLE_API_KEY placeholder）
    And 建立 .gitignore 包含 .env
    And 提示使用者複製 .env.example 為 .env 並填入 key

Scenario: 缺少 API Key 時的提示
  Given .env 不存在或 GOOGLE_API_KEY 為空
  When 使用者執行 generate 指令
  Then CLI 顯示明確錯誤，指引設定 API Key
    And 不嘗試呼叫任何外部 API
```

---

### US-05: 從文件生成簡報 [P2]

身為 FDE，我想把現有的 Markdown 或 PDF 文件轉成簡報，這樣我可以把 spec 或技術文件快速轉為 demo 用投影片。

**Why this priority**: 有價值但非核心 — MVP 先確保 prompt-to-slide 路徑穩定。

**Independent Test**: 提供一份 Markdown 檔案作為輸入，確認產出的 PPTX 內容反映文件內容。

**Acceptance Scenarios**:

```gherkin
Scenario: Markdown 轉簡報
  Given 引擎正在運行
  When 使用者執行 `slideforge generate --from spec.md "幫我做成 POC demo 簡報"`
  Then 簡報內容基於 spec.md 的內容生成
    And 使用者的 prompt 作為風格/語氣指引
```

---

### US-06: 自訂模板套用 [P2]

身為 FDE，我想上傳公司 PPTX 模板，讓生成的簡報套用該模板的視覺風格，這樣產出的簡報符合品牌規範。

**Why this priority**: 品牌一致性對客戶面場合重要，但 MVP 階段用預設風格即可。

**Independent Test**: 上傳一份 PPTX 模板，生成簡報，確認視覺風格與模板一致。

**Acceptance Scenarios**:

```gherkin
Scenario: 使用自訂模板生成
  Given 引擎正在運行
    And 使用者已上傳 PPTX 模板至 templates 目錄
  When 使用者執行 `slideforge generate "主題" --template company-brand`
  Then 簡報套用該模板的配色、字型和版面
```

---

### US-07: Claude Code 內觸發 [P2]

身為 FDE，我想在 Claude Code session 中直接說「做一份簡報」就觸發生成，這樣完全不需要離開 AI 協作環境。

**Why this priority**: 是終極使用體驗，但需要 CLI 先穩定才有意義。

**Independent Test**: 在 Claude Code 中觸發 Skill，確認呼叫 CLI 並回傳結果。

**Acceptance Scenarios**:

```gherkin
Scenario: Skill 觸發簡報生成
  Given 引擎正在運行
    And SlideForge Skill 已安裝
  When 使用者在 Claude Code 中說「幫我做一份 8 頁的 RAG 架構簡報」
  Then Skill 解析意圖並呼叫 slideforge CLI
    And 回傳生成的 PPTX 檔案路徑
```

---

## Requirements

### Functional Requirements

| ID | 需求 | 等級 | 對應 Story |
|----|------|------|-----------|
| FR-001 | 接受自然語言 prompt 並產出 PPTX 簡報 | MUST | US-01 |
| FR-002 | 每張投影片包含 AI 生成的相關圖像（透過 Nano Banana Pro） | MUST | US-01 |
| FR-003 | 支援指定頁數（預設 8） | MUST | US-02 |
| FR-004 | 支援指定語言（預設繁體中文） | MUST | US-02 |
| FR-005 | 支援指定風格語氣（預設 professional） | SHOULD | US-02 |
| FR-006 | 提供引擎生命週期管理指令（start/stop/status） | MUST | US-03 |
| FR-007 | 從 .env 讀取 API Key，不接受命令列明文傳入 | MUST | US-04 |
| FR-008 | 提供 init 指令建立 .env.example 和 .gitignore | SHOULD | US-04 |
| FR-009 | 支援 Markdown 檔案作為簡報內容來源 | SHOULD | US-05 |
| FR-010 | 支援 PPTX 模板套用 | MAY | US-06 |
| FR-011 | 提供 Claude Code Skill 定義 | MAY | US-07 |
| FR-012 | 圖像生成失敗時 fallback 至免費圖庫（Pexels） | SHOULD | US-01 |

### Key Entities

| Entity | 說明 | 關鍵屬性 |
|--------|------|---------|
| Prompt | 使用者的自然語言簡報需求 | 內容文字、頁數、語言、風格 |
| Presentation | 生成的簡報成品 | 檔案路徑、頁數、生成時間 |
| Engine | Presenton 容器化引擎 | 狀態（running/stopped）、endpoint |
| Template | 使用者上傳的 PPTX 風格模板 | 名稱、檔案路徑 |

### Constraints

- 簡報引擎透過 Docker 容器運行，CLI 不直接依賴 Python runtime
- CLI 與引擎之間優先透過 MCP（Streamable HTTP, `http://localhost:5000/mcp`）溝通；MCP 不可用時 fallback 至 REST API（`/api/v1/`）。自架版 v1 API 無需 auth
- 所有依賴套件須為 permissive license（MIT / Apache 2.0）

---

## Success Criteria

| # | 指標 | 目標 |
|---|------|------|
| 1 | 從 prompt 到 PPTX 產出的端到端時間 | < 3 分鐘（8 頁） |
| 2 | 投影片圖像品質 | 每頁含語境相關的 AI 圖像，非 placeholder |
| 3 | CLI 可程式化呼叫 | exit code + stdout 可被 shell script 解析 |
| 4 | 全程不離開 terminal | 從啟動引擎到拿到檔案，零次瀏覽器切換 |

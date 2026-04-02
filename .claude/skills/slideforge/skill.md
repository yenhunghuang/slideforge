---
name: slideforge
description: 從一句話 prompt 生成技術簡報 PPTX。觸發詞：做簡報、generate slides、投影片、slide deck、presentation、簡報生成
---

# SlideForge — 一句話生成技術簡報

當使用者提到製作簡報、做投影片、generate slides、presentation、slide deck、簡報生成等意圖時，啟用此 skill。

## 前置檢查

在執行生成前，依序完成以下檢查：

### 1. 確認 CLI 可用

```bash
bun run /home/yen/learning/slide-ppt/src/index.ts --help
```

若失敗，提示使用者先至 `/home/yen/learning/slide-ppt` 執行 `bun install`。

### 2. 確認環境變數

```bash
grep -q GOOGLE_API_KEY /home/yen/learning/slide-ppt/.env 2>/dev/null
```

若 `.env` 不存在或缺少 `GOOGLE_API_KEY`，提示使用者執行：

```bash
cd /home/yen/learning/slide-ppt && bun run src/index.ts init
```

然後在 `.env` 中填入 `GOOGLE_API_KEY`。

### 3. 確認引擎狀態

```bash
cd /home/yen/learning/slide-ppt && bun run src/index.ts engine status
```

若引擎未運行，先啟動：

```bash
cd /home/yen/learning/slide-ppt && bun run src/index.ts engine start
```

等待引擎啟動完成後再繼續。

## 參數解析

從使用者的自然語言中提取以下參數：

| 參數 | CLI flag | 必要 | 預設值 | 說明 |
|------|----------|------|--------|------|
| 主題描述 | `<prompt>` (positional) | ✅ | — | 簡報的主題，從使用者訊息中提取核心描述 |
| 頁數 | `--slides <number>` | ❌ | 8 | 使用者提到「5 頁」「10 slides」等 |
| 語言 | `--lang <language>` | ❌ | Traditional Chinese | 使用者提到「英文簡報」→ `English`，「日文」→ `Japanese` |
| 風格 | `--style <tone>` | ❌ | professional | 使用者提到「輕鬆」→ `casual`，「學術」→ `academic` |
| 文件來源 | `--from <file>` | ❌ | — | 從 .md/.txt 檔案生成簡報，檔案內容作為簡報主體，prompt 作為風格指引 |
| 模板 | `--template <name>` | ❌ | — | 套用 PPTX 模板 |
| 輸出路徑 | `--output <path>` | ❌ | 自動生成 | 使用者指定「存到 ~/Desktop/demo.pptx」等 |

### 提取範例

- 「幫我做一份關於 Kubernetes 架構的簡報，10 頁，英文」
  → prompt: `"Kubernetes 架構概覽"`, `--slides 10`, `--lang English`
- 「做個輕鬆風格的 AI 入門投影片」
  → prompt: `"AI 入門"`, `--style casual`
- 「generate a 5-slide presentation about microservices」
  → prompt: `"microservices overview"`, `--slides 5`, `--lang English`
- 「把 spec.md 做成簡報」
  → prompt: `"根據文件內容生成簡報"`, `--from spec.md`
- 「用公司模板做一份 K8s 簡報」
  → prompt: `"Kubernetes 概覽"`, `--template company-brand`
- 「把這份文件轉成 demo 用投影片」
  → prompt: `"Demo 簡報"`, `--from <使用者指定的檔案>`, `--style casual`

## 執行指令

```bash
cd /home/yen/learning/slide-ppt && bun run src/index.ts generate "<prompt>" --slides <N> --lang "<language>" --style <style>
```

可選 flags 視使用者需求加上：
- 指定文件來源：`--from "<file>"`
- 套用模板：`--template <name>`
- 指定輸出路徑：`--output "<path>"`

### 完整範例

```bash
# 基本用法
cd /home/yen/learning/slide-ppt && bun run src/index.ts generate "Kubernetes 架構與核心元件介紹" --slides 10 --lang "Traditional Chinese" --style professional

# 從文件生成
cd /home/yen/learning/slide-ppt && bun run src/index.ts generate "技術分享風格" --from ./docs/spec.md --slides 12

# 使用模板
cd /home/yen/learning/slide-ppt && bun run src/index.ts generate "Q3 產品更新" --template company-brand --lang "Traditional Chinese"
```

## 結果回報

執行完成後，告知使用者：

1. **PPTX 檔案路徑** — 從 CLI 輸出中擷取檔案位置
2. **頁數與主題** — 確認生成內容符合預期
3. **後續建議** — 提示使用者可用 LibreOffice 或 PowerPoint 開啟檔案進行微調

若生成失敗，根據錯誤訊息提供具體的排錯建議（引擎未啟動、API Key 無效、網路問題等）。

## 注意事項

- Prompt 中若有雙引號，需跳脫為 `\"`
- 引擎首次啟動需要拉取 Docker image，可能需要較長時間
- 生成過程通常需要 30 秒至數分鐘，視內容複雜度而定

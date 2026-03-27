# SlideForge Constitution

## Project Purpose

SlideForge 是一個 CLI 工具，讓 FDE（Field Development Engineer）能從一句話自然語言 prompt，在 terminal 內生成含 AI 圖像的技術簡報（PPTX），全程不離開開發環境。

## Core Principles

| # | 原則 | 為什麼 |
|---|------|--------|
| 1 | **CLI-first，不做 Web UI** | 目標使用者在 terminal 工作，切換工具就是摩擦 |
| 2 | **引擎不自幹，包裝現有開源** | PPTX 生成邏輯複雜且已有成熟方案（Presenton），自幹是浪費 |
| 3 | **API Key 永遠在使用者手上** | 企業客戶場景的資料主權需求，key 僅存 .env |
| 4 | **繁體中文為預設語言** | 主要產出對象是台灣技術社群和客戶 |
| 5 | **容器隔離引擎，host 跑 CLI** | 引擎依賴複雜（Python），CLI 用 Bun 保持輕量 |

## Technical Boundaries

| Do | Don't |
|----|-------|
| 用 Bun + TypeScript 寫 CLI | 不用 Python 寫任何 host 端程式碼 |
| 透過 MCP / HTTP API 與引擎溝通 | 不直接 import 引擎的 Python module |
| Docker 容器化運行引擎 | 不要求使用者安裝 Python 環境 |
| 支援 .env 管理 API Key | 不硬編碼任何 credential |
| 依賴 permissive license 元件 | 不使用 GPL / AGPL 元件 |

## Quality Standards

- 8 頁簡報從 prompt 到 PPTX 產出 < 3 分鐘
- 每張投影片含語境相關的 AI 圖像（非 placeholder）
- CLI 指令可被 shell script 或 Claude Code Skill 呼叫（可程式化）
- 輸出品質可直接用於非正式技術分享

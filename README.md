# Easy X Viewer

一個輕量、可自由部署的 Web 應用，用於管理 X (Twitter) 貼文影片。支援貼上貼文網址、自動獲取貼文標題、建立標籤與備註，並以 JSON 檔案儲存所有紀錄。

## 功能特色

- 📝 新增 X (Twitter) 貼文影片紀錄
- 🏷️ 自動從貼文獲取標題
- 🏷️ 為影片建立標籤與備註
- 📋 查看所有紀錄列表
- 🔍 依標題或標籤搜尋與篩選
- ✏️ 編輯與刪除紀錄
- 💾 使用 JSON 檔案儲存，無需資料庫
- 🎬 使用 X 官方 embed 播放器播放影片（不下載影片）
- 🔄 自動標準化 URL（支援 x.com 和 twitter.com）
- 🔓 **備用載入功能**：整合 [TwitterAPI.io](https://docs.twitterapi.io/)，當官方 embed 無法顯示時（如年齡限制貼文），可使用 TwitterAPI.io 載入

## 技術棧

### 後端
- Node.js + Express
- 本地 JSON 檔案儲存（`records.json`）
- RESTful API
- X oEmbed API（獲取貼文標題）
- TwitterAPI.io API（備用載入）

### 前端
- 原生 HTML / JavaScript
- TailwindCSS（使用 Tailwind CLI 建置）
- X 官方 widgets.js

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動伺服器

```bash
npm start
```

伺服器將運行於 `http://localhost:3000`

### 3. 設定 TwitterAPI.io（選用）

1. 訪問 [TwitterAPI.io 官方網站](https://docs.twitterapi.io/) 註冊並取得 API 金鑰
2. 在應用中點擊「設定」進入設定頁面
3. 輸入您的 API 金鑰並儲存

### 4. 使用應用

- **首頁**：`http://localhost:3000/` - 新增和管理貼文紀錄
- **設定頁面**：`http://localhost:3000/settings.html` - 設定 TwitterAPI.io API 金鑰

## 使用方式

### 新增貼文紀錄

1. 在主頁面貼上 X (Twitter) 貼文網址
2. 選擇顯示方式：
   - **官方 Embed（推薦）**：使用 X 官方播放器
   - **TwitterAPI.io**：使用第三方 API（需先設定 API 金鑰）
   - **自動**：優先使用官方 Embed，失敗時自動切換到 TwitterAPI.io
3. 添加標籤和備註（選用）
4. 點擊「新增紀錄」

### 顯示方式說明

- **官方 Embed**：免費，但可能無法顯示年齡限制貼文
- **TwitterAPI.io**：付費服務，可顯示年齡限制貼文，需要設定 API 金鑰
- **自動**：智能切換，優先使用免費方案，失敗時自動使用付費方案

## 專案結構

```
.
├── public/              # 前端檔案
│   ├── index.html      # 主頁面
│   ├── settings.html   # 設定頁面
│   ├── js/             # JavaScript 檔案
│   └── css/            # CSS 檔案（自動生成）
├── src/                # 後端原始碼
│   ├── recordStore.js  # 紀錄儲存模組
│   ├── configStore.js  # 配置儲存模組
│   └── validators.js   # 驗證工具
├── server.js           # Express 伺服器
├── package.json        # 專案配置
└── README.md           # 本文件
```

## 環境變數

- `PORT`：伺服器端口（預設：3000）

## 資料儲存

- **紀錄資料**：`records.json` - 儲存所有貼文紀錄
- **配置資料**：`config.json` - 儲存 TwitterAPI.io API 金鑰

## 注意事項

1. **TwitterAPI.io 是付費服務**：使用時會產生費用，請參考[官方定價](https://docs.twitterapi.io/)
2. **API 金鑰安全**：API 金鑰儲存在本地 `config.json` 檔案中，請妥善保管
3. **資料備份**：建議定期備份 `records.json` 檔案

## 授權

MIT License

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
- 🎬 使用 X 官方 embed 播放器播放影片
- 📥 **影片下載功能**：提供影片下載連結，讓使用者直接下載影片

## 技術棧

### 後端
- Node.js + Express
- 本地 JSON 檔案儲存（`records.json`）
- RESTful API
- X oEmbed API（獲取貼文標題）
- 第三方 API（獲取影片下載連結）

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

### 3. 使用應用

訪問 `http://localhost:3000/` 開始使用

## 使用方式

### 新增貼文紀錄

1. 在主頁面貼上 X (Twitter) 貼文網址
2. 添加標籤和備註（選用）
3. 點擊「新增紀錄」

### 下載影片

1. 在紀錄列表中找到包含影片的貼文
2. 點擊「📥 下載影片」按鈕
3. 系統會自動獲取影片下載連結
4. 點擊下載連結即可下載影片

## 專案結構

```
.
├── public/              # 前端檔案
│   ├── index.html      # 主頁面
│   └── js/             # JavaScript 檔案
├── src/                # 後端原始碼
│   ├── recordStore.js  # 紀錄儲存
│   └── validators.js   # 驗證工具
├── server.js           # Express 伺服器
├── package.json        # 專案配置
└── README.md           # 本文件
```

## 環境變數

- `PORT`：伺服器端口（預設：3000）

## 資料儲存

- **紀錄資料**：`records.json` - 儲存所有貼文紀錄

## 注意事項

1. **影片下載**：影片下載功能依賴第三方 API，可能需要網路連線
2. **資料備份**：建議定期備份 `records.json` 檔案
3. **隱私保護**：所有資料儲存在本地，不會上傳到遠端伺服器

## 授權

MIT License

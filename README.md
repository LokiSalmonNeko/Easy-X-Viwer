# Easy X Viewer

一個輕量、可自由部署的 Web 應用，用於管理 X (Twitter) 貼文影片。支援貼上貼文網址、建立標籤與備註，並以 JSON 檔案儲存所有紀錄。

## 功能特色

- 📝 新增 X (Twitter) 貼文影片紀錄
- 🏷️ 為影片建立標籤與備註
- 📋 查看歷史紀錄列表
- 🔍 依標籤搜尋與篩選
- ✏️ 編輯與刪除紀錄
- 💾 使用 JSON 檔案儲存，無需資料庫
- 🎬 使用 X 官方 embed 播放器播放影片（不下載影片）

## 技術棧

### 後端
- Node.js + Express
- 本地 JSON 檔案儲存（`records.json`）
- RESTful API

### 前端
- 原生 HTML / JavaScript
- TailwindCSS（CDN）
- X 官方 widgets.js

## 安裝步驟

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動伺服器

```bash
npm start
```

伺服器將運行於 `http://localhost:3000`

### 3. 訪問應用

開啟瀏覽器訪問：
- 首頁：`http://localhost:3000/`
- 歷史紀錄：`http://localhost:3000/history.html`

## 專案結構

```
project/
├── server.js              # Express 後端主程式
├── records.json           # 資料儲存（啟動時自動建立）
├── package.json           # 專案依賴與腳本
├── public/                # 靜態檔案目錄
│   ├── index.html         # 首頁（新增紀錄 + 最近新增）
│   ├── history.html       # 歷史紀錄頁面
│   ├── js/
│   │   ├── main.js        # 首頁邏輯
│   │   └── history.js     # 歷史頁面邏輯
│   └── css/
│       └── tailwind.css   # TailwindCSS（使用 CDN，此檔案可選）
├── src/
│   ├── recordStore.js     # JSON 檔案讀寫模組
│   └── validators.js      # URL 驗證工具
└── README.md              # 專案說明文件
```

## API 文件

### POST /api/records

新增一筆紀錄

**請求體：**
```json
{
  "url": "https://x.com/username/status/1234567890",
  "tags": "vtuber, music",
  "note": "這段表演很強"
}
```

**回應：**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://x.com/username/status/1234567890",
    "tags": ["vtuber", "music"],
    "note": "這段表演很強",
    "createdAt": "2025-02-14T02:30:00.000Z"
  }
}
```

### GET /api/records

取得所有紀錄

**查詢參數：**
- `tag` (選填)：依標籤篩選，例如 `?tag=vtuber`

**回應：**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://x.com/username/status/1234567890",
      "tags": ["vtuber", "music"],
      "note": "這段表演很強",
      "createdAt": "2025-02-14T02:30:00.000Z"
    }
  ]
}
```

### PUT /api/records/:id

修改紀錄（標籤與備註）

**請求體：**
```json
{
  "tags": "vtuber, music, performance",
  "note": "更新後的備註"
}
```

**回應：**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://x.com/username/status/1234567890",
    "tags": ["vtuber", "music", "performance"],
    "note": "更新後的備註",
    "createdAt": "2025-02-14T02:30:00.000Z"
  }
}
```

### DELETE /api/records/:id

刪除紀錄

**回應：**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## 資料格式

`records.json` 檔案格式為陣列：

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://x.com/username/status/1234567890",
    "tags": ["vtuber", "music"],
    "note": "這段表演很強",
    "createdAt": "2025-02-14T02:30:00.000Z"
  }
]
```

## URL 驗證

支援以下格式的 X (Twitter) 貼文網址：
- `https://x.com/username/status/1234567890`
- `https://twitter.com/username/status/1234567890`

## 部署

### Zeabur

1. 將專案推送到 Git 倉庫
2. 在 Zeabur 中建立新專案
3. 連接 Git 倉庫
4. 設定啟動命令：`npm start`
5. 設定環境變數 `PORT`（可選，預設為 3000）

### Docker

建立 `Dockerfile`：

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

建立並執行：

```bash
docker build -t easy-x-viewer .
docker run -p 3000:3000 easy-x-viewer
```

### 本地部署

直接執行：

```bash
npm install
npm start
```

## 注意事項

- 首次啟動時會自動建立 `records.json` 檔案
- 所有資料儲存在本地 JSON 檔案中，請定期備份
- 使用 X 官方 embed 播放器，不會下載或儲存影片檔案
- CORS 已啟用，允許跨域請求

## 授權

MIT License


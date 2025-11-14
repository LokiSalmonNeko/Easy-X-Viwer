# Zeabur 部署指南

## 推薦方式：使用 Docker 部署

由於 Zeabur 的 Node.js runtime 預設不包含 Python，**強烈建議使用 Docker 部署**以確保 twscrape 功能正常運作。

## 為什麼需要 Docker？

從建置日誌可以看到：
```
sh: 1: pip3: not found
sh: 1: pip: not found
⚠️ twscrape 安裝失敗（需要 Python）
```

這是因為：
- Zeabur 的 Node.js runtime 只包含 Node.js
- 沒有 Python 和 pip
- 因此無法安裝 twscrape

**解決方案**：使用 Docker，可以在同一個容器中同時包含 Node.js 和 Python。

## Docker 部署配置

### `Dockerfile`
專案已包含完整的 Dockerfile：

```dockerfile
FROM node:18-alpine

# 安裝 Python 和 pip（用於 twscrape）
RUN apk add --no-cache python3 py3-pip

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:css

# 安裝 twscrape 和 Playwright（用於瀏覽器模式以繞過 Cloudflare）
RUN pip3 install --break-system-packages twscrape playwright

# 安裝 Playwright 瀏覽器（Chromium）
RUN playwright install chromium

EXPOSE 3000
CMD ["npm", "start"]
```

這個 Dockerfile 確保：
- ✅ 安裝 Node.js 18
- ✅ 安裝 Python 3 和 pip
- ✅ **自動安裝 twscrape**
- ✅ **自動安裝 Playwright 和 Chromium（用於繞過 Cloudflare）**
- ✅ 建置 Tailwind CSS

## 部署步驟

### 1. 確保包含 Dockerfile

確認專案根目錄有 `Dockerfile` 檔案（已包含在專案中）。

### 2. 推送到 Git 倉庫

```bash
git add .
git commit -m "Deploy with Docker and twscrape"
git push origin main
```

### 3. 在 Zeabur 建立專案

1. 登入 [Zeabur](https://zeabur.com)
2. 點擊「Create New Project」
3. 選擇「Import from GitHub」
4. 選擇您的倉庫
5. Zeabur 會自動檢測 Dockerfile 並使用 Docker 建置

### 4. 自動建置流程（Docker）

Zeabur 會依序執行：
1. ✅ 檢測到 `Dockerfile`
2. ✅ 使用 Docker 建置映像：
   - 安裝 Node.js 18
   - 安裝 Python 3 和 pip
   - 執行 `npm install`
   - 執行 `npm run build:css`
   - **執行 `pip3 install twscrape playwright`**
   - **執行 `playwright install chromium`（用於繞過 Cloudflare）**
3. ✅ 部署容器
4. ✅ 啟動應用程式

### 5. 環境變數（可選）

可以在 Zeabur 專案設定中加入：
- `PORT` - 伺服器端口（Zeabur 會自動設定）
- `NODE_ENV=production` - 生產環境標記

## 驗證部署

部署完成後：

1. 訪問 Zeabur 提供的網址
2. 檢查主頁是否正常運作
3. 訪問 `/settings.html` 檢查 twscrape 是否已安裝
4. 在「已新增的帳號」區域，如果看到空列表（而非警告訊息），表示 twscrape 已成功安裝

## 疑難排解

### Cloudflare 403 錯誤

如果登入時遇到 Cloudflare 403 錯誤：

**原因：** Cloudflare 的反機器人保護阻擋了自動登入

**解決方法：**
1. ✅ **已自動處理**：Dockerfile 已自動安裝 Playwright 和 Chromium，twscrape 會自動使用瀏覽器模式
2. 如果問題持續，可以嘗試：
   - 使用代理伺服器（設置環境變數 `HTTP_PROXY` 和 `HTTPS_PROXY`）
   - 更換網路環境或 IP 地址
   - 等待 10-30 分鐘後再試（可能是暫時限制）

### twscrape 未安裝

如果部署後 twscrape 未安裝，可能原因：
1. Zeabur 未啟用 Python runtime
2. Python 版本不相容

**解決方法：**
1. 確認 `.zeabur/config.json` 中有 `"python": "3.11"`
2. 或在 Zeabur 儀表板手動啟用 Python service
3. 檢查建置日誌中 twscrape 的安裝輸出

### 查看建置日誌

在 Zeabur 專案頁面：
1. 點擊 Deployments
2. 選擇最新的部署
3. 查看 Build Logs
4. 搜尋 "twscrape" 查看安裝狀態

## 替代方案

如果自動安裝失敗，可以使用 Zeabur 的 Shell 功能手動安裝：

1. 在 Zeabur 專案中開啟 Shell
2. 執行：
   ```bash
   pip3 install twscrape
   ```

## 更新部署

每次 push 新的 commit 到倉庫，Zeabur 會自動重新建置和部署。

## 參考連結

- [Zeabur 文件](https://zeabur.com/docs)
- [Zeabur Python Support](https://zeabur.com/docs/deploy/python)
- [twscrape GitHub](https://github.com/vladkens/twscrape)


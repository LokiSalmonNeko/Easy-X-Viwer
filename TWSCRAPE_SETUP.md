# twscrape 備用載入功能設定指南

## ⚠️ 重要安全警告

**強烈建議使用免洗帳號，切勿使用個人主要帳號！**

使用 twscrape 功能時請注意：
- 此功能使用第三方 API 抓取 X 貼文，**可能違反 X 服務條款**
- 使用的帳號**可能會被限制、暫停或永久封禁**
- 建議使用專門建立的測試帳號或臨時帳號
- **不要使用與個人身份相關的帳號**
- 此功能僅供年齡限制或無法正常顯示的貼文使用

## 功能說明

當 X 官方 embed API 無法顯示貼文時（例如年齡限制內容、被刪除的貼文等），可以使用 twscrape 作為備用載入方案。

twscrape 是一個開源的 X/Twitter API scraper，詳見：https://github.com/vladkens/twscrape

## 安裝步驟

### 1. 確認 Python 環境

確保已安裝 Python 3.8 或更新版本：

```bash
python --version
# 或
python3 --version
```

### 2. 安裝 twscrape

```bash
pip install twscrape
# 或
pip3 install twscrape
```

### 3. 驗證安裝

```bash
twscrape --version
```

如果看到版本號，表示安裝成功。

## 設定帳號

### 1. 訪問設定頁面

啟動 Easy X Viewer 後，訪問：
```
http://localhost:3000/settings.html
```

### 2. 新增 Twitter 帳號

**重要：建議使用免洗帳號！**

在設定頁面填寫：
- **Twitter 使用者名稱**（必填）
- **密碼**（必填）
- **電子郵件**（必填）
- **電子郵件密碼**（選填，用於自動接收驗證碼）

### 3. 執行登入

點擊「執行登入」按鈕，twscrape 會嘗試登入您提供的帳號。

如果提供了電子郵件密碼且郵件支援 IMAP，驗證碼將自動接收。否則可能需要手動輸入驗證碼（透過終端機）。

### 4. 檢查帳號狀態

在「已新增的帳號」區域可以看到：
- 帳號是否已登入
- 帳號是否啟用
- 最後使用時間
- 總請求數

## 使用方式

### 自動觸發

當貼文無法透過官方 embed 顯示時，會自動出現「嘗試備用載入」按鈕。

### 手動使用

1. 點擊「嘗試備用載入」按鈕
2. 系統會使用 twscrape 抓取貼文內容
3. 顯示貼文的：
   - 文字內容
   - 圖片
   - 影片（可直接播放）

## 常見問題

### Q: 為什麼需要 Twitter 帳號？

A: twscrape 需要已登入的 Twitter 帳號才能抓取受限制的內容（如年齡限制貼文）。

### Q: 使用免洗帳號安全嗎？

A: 建議使用專門為此目的建立的測試帳號。即使是免洗帳號也可能被封禁，但不會影響您的個人帳號。

### Q: 帳號被封禁怎麼辦？

A: 這是預期中的風險。請使用不重要的帳號，被封禁後可以新增其他帳號。

### Q: 為什麼載入失敗？

A: 可能的原因：
- twscrape 未正確安裝
- 沒有新增或登入帳號
- 帳號已被封禁
- X API 暫時無法使用
- 網路問題

### Q: 如何管理多個帳號？

A: 可以新增多個帳號，twscrape 會自動輪流使用以分散請求負載。

## 疑難排解

### 安裝問題

如果安裝失敗，嘗試：

```bash
# 使用 pip3
pip3 install twscrape

# 或指定使用者安裝
pip install --user twscrape

# 或使用 sudo（macOS/Linux）
sudo pip install twscrape
```

### 登入問題

1. 確認帳號密碼正確
2. 檢查電子郵件是否正確
3. 如果需要驗證碼，確認電子郵件支援 IMAP 或準備手動輸入

### 使用問題

查看瀏覽器控制台（F12）的錯誤訊息，通常會顯示具體的錯誤原因。

## 限制與注意事項

1. **不建議頻繁使用**：大量請求可能導致帳號被限制
2. **僅用於必要情況**：優先使用官方 embed，僅在無法顯示時使用備用載入
3. **定期更新**：twscrape 可能需要更新以適應 X API 的變化：
   ```bash
   pip install --upgrade twscrape
   ```
4. **帳號管理**：定期檢查帳號狀態，被封禁的帳號應移除並新增新帳號

## 法律聲明

使用 twscrape 功能時，您需要：
- 遵守 X (Twitter) 的服務條款
- 了解可能的風險
- 自行承擔使用此功能的後果
- 不將此功能用於違法或違反 X 政策的行為

本專案僅提供技術實作，不對使用者的使用行為負責。

## 移除 twscrape

如果不再需要此功能：

```bash
pip uninstall twscrape
```

## 更多資訊

- twscrape GitHub: https://github.com/vladkens/twscrape
- twscrape PyPI: https://pypi.org/project/twscrape/


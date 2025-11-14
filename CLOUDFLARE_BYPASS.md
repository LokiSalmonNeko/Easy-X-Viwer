# Cloudflare 繞過指南

本專案提供了多種進階技術來繞過 Cloudflare 的反機器人防護，特別針對 **twscrape 登入** 場景。

## 問題背景

Cloudflare 會檢測自動化工具（如 Playwright、Selenium）的特徵，並阻擋自動登入嘗試。單純安裝 Playwright 並不足以繞過其「機器人驗證」（Bot Detection）。

## 解決方案

本專案提供以下三種層次的解決方案：

### 1. 基本方案：Playwright 瀏覽器模式（已自動啟用）

當您安裝 Playwright 後，twscrape 會自動使用瀏覽器模式而非純 HTTP 請求。

**安裝方式：**
```bash
pip install playwright
playwright install chromium
```

**優點：**
- 自動啟用，無需額外配置
- twscrape 會自動檢測並使用

**限制：**
- 仍可能被 Cloudflare 檢測並阻擋
- 需要每次執行登入流程

---

### 2. 進階方案：Stealth 模式 + 啟動參數調整

我們提供了增強的 Playwright 配置，包含：

- **隱藏 `navigator.webdriver` 屬性**
- **偽裝瀏覽器指紋**（plugins、languages、permissions 等）
- **關鍵啟動參數**：`--disable-blink-features=AutomationControlled`

這些配置已整合在 `scripts/playwright_stealth_helper.py` 中。

**使用方式：**
```python
from playwright_stealth_helper import create_stealth_page

browser, context, page = create_stealth_page(
    playwright,
    headless=False,  # 建議 False，Cloudflare 對無頭模式很敏感
    storage_state_path="state.json"  # 可選：載入已保存的狀態
)
```

---

### 3. 終極方案：Cookie 保存機制 ⭐ 推薦

這是**最穩定、最有效**的方法。原理是：

1. **第一次：** 使用 Stealth 模式開啟瀏覽器，**人工手動**登入並通過 Cloudflare 驗證
2. **保存狀態：** 程式自動保存當前的 Cookies、LocalStorage 等狀態到檔案
3. **之後執行：** 程式直接載入保存的狀態，自動跳過登入驗證

**優點：**
- ✅ 一勞永逸：手動登入一次，之後自動使用
- ✅ 最高成功率：完全跳過 Cloudflare 驗證
- ✅ 穩定可靠：不依賴自動化檢測繞過

#### 使用步驟

##### 步驟 1：保存登入狀態

執行以下命令，會開啟瀏覽器視窗：

```bash
python3 scripts/save_login_state.py
```

**操作流程：**
1. 瀏覽器會自動開啟 Twitter 登入頁面（使用 Stealth 模式）
2. 在瀏覽器中**手動輸入帳號密碼**
3. 完成 Cloudflare 驗證（如果需要）
4. 確認已成功登入（看到 Twitter 首頁）
5. **回到終端，按 Enter 鍵**保存狀態

狀態會保存在：`~/.twscrape/browser_states/login_state.json`

##### 步驟 2：之後自動使用保存的狀態

一旦狀態保存後，之後執行 `twscrape login_accounts` 或使用 API 登入時，系統會：

1. 自動檢測到已保存的狀態
2. 自動使用增強版登入腳本（`scripts/enhanced_login.py`）
3. 自動載入保存的狀態
4. **無需再次登入或通過 Cloudflare 驗證**

#### 檢查狀態是否存在

```bash
python3 scripts/save_login_state.py --check
```

#### 透過 API 保存狀態

也可以透過 Web API 觸發保存流程：

```bash
curl -X POST http://localhost:3000/api/twscrape/save-state
```

---

## 技術細節

### Playwright Stealth 配置

`scripts/playwright_stealth_helper.py` 提供了以下功能：

1. **隱藏自動化特徵**
   ```python
   # 隱藏 webdriver 屬性
   Object.defineProperty(navigator, 'webdriver', {
       get: () => undefined
   });
   ```

2. **偽裝瀏覽器特徵**
   - plugins
   - languages
   - permissions
   - Chrome 物件

3. **關鍵啟動參數**
   - `--disable-blink-features=AutomationControlled`（最重要）
   - `--no-sandbox`
   - `--disable-infobars`
   - 等等...

### 狀態保存機制

狀態檔案包含：
- Cookies（包含登入憑證）
- LocalStorage
- SessionStorage
- Origin 資訊

檔案位置：`~/.twscrape/browser_states/login_state.json`

---

## 疑難排解

### 問題 1：即使安裝了 Playwright，仍然遇到 Cloudflare 錯誤

**解決方案：**
1. ✅ 確認 Playwright 瀏覽器已正確安裝：`playwright install chromium`
2. ✅ 【推薦】使用 Cookie 保存機制：`python3 scripts/save_login_state.py`
3. ✅ 使用代理伺服器（設置 `HTTP_PROXY` 和 `HTTPS_PROXY`）
4. ✅ 更換網路環境或 IP 地址
5. ✅ 等待 10-30 分鐘後再試（可能是暫時限制）

### 問題 2：保存狀態腳本無法執行

**檢查事項：**
```bash
# 1. 確認 Python 和 Playwright 已安裝
python3 -c "import playwright; print('OK')"
playwright --version

# 2. 確認腳本有執行權限
chmod +x scripts/save_login_state.py
chmod +x scripts/playwright_stealth_helper.py

# 3. 確認依賴檔案存在
ls -la scripts/*.py
```

### 問題 3：狀態已保存，但登入仍失敗

**可能原因：**
1. 狀態檔案已過期（Cookie 失效）
2. 帳號被 Twitter 限制

**解決方案：**
1. 重新執行 `python3 scripts/save_login_state.py` 更新狀態
2. 檢查狀態檔案是否存在：`ls -la ~/.twscrape/browser_states/login_state.json`

---

## API 端點

### GET /api/twscrape/accounts

獲取帳號列表，會包含 `hasSavedState` 欄位：

```json
{
  "success": true,
  "data": [...],
  "installed": true,
  "hasSavedState": true
}
```

### POST /api/twscrape/save-state

觸發保存登入狀態流程（會開啟瀏覽器視窗）。

---

## 總結

| 方案 | 成功率 | 使用難度 | 推薦度 |
|------|--------|----------|--------|
| 基本方案（Playwright） | ⭐⭐ | 簡單 | ⭐⭐ |
| 進階方案（Stealth） | ⭐⭐⭐ | 中等 | ⭐⭐⭐ |
| 終極方案（Cookie 保存） | ⭐⭐⭐⭐⭐ | 簡單 | ⭐⭐⭐⭐⭐ |

**強烈推薦使用「終極方案：Cookie 保存機制」**，這是最穩定且使用最簡單的方法。

---

## 參考資源

- [Playwright 官方文檔](https://playwright.dev/python/)
- [twscrape GitHub](https://github.com/vladkens/twscrape)
- [Cloudflare Bot Management](https://www.cloudflare.com/products/bot-management/)


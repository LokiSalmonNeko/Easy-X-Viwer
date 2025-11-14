#!/usr/bin/env python3
"""
Playwright Stealth Helper
用於增強 Playwright 以繞過 Cloudflare 防護

此腳本提供：
1. Stealth 模式配置（隱藏自動化特徵）
2. 真實瀏覽器指紋偽裝
3. 進階啟動參數調整
"""

import os
import sys
from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page
from typing import Optional, Dict, Any

def setup_stealth_context(
    context: BrowserContext,
    user_agent: Optional[str] = None,
    viewport: Optional[Dict[str, int]] = None,
    locale: str = "zh-TW,zh,en-US,en"
) -> BrowserContext:
    """
    設置 Stealth 模式上下文，隱藏自動化特徵
    
    Args:
        context: BrowserContext 對象
        user_agent: 自定義 User-Agent（預設使用真實的 Chrome UA）
        viewport: 視窗大小（預設：1920x1080）
        locale: 語言設定
    
    Returns:
        配置好的 BrowserContext
    """
    # 真實的 Chrome User-Agent（Windows）
    default_user_agent = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
    
    default_viewport = viewport or {"width": 1920, "height": 1080}
    
    # 注入 JavaScript 來隱藏 webdriver 特徵
    stealth_script = """
    // 隱藏 webdriver 屬性
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
    });
    
    // 偽裝 plugins
    Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
    });
    
    // 偽裝 languages
    Object.defineProperty(navigator, 'languages', {
        get: () => ['zh-TW', 'zh', 'en-US', 'en']
    });
    
    // 偽裝 permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
    );
    
    // 偽裝 Chrome 屬性
    window.chrome = {
        runtime: {}
    };
    
    // 偽裝 plugins length
    Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
    });
    """
    
    # 在上下文中注入 stealth 腳本
    context.add_init_script(stealth_script)
    
    # 設置額外的上下文選項
    context.set_extra_http_headers({
        "Accept-Language": locale,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    })
    
    return context


def create_stealth_browser(
    playwright,
    headless: bool = False,
    proxy: Optional[Dict[str, str]] = None
) -> Browser:
    """
    創建帶有 Stealth 配置的瀏覽器實例
    
    Args:
        playwright: Playwright 實例
        headless: 是否使用無頭模式（建議 False，Cloudflare 對無頭模式很敏感）
        proxy: 代理設定（可選）
    
    Returns:
        配置好的 Browser 實例
    """
    # 關鍵啟動參數，用於隱藏自動化特徵
    launch_args = [
        '--disable-blink-features=AutomationControlled',  # 最重要：隱藏自動化控制
        '--no-sandbox',
        '--disable-infobars',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        '--disable-extensions',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-popup-blocking',
        '--disable-translate',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-ipc-flooding-protection',
    ]
    
    browser_args = {
        'headless': headless,
        'args': launch_args,
    }
    
    if proxy:
        browser_args['proxy'] = proxy
    
    browser = playwright.chromium.launch(**browser_args)
    return browser


def create_stealth_page(
    playwright,
    headless: bool = False,
    user_agent: Optional[str] = None,
    proxy: Optional[Dict[str, str]] = None,
    storage_state_path: Optional[str] = None
) -> tuple[Browser, BrowserContext, Page]:
    """
    創建完整的 Stealth 模式頁面（包含瀏覽器、上下文和頁面）
    
    Args:
        playwright: Playwright 實例
        headless: 是否使用無頭模式
        user_agent: 自定義 User-Agent
        proxy: 代理設定
        storage_state_path: 儲存狀態檔案路徑（用於載入 Cookie）
    
    Returns:
        (browser, context, page) 三元組
    """
    browser = create_stealth_browser(playwright, headless=headless, proxy=proxy)
    
    # 創建上下文選項
    context_options = {
        'viewport': {'width': 1920, 'height': 1080},
        'user_agent': user_agent or (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        'locale': 'zh-TW',
        'timezone_id': 'Asia/Taipei',
        'permissions': ['geolocation'],
    }
    
    # 如果提供了儲存狀態，載入它（包含 Cookie）
    if storage_state_path and os.path.exists(storage_state_path):
        context_options['storage_state'] = storage_state_path
    
    context = browser.new_context(**context_options)
    
    # 應用 Stealth 配置
    context = setup_stealth_context(context, user_agent=user_agent)
    
    page = context.new_page()
    
    return browser, context, page


def save_browser_state(context: BrowserContext, state_path: str) -> None:
    """
    保存瀏覽器狀態（Cookies、LocalStorage 等）
    
    Args:
        context: BrowserContext 對象
        state_path: 儲存路徑
    """
    try:
        # 確保目錄存在
        dir_path = os.path.dirname(state_path)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
        
        # 保存狀態
        context.storage_state(path=state_path)
        print(f"✓ 瀏覽器狀態已保存至: {state_path}")
    except Exception as e:
        print(f"✗ 保存瀏覽器狀態失敗: {e}", file=sys.stderr)
        raise


def main():
    """示範使用方式"""
    print("Playwright Stealth Helper")
    print("此腳本提供 Stealth 模式配置功能")
    print("請在您的程式碼中匯入並使用這些函數")


if __name__ == "__main__":
    main()


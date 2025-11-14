#!/usr/bin/env python3
"""
保存登入狀態腳本
用於第一次手動登入後保存 Cookie，之後自動使用保存的狀態跳過登入驗證

使用方法：
1. 第一次執行：python scripts/save_login_state.py
   - 會開啟瀏覽器，請手動登入並通過 Cloudflare 驗證
   - 登入成功後按 Enter，腳本會自動保存狀態
2. 之後 twscrape 會自動使用保存的狀態（無需再次登入）
"""

import os
import sys
import json
from pathlib import Path

# 嘗試匯入 playwright
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("錯誤：未安裝 Playwright")
    print("請執行：pip install playwright && playwright install chromium")
    sys.exit(1)

# 匯入本地模組
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)
try:
    from playwright_stealth_helper import create_stealth_page, save_browser_state
except ImportError as e:
    print(f"錯誤：無法匯入 stealth helper: {e}")
    print("請確認 playwright_stealth_helper.py 存在於 scripts/ 目錄")
    sys.exit(1)

# 狀態檔案路徑
STATE_DIR = os.path.join(os.path.expanduser("~"), ".twscrape", "browser_states")
STATE_FILE = os.path.join(STATE_DIR, "login_state.json")


def ensure_state_dir():
    """確保狀態目錄存在"""
    os.makedirs(STATE_DIR, exist_ok=True)


def save_login_state():
    """手動登入並保存狀態"""
    print("=" * 60)
    print("保存登入狀態工具")
    print("=" * 60)
    print()
    print("此工具會：")
    print("1. 開啟瀏覽器（使用 Stealth 模式）")
    print("2. 導航至 Twitter 登入頁面")
    print("3. 請您手動完成登入和 Cloudflare 驗證")
    print("4. 登入成功後，按 Enter 鍵保存登入狀態")
    print()
    print("之後 twscrape 會自動使用保存的狀態，無需再次登入！")
    print()
    print("-" * 60)
    
    input("準備好後按 Enter 鍵開始...")
    
    ensure_state_dir()
    
    print()
    print("正在啟動瀏覽器（使用 Stealth 模式繞過 Cloudflare）...")
    
    try:
        with sync_playwright() as p:
            # 使用 Stealth 模式創建頁面（非無頭模式，方便手動操作）
            browser, context, page = create_stealth_page(
                p,
                headless=False,  # 顯示瀏覽器視窗
                storage_state_path=None  # 首次執行，沒有已保存的狀態
            )
            
            print("✓ 瀏覽器已啟動")
            print()
            print("正在導航至 Twitter 登入頁面...")
            
            # 導航至 Twitter 登入頁面
            page.goto("https://twitter.com/i/flow/login", wait_until="networkidle")
            
            print("✓ 已開啟 Twitter 登入頁面")
            print()
            print("-" * 60)
            print("📝 請在瀏覽器中完成以下步驟：")
            print("   1. 輸入您的帳號和密碼")
            print("   2. 完成 Cloudflare 驗證（如果需要）")
            print("   3. 確認已成功登入 Twitter（看到首頁）")
            print()
            print("⚠️  確認登入成功後，回到這裡按 Enter 鍵保存狀態")
            print("-" * 60)
            
            # 等待用戶確認
            input()
            
            # 檢查是否已登入（檢查頁面是否包含登入後的元素）
            current_url = page.url
            page_content = page.content()
            
            # 簡單檢查：如果 URL 包含 login，可能還沒登入
            if "login" in current_url.lower() and "i/flow/login" in current_url:
                print()
                print("⚠️  警告：檢測到仍在登入頁面")
                response = input("確定要保存狀態嗎？(y/N): ")
                if response.lower() != 'y':
                    print("已取消")
                    browser.close()
                    return
            
            print()
            print("正在保存登入狀態...")
            
            # 保存瀏覽器狀態（包含 Cookies、LocalStorage 等）
            save_browser_state(context, STATE_FILE)
            
            print()
            print("=" * 60)
            print("✓ 登入狀態已成功保存！")
            print(f"✓ 保存位置：{STATE_FILE}")
            print()
            print("之後 twscrape 會自動使用此狀態，無需再次登入。")
            print("=" * 60)
            
            # 關閉瀏覽器
            browser.close()
            
    except KeyboardInterrupt:
        print()
        print("已取消")
        sys.exit(0)
    except Exception as e:
        print()
        print(f"✗ 發生錯誤：{e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def load_login_state():
    """載入已保存的登入狀態"""
    if os.path.exists(STATE_FILE):
        return STATE_FILE
    return None


def check_state_exists():
    """檢查狀態檔案是否存在"""
    return os.path.exists(STATE_FILE)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        # 檢查模式
        if check_state_exists():
            print(f"✓ 已找到登入狀態：{STATE_FILE}")
            sys.exit(0)
        else:
            print(f"✗ 未找到登入狀態：{STATE_FILE}")
            sys.exit(1)
    else:
        # 正常執行：保存登入狀態
        save_login_state()


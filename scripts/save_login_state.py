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

def check_xvfb_available():
    """檢查 xvfb 是否可用"""
    try:
        result = os.system('command -v xvfb-run > /dev/null 2>&1')
        return result == 0
    except:
        return False

def setup_xvfb():
    """設置 xvfb 虛擬顯示環境"""
    if not check_xvfb_available():
        return False
    
    # 設置 DISPLAY 環境變數
    # xvfb 通常使用 :99 作為顯示編號
    display_num = os.environ.get('XVFB_DISPLAY', ':99')
    
    # 檢查是否已經有 xvfb 在運行
    check_cmd = f"ps aux | grep '[X]vfb {display_num}' > /dev/null 2>&1"
    xvfb_running = os.system(check_cmd) == 0
    
    if not xvfb_running:
        # 啟動 xvfb
        print(f"正在啟動 xvfb 虛擬顯示（DISPLAY={display_num}）...")
        xvfb_cmd = f"Xvfb {display_num} -screen 0 1920x1080x24 -ac +extension GLX +render -noreset > /dev/null 2>&1 &"
        os.system(xvfb_cmd)
        import time
        time.sleep(1)  # 等待 xvfb 啟動
    
    # 設置 DISPLAY 環境變數
    os.environ['DISPLAY'] = display_num
    print(f"✓ 已設置 DISPLAY={display_num}")
    return True

def detect_display_available():
    """檢測是否有可用的顯示環境"""
    # 檢查是否強制使用 headless 模式
    if os.environ.get('PLAYWRIGHT_HEADLESS', '').lower() in ('true', '1', 'yes'):
        return False
    
    # 檢查 DISPLAY 環境變數（Unix/Linux）
    if 'DISPLAY' in os.environ:
        # 驗證 DISPLAY 是否真的可用
        try:
            import subprocess
            result = subprocess.run(['xdpyinfo'], 
                                  capture_output=True, 
                                  timeout=2,
                                  env=os.environ.copy())
            if result.returncode == 0:
                return True
        except:
            pass
    
    # 檢查是否在 Windows（通常有圖形介面）
    if sys.platform == 'win32':
        return True
    
    # 檢查是否在 macOS
    if sys.platform == 'darwin':
        return True
    
    # 檢查是否有 xvfb（虛擬顯示），如果有的話嘗試設置
    if check_xvfb_available():
        if setup_xvfb():
            return True
    
    return False

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
    
    # 檢測環境
    has_display = detect_display_available()
    
    if not has_display:
        print("⚠️  檢測到無頭伺服器環境（無圖形介面）")
        print()
        
        # 檢查是否可以使用 xvfb
        if check_xvfb_available():
            print("✓ 檢測到 xvfb 可用")
            print("正在嘗試使用 xvfb 啟動虛擬顯示...")
            print()
            
            if setup_xvfb():
                print("✓ xvfb 虛擬顯示已啟動")
                print("現在可以使用有頭模式的瀏覽器（雖然看不到視窗，但功能正常）")
                print()
                print("注意：由於是虛擬顯示，您無法看到瀏覽器視窗，")
                print("但可以通過以下方式操作：")
                print("1. 使用 VNC 連接到虛擬顯示（如果已安裝 x11vnc）")
                print("2. 或依賴自動化登入（如果有配置）")
                print()
                print("-" * 60)
                response = input("是否繼續？（將使用虛擬顯示，無法看到瀏覽器視窗）(y/N): ")
                if response.lower() != 'y':
                    print("已取消。")
                    sys.exit(0)
                print()
                use_headless = False  # 使用虛擬顯示，不使用 headless
                has_display = True  # 現在有虛擬顯示了
            else:
                print("✗ xvfb 啟動失敗")
                print()
                print("解決方案：")
                print("1. 【推薦】使用 xvfb-run 執行：")
                print("   xvfb-run -a python3 scripts/save_login_state.py")
                print()
                print("2. 在本地電腦執行此腳本，然後將保存的狀態檔案")
                print("   複製到伺服器：~/.twscrape/browser_states/login_state.json")
                print()
                print("-" * 60)
                response = input("是否仍要嘗試 headless 模式？（不推薦，無法手動操作）(y/N): ")
                if response.lower() != 'y':
                    print("已取消。請使用上述方法之一。")
                    sys.exit(0)
                print()
                use_headless = True
        else:
            print("在伺服器環境中，無法顯示瀏覽器視窗進行手動登入。")
            print()
            print("解決方案：")
            print("1. 【推薦】安裝並使用 xvfb：")
            print("   sudo apt-get install xvfb")
            print("   xvfb-run -a python3 scripts/save_login_state.py")
            print()
            print("2. 在本地電腦執行此腳本，然後將保存的狀態檔案")
            print("   複製到伺服器：~/.twscrape/browser_states/login_state.json")
            print()
            print("3. 使用 Playwright 的遠程瀏覽器連接功能")
            print()
            print("-" * 60)
            response = input("是否仍要嘗試 headless 模式？（不推薦，無法手動操作）(y/N): ")
            if response.lower() != 'y':
                print("已取消。請使用上述方法之一。")
                sys.exit(0)
            print()
            use_headless = True
    else:
        use_headless = False
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
    if use_headless:
        print("正在啟動瀏覽器（Headless 模式，無法手動操作）...")
        print("⚠️  警告：Headless 模式無法進行手動登入操作")
        print("⚠️  建議在本地電腦執行此腳本，或使用 xvfb")
    else:
        print("正在啟動瀏覽器（使用 Stealth 模式繞過 Cloudflare）...")
    
    try:
        with sync_playwright() as p:
            # 確保在無顯示環境中強制使用 headless 模式
            # 即使用戶選擇了非 headless，如果沒有 DISPLAY 也要強制 headless
            if not has_display:
                use_headless = True
            
            # 使用 Stealth 模式創建頁面
            browser, context, page = create_stealth_page(
                p,
                headless=use_headless,  # 根據環境決定是否使用 headless
                storage_state_path=None  # 首次執行，沒有已保存的狀態
            )
            
            print("✓ 瀏覽器已啟動")
            print()
            print("正在導航至 Twitter 登入頁面...")
            
            # 導航至 Twitter 登入頁面
            page.goto("https://twitter.com/i/flow/login", wait_until="networkidle")
            
            print("✓ 已開啟 Twitter 登入頁面")
            print()
            
            if use_headless:
                print("⚠️  警告：目前使用 Headless 模式")
                print("⚠️  無法進行手動登入操作")
                print()
                print("請使用以下方法之一：")
                print("1. 在本地電腦執行此腳本")
                print("2. 使用 xvfb-run: xvfb-run -a python3 scripts/save_login_state.py")
                print("3. 將本地保存的狀態檔案複製到伺服器")
                print()
                print("將嘗試自動檢測登入狀態...")
                print("（但這通常不會成功，因為需要手動操作）")
                # 等待一段時間，讓頁面載入
                import time
                time.sleep(5)
            else:
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
        error_msg = str(e)
        
        # 檢查是否是無顯示環境錯誤
        if "X server" in error_msg or "DISPLAY" in error_msg or "headless" in error_msg.lower():
            print("✗ 發生錯誤：無法啟動瀏覽器（無圖形介面）")
            print()
            print("這是因為您在無頭伺服器環境中執行此腳本。")
            print()
            print("解決方案：")
            print("1. 【推薦】在本地電腦執行：")
            print("   python3 scripts/save_login_state.py")
            print("   然後將保存的狀態檔案複製到伺服器")
            print("   ~/.twscrape/browser_states/login_state.json")
            print()
            print("2. 安裝 xvfb 並使用虛擬顯示：")
            print("   sudo apt-get install xvfb")
            print("   xvfb-run -a python3 scripts/save_login_state.py")
            print()
        else:
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


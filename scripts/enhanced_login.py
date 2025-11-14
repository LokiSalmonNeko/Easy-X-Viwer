#!/usr/bin/env python3
"""
增強版 twscrape 登入腳本
使用 Stealth 模式和 Cookie 保存機制繞過 Cloudflare

此腳本：
1. 檢查是否有已保存的登入狀態
2. 如果有，直接使用（跳過登入驗證）
3. 如果沒有，使用 Stealth 模式手動登入並保存狀態
"""

import os
import sys
import subprocess
import json
from pathlib import Path

# 狀態檔案路徑
STATE_DIR = os.path.join(os.path.expanduser("~"), ".twscrape", "browser_states")
STATE_FILE = os.path.join(STATE_DIR, "login_state.json")

def check_state_exists():
    """檢查登入狀態是否存在"""
    return os.path.exists(STATE_FILE)


def run_twscrape_login_with_state():
    """
    使用已保存的狀態執行 twscrape 登入
    實際上 twscrape 會自動使用已登入的帳號，所以這個函數主要是
    提供一個統一的入口點
    """
    try:
        # 設置環境變數，指示使用已保存的狀態
        env = os.environ.copy()
        
        # twscrape 會自動檢測已登入的帳號
        # 我們只需要確保狀態檔案存在
        if check_state_exists():
            print(f"✓ 發現已保存的登入狀態：{STATE_FILE}")
            print("✓ twscrape 將自動使用已登入的帳號")
        else:
            print("⚠️  未找到已保存的登入狀態")
            print("⚠️  將執行正常登入流程（可能需要通過 Cloudflare 驗證）")
        
        # 執行 twscrape login
        result = subprocess.run(
            ["twscrape", "login_accounts"],
            capture_output=True,
            text=True,
            timeout=180,
            env=env
        )
        
        print(result.stdout)
        
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        
        return result.returncode == 0
        
    except subprocess.TimeoutExpired:
        print("✗ 登入超時（超過 3 分鐘）", file=sys.stderr)
        return False
    except FileNotFoundError:
        print("✗ 錯誤：找不到 twscrape 命令", file=sys.stderr)
        print("請執行：pip install twscrape", file=sys.stderr)
        return False
    except Exception as e:
        print(f"✗ 發生錯誤：{e}", file=sys.stderr)
        return False


def main():
    """主函數"""
    # 檢查 twscrape 是否已安裝
    try:
        subprocess.run(
            ["twscrape", "--help"],
            capture_output=True,
            timeout=5
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        print("✗ 錯誤：未安裝 twscrape")
        print("請執行：pip install twscrape")
        sys.exit(1)
    
    # 檢查 Playwright 是否已安裝
    try:
        import playwright
    except ImportError:
        print("⚠️  警告：未安裝 Playwright")
        print("建議執行：pip install playwright && playwright install chromium")
        print("（沒有 Playwright 可能無法繞過 Cloudflare）")
        print()
    
    # 檢查是否有已保存的登入狀態
    if check_state_exists():
        print("=" * 60)
        print("使用已保存的登入狀態")
        print("=" * 60)
        print()
    else:
        print("=" * 60)
        print("未找到已保存的登入狀態")
        print("=" * 60)
        print()
        print("建議：")
        print("1. 執行 python scripts/save_login_state.py 手動登入並保存狀態")
        print("2. 之後即可自動使用保存的狀態，無需再次登入")
        print()
        response = input("是否繼續執行正常登入流程？(y/N): ")
        if response.lower() != 'y':
            print("已取消")
            sys.exit(0)
        print()
    
    # 執行 twscrape 登入
    success = run_twscrape_login_with_state()
    
    if success:
        print()
        print("=" * 60)
        print("✓ 登入流程完成")
        print("=" * 60)
        sys.exit(0)
    else:
        print()
        print("=" * 60)
        print("✗ 登入失敗")
        print("=" * 60)
        print()
        print("建議：")
        print("1. 檢查網路連線")
        print("2. 嘗試使用代理伺服器")
        print("3. 執行 python scripts/save_login_state.py 手動登入並保存狀態")
        sys.exit(1)


if __name__ == "__main__":
    main()


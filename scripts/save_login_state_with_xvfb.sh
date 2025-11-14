#!/bin/bash
# 使用 xvfb 執行 save_login_state.py 的包裝腳本

echo "使用 xvfb 執行保存登入狀態腳本..."
echo ""

# 檢查 xvfb 是否已安裝
if ! command -v xvfb-run &> /dev/null; then
    echo "錯誤：未安裝 xvfb"
    echo ""
    echo "請先安裝 xvfb："
    echo "  Ubuntu/Debian: sudo apt-get install xvfb"
    echo "  CentOS/RHEL: sudo yum install xorg-x11-server-Xvfb"
    echo "  macOS: brew install xvfb (需要 XQuartz)"
    exit 1
fi

# 獲取腳本目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 使用 xvfb-run 執行腳本
# -a: 自動選擇顯示編號
# -s: 屏幕參數（1920x1080x24，24位色深）
xvfb-run -a -s "-screen 0 1920x1080x24" python3 "${SCRIPT_DIR}/save_login_state.py"

exit $?


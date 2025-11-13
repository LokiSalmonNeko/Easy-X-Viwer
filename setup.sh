#!/bin/bash

echo "======================================"
echo "Easy X Viewer - 安裝腳本"
echo "======================================"
echo ""

# 檢查 Python 是否已安裝
echo "檢查 Python..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
    echo "✓ 找到 Python: $(python3 --version)"
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
    echo "✓ 找到 Python: $(python --version)"
else
    echo "✗ 錯誤：未找到 Python"
    echo "請先安裝 Python 3.8 或更新版本"
    echo "訪問：https://www.python.org/downloads/"
    exit 1
fi

# 檢查 pip 是否已安裝
echo ""
echo "檢查 pip..."
if command -v pip3 &> /dev/null; then
    PIP_CMD=pip3
    echo "✓ 找到 pip3"
elif command -v pip &> /dev/null; then
    PIP_CMD=pip
    echo "✓ 找到 pip"
else
    echo "✗ 錯誤：未找到 pip"
    echo "請先安裝 pip"
    exit 1
fi

# 安裝 twscrape
echo ""
echo "安裝 twscrape..."

# 嘗試使用 --break-system-packages（Python 3.11+）
$PIP_CMD install --break-system-packages twscrape 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ twscrape 安裝成功（使用 --break-system-packages）"
else
    # 嘗試一般安裝
    $PIP_CMD install twscrape
    if [ $? -eq 0 ]; then
        echo "✓ twscrape 安裝成功"
    else
        echo "✗ twscrape 安裝失敗"
        echo "請嘗試手動執行："
        echo "  $PIP_CMD install --break-system-packages twscrape"
        echo "或"
        echo "  $PIP_CMD install --user twscrape"
        exit 1
    fi
fi

# 驗證 twscrape 安裝
echo ""
echo "驗證 twscrape 安裝..."
if command -v twscrape &> /dev/null; then
    echo "✓ twscrape 已正確安裝"
    twscrape 2>&1 | head -1
else
    echo "⚠ twscrape 命令未找到"
    echo "可能需要將 Python scripts 目錄加入 PATH"
fi

echo ""
echo "======================================"
echo "安裝完成！"
echo "======================================"
echo ""
echo "下一步："
echo "1. 執行 npm install 安裝 Node.js 依賴"
echo "2. 執行 npm start 啟動伺服器"
echo "3. 訪問 http://localhost:3000/settings.html 設定 twscrape 帳號"
echo ""


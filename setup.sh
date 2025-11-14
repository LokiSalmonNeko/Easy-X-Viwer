#!/bin/bash

echo "======================================"
echo "Easy X Viewer - 安裝腳本"
echo "======================================"
echo ""

echo "此腳本會檢查 Node.js 環境"
echo ""

# 檢查 Node.js 是否已安裝
echo "檢查 Node.js..."
if command -v node &> /dev/null; then
    echo "✓ 找到 Node.js: $(node --version)"
else
    echo "✗ 錯誤：未找到 Node.js"
    echo "請先安裝 Node.js 16 或更新版本"
    echo "訪問：https://nodejs.org/"
    exit 1
fi

# 檢查 npm 是否已安裝
echo ""
echo "檢查 npm..."
if command -v npm &> /dev/null; then
    echo "✓ 找到 npm: $(npm --version)"
else
    echo "✗ 錯誤：未找到 npm"
    echo "請先安裝 npm"
    exit 1
fi

echo ""
echo "======================================"
echo "安裝完成！"
echo "======================================"
echo ""
echo "下一步："
echo "1. 執行 npm install 安裝 Node.js 依賴"
echo "2. 執行 npm start 啟動伺服器"
echo "3. 訪問 http://localhost:3000 開始使用"
echo "4. 訪問 http://localhost:3000/settings.html 設定 TwitterAPI.io API 金鑰（選用）"
echo ""

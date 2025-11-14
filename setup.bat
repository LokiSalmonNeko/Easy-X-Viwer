@echo off
echo ======================================
echo Easy X Viewer - 安裝腳本 (Windows)
echo ======================================
echo.

REM 檢查 Node.js 是否已安裝
echo 檢查 Node.js...
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo ✓ 找到 Node.js
    node --version
) else (
    echo ✗ 錯誤：未找到 Node.js
    echo 請先安裝 Node.js 16 或更新版本
    echo 訪問：https://nodejs.org/
    pause
    exit /b 1
)

REM 檢查 npm 是否已安裝
echo.
echo 檢查 npm...
where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo ✓ 找到 npm
    npm --version
) else (
    echo ✗ 錯誤：未找到 npm
    echo 請先安裝 npm
    pause
    exit /b 1
)

echo.
echo ======================================
echo 安裝完成！
echo ======================================
echo.
echo 下一步：
echo 1. 執行 npm install 安裝 Node.js 依賴
echo 2. 執行 npm start 啟動伺服器
echo 3. 訪問 http://localhost:3000 開始使用
echo 4. 訪問 http://localhost:3000/settings.html 設定 TwitterAPI.io API 金鑰（選用）
echo.
pause

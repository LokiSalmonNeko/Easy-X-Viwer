@echo off
echo ======================================
echo Easy X Viewer - 安裝腳本 (Windows)
echo ======================================
echo.

REM 檢查 Python 是否已安裝
echo 檢查 Python...
where python >nul 2>nul
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
    echo ✓ 找到 Python
    python --version
) else (
    where python3 >nul 2>nul
    if %errorlevel% equ 0 (
        set PYTHON_CMD=python3
        echo ✓ 找到 Python3
        python3 --version
    ) else (
        echo ✗ 錯誤：未找到 Python
        echo 請先安裝 Python 3.8 或更新版本
        echo 訪問：https://www.python.org/downloads/
        pause
        exit /b 1
    )
)

REM 檢查 pip 是否已安裝
echo.
echo 檢查 pip...
where pip >nul 2>nul
if %errorlevel% equ 0 (
    set PIP_CMD=pip
    echo ✓ 找到 pip
) else (
    where pip3 >nul 2>nul
    if %errorlevel% equ 0 (
        set PIP_CMD=pip3
        echo ✓ 找到 pip3
    ) else (
        echo ✗ 錯誤：未找到 pip
        echo 請先安裝 pip
        pause
        exit /b 1
    )
)

REM 安裝 twscrape
echo.
echo 安裝 twscrape...

REM 嘗試使用 --break-system-packages（Python 3.11+）
%PIP_CMD% install --break-system-packages twscrape 2>nul

if %errorlevel% equ 0 (
    echo ✓ twscrape 安裝成功（使用 --break-system-packages）
) else (
    REM 嘗試一般安裝
    %PIP_CMD% install twscrape
    if %errorlevel% equ 0 (
        echo ✓ twscrape 安裝成功
    ) else (
        echo ✗ twscrape 安裝失敗
        echo 請嘗試手動執行：
        echo   %PIP_CMD% install --break-system-packages twscrape
        echo 或
        echo   %PIP_CMD% install --user twscrape
        pause
        exit /b 1
    )
)

REM 驗證 twscrape 安裝
echo.
echo 驗證 twscrape 安裝...
where twscrape >nul 2>nul
if %errorlevel% equ 0 (
    echo ✓ twscrape 已正確安裝
    twscrape 2>&1 | findstr "usage"
) else (
    echo ⚠ twscrape 命令未找到
    echo 可能需要將 Python Scripts 目錄加入 PATH
)

REM 安裝 Playwright（用於瀏覽器模式以繞過 Cloudflare）
echo.
echo 安裝 Playwright（用於瀏覽器模式）...
%PIP_CMD% install --break-system-packages playwright 2>nul
if %errorlevel% neq 0 (
    %PIP_CMD% install playwright 2>nul
    if %errorlevel% neq 0 (
        %PIP_CMD% install --user playwright 2>nul
    )
)

if %errorlevel% equ 0 (
    echo ✓ Playwright 安裝成功
    
    REM 安裝 Chromium 瀏覽器
    echo.
    echo 安裝 Chromium 瀏覽器（可能需要幾分鐘）...
    where playwright >nul 2>nul
    if %errorlevel% equ 0 (
        playwright install chromium 2>nul
    ) else (
        %PYTHON_CMD% -m playwright install chromium 2>nul
    )
    if %errorlevel% equ 0 (
        echo ✓ Playwright 設定完成
    ) else (
        echo ⚠ 請手動執行: playwright install chromium
    )
) else (
    echo ⚠ Playwright 安裝失敗（選用功能）
    echo 如果遇到 Cloudflare 錯誤，請手動執行：
    echo   %PIP_CMD% install playwright
    echo   playwright install chromium
)

echo.
echo ======================================
echo 安裝完成！
echo ======================================
echo.
echo 下一步：
echo 1. 執行 npm install 安裝 Node.js 依賴
echo 2. 執行 npm start 啟動伺服器
echo 3. 訪問 http://localhost:3000/settings.html 設定 twscrape 帳號
echo.
pause


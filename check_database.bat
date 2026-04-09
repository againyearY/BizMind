@echo off
REM 检查 BizMind 数据库中的消息
REM 使用方法：双击运行此脚本

setlocal enabledelayedexpansion

echo.
echo ============================================
echo  🔍 BizMind 数据库检查工具
echo ============================================
echo.

set "DB_PATH=%APPDATA%\bizmind\db\bizmind.sqlite"

echo 📂 检查数据库路径...
echo    %DB_PATH%

if exist "!DB_PATH!" (
    echo ✅ 数据库文件存在！
    echo.
    echo 📊 文件信息:
    for /f "tokens=*" %%A in ('dir /b "!DB_PATH!"') do (
        echo    文件: %%A
    )
    echo.
    echo 💡 要查看数据库内容，请使用以下工具之一:
    echo.
    echo    1. DB Browser for SQLite (免费)
    echo       下载: https://sqlitebrowser.org
    echo.
    echo    2. DBeaver (免费)
    echo       下载: https://dbeaver.io
    echo.
    echo    3. SQLite 命令行 (系统内置，如果安装了)
    echo       运行: sqlite3 "!DB_PATH!"
    echo       然后输入: SELECT * FROM messages;
    echo.
    echo 🎯 推荐: 使用应用内的"调试面板"查看数据
    echo.
) else (
    echo ❌ 数据库文件不存在！
    echo.
    echo 🔧 可能的原因:
    echo    1. 应用还未运行过（数据库在首次运行时创建）
    echo    2. 应用未保存任何消息
    echo.
    echo 📝 解决方案:
    echo    1. 运行命令: pnpm tauri dev
    echo    2. 按 Ctrl+Shift+A 弹出输入框
    echo    3. 输入任意文本并点击"归档"
    echo    4. 再次运行此脚本
    echo.
)

echo 按任意键退出...
pause > nul

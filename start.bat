@echo off
title Polyglot PDF Reader
chcp 65001 >nul
cd /d C:\antigravity\lingual-pdf-reader
set PATH=C:\Program Files\nodejs;%PATH%

echo ===================================================
echo   Polyglot PDF Reader を起動しています...
echo ===================================================
echo.

start "Vite Server" /b cmd /c "npx vite --host"
timeout /t 3 /nobreak >nul

start "Cloudflare Tunnel" /b cmd /c "C:\antigravity\cloudflared.exe tunnel --url https://localhost:5173 --no-tls-verify"

echo サーバーが起動しました！
echo.
echo ■ PCローカル: https://localhost:5173/
echo ■ 自宅Wi-Fi: https://192.168.0.207:5173/
echo.
echo ※スマホ用Cloudflareトンネルも起動中です。
echo   このウィンドウを閉じるとアプリが停止します。
echo ===================================================

pause

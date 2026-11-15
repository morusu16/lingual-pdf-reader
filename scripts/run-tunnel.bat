@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d C:\antigravity\lingual-pdf-reader
:loop
echo [TUNNEL] Launching localtunnel...
cmd /c npx localtunnel --port 5173 --local-https --allow-invalid-cert
echo [TUNNEL] Tunnel disconnected. Reconnecting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop

@echo off
title AgroPasco-Conecta - Servidor Multiusuario EPT 2026
color 0A
echo ==============================================================================
echo   AGROPASCO-CONECTA - COMERCIO JUSTO DIRECTO
echo   Iniciativa Escolar EPT: I.E. Gerardo Patino Lopez (Batallon 39)
echo   Concurso Nacional "Crea y Emprende 2026"
echo ==============================================================================
echo.
echo Iniciando servidor backend y sincronizacion multiusuario...
echo.
cd /d "%~dp0"
python server.py
pause

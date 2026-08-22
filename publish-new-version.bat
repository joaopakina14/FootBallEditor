@echo off
chcp 65001 > nul
echo ====================================================
echo   FieldVision — Publicador Automático de Versões
echo ====================================================
echo.

:: 1. Ask for version tag
set /p VERSION="Insira o número da nova versão (ex: v1.0.1): "
if "%VERSION%"=="" (
    echo.
    echo ❌ Erro: O número da versão não pode estar vazio.
    pause
    exit /b
)

echo.
echo 🧹 [1/5] A limpar compilações antigas...
if exist dist (
    rd /s /q dist
)

echo.
echo 📦 [2/5] A atualizar o package.json e a compilar o Instalador...
set VERSION_NUM=%VERSION:v=%
powershell -Command "$json = Get-Content package.json -Raw | ConvertFrom-Json; $json.version = '%VERSION_NUM%'; $json | ConvertTo-Json -Depth 100 | Set-Content package.json"
call npx electron-builder --win
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erro: Falha ao compilar o Instalador.
    pause
    exit /b
)

echo.
echo 🗜️ [3/5] A verificar o Instalador gerado...
if not exist "dist/FieldVision-Setup-%VERSION_NUM%.exe" (
    echo.
    echo ❌ Erro: O instalador dist/FieldVision-Setup-%VERSION_NUM%.exe nao foi encontrado.
    pause
    exit /b
)

echo.
echo 🌐 [4/5] A atualizar o link de download no index.html do site...
powershell -Command "$p='FieldVision-website/index.html'; if (Test-Path $p) { $c = Get-Content $p -Raw; $c = $c -replace 'releases/download/v[\d\.]+/FieldVision[-_a-zA-Z0-9\.]+\.(zip|exe)', 'releases/download/%VERSION%/FieldVision-Setup-%VERSION_NUM%.exe'; Set-Content $p -Value $c; Write-Host 'Link atualizado com sucesso!' } else { Write-Host 'Aviso: index.html do site não encontrado.' }"

echo.
echo 🚀 [5/5] A enviar o Instalador (.exe) para as Releases do GitHub e a publicar o site...
call gh release create %VERSION% "dist/FieldVision-Setup-%VERSION_NUM%.exe" --repo joaopakina14/FieldVision --title "FieldVision %VERSION% (Windows)" --notes "Lançamento oficial da versão %VERSION%."
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erro: Falha ao criar a release no GitHub.
    pause
    exit /b
)

:: Push updated website HTML to GitHub Pages
cd FieldVision-website
git add index.html
git commit -m "Update download link to %VERSION%"
git push
cd ..

echo.
echo ====================================================
echo   🎉 VERSÃO %VERSION% PUBLICADA COM SUCESSO!
echo ====================================================
echo.
pause

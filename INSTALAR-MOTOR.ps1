$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
Write-Host 'Preparando el motor local de karaoke. Esta instalación necesita Internet y varios GB de espacio libre.'
$enginePython = Join-Path $PSScriptRoot '.engine/venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $enginePython)) {
    if (Get-Command py -ErrorAction SilentlyContinue) { & py -3.12 -m venv .engine/venv; if ($LASTEXITCODE -ne 0) { & py -3.11 -m venv .engine/venv } }
    elseif (Get-Command python -ErrorAction SilentlyContinue) { & python -m venv .engine/venv }
    else { throw 'Se necesita Python 3.11 o 3.12. Instalalo desde python.org y volvé a abrir este instalador.' }
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear el entorno de Python. Usá Python 3.11 o 3.12.' }
}
& $enginePython -m pip install torch==2.5.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cpu
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias de audio.' }
& $enginePython -m pip install -r engine/requirements.txt
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar Demucs y Rubber Band.' }
& $enginePython engine/process.py --prepare
if ($LASTEXITCODE -ne 0) { throw 'No se pudo descargar el modelo. Revisá Internet y reintentá.' }
Write-Host 'Motor preparado. Abrí COMENZAR.bat para usar MixLab.'

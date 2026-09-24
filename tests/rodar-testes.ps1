<#
.SYNOPSIS
    Roda os testes do Sistema QFD no Chrome/Edge sem abrir janela e mostra o resultado.

.DESCRIPTION
    Usa um perfil temporário do navegador, então não toca nos dados do seu projeto.
    Neste modo também são testadas as páginas do sistema (menus, balões etc.).
    Retorna código de saída 1 se algum teste falhar.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File tests\rodar-testes.ps1
#>

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8  # saída do navegador tem acentos

$navegadores = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$navegador = $navegadores | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $navegador) {
    Write-Error 'Chrome ou Edge não encontrado. Abra tests\testes.html no navegador.'
}

$pagina = Join-Path $PSScriptRoot 'testes.html'
$url = 'file:///' + ($pagina -replace '\\', '/')
$perfil = Join-Path ([System.IO.Path]::GetTempPath()) ('qfd-testes-' + [guid]::NewGuid())

try {
    $html = & $navegador --headless=new --disable-gpu --no-first-run --allow-file-access-from-files `
        "--user-data-dir=$perfil" --virtual-time-budget=30000 --dump-dom $url 2>$null | Out-String
} finally {
    Remove-Item -Recurse -Force $perfil -ErrorAction SilentlyContinue
}

$m = [regex]::Match($html, '<pre id="resultado"[^>]*>([\s\S]*?)</pre>')
if (-not $m.Success) {
    Write-Error 'Não foi possível ler o resultado dos testes.'
}
$resultado = [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value)

foreach ($linha in $resultado -split "`n") {
    if ($linha -match '^FALHA') { Write-Host $linha -ForegroundColor Red }
    elseif ($linha -match '^OK') { Write-Host $linha -ForegroundColor Green }
    elseif ($linha -match '^(##|RESUMO)') { Write-Host $linha -ForegroundColor Cyan }
    else { Write-Host $linha }
}

if ($resultado -cmatch '(?m)^(FALHA|Executando)') { exit 1 }
exit 0

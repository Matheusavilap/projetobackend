Write-Host "`n[TESTE COMPLETO] Fluxo TCP → JWT → API`n" -ForegroundColor Cyan

# ═══════════════════════════════════════════════════════════════
# FASE 1: Enviar dados via TCP
# ═══════════════════════════════════════════════════════════════
Write-Host "[FASE 1] Enviando dados via TCP..." -ForegroundColor Yellow

# Ping
$pingHex = "50F70A3F730150494E4773C4"
$bytes = for ($i = 0; $i -lt $pingHex.Length; $i += 2) { [Convert]::ToByte($pingHex.Substring($i, 2), 16) }
$tcp = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 9000)
$stream = $tcp.GetStream()
$stream.Write($bytes, 0, $bytes.Length)
$tcp.Close()
Write-Host "  ✅ Ping enviado" -ForegroundColor Green

Start-Sleep -Milliseconds 200

# Localização
$locHex = "50F70A3F73025EFCF950156F017D784000008CA0F80084003C013026A1029E72BD73C4"
$bytes = for ($i = 0; $i -lt $locHex.Length; $i += 2) { [Convert]::ToByte($locHex.Substring($i, 2), 16) }
$tcp = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 9000)
$stream = $tcp.GetStream()
$stream.Write($bytes, 0, $bytes.Length)
$tcp.Close()
Write-Host "  ✅ Localização enviada" -ForegroundColor Green

Start-Sleep -Milliseconds 500

# ═══════════════════════════════════════════════════════════════
# FASE 2: Autenticação JWT
# ═══════════════════════════════════════════════════════════════
Write-Host "`n[FASE 2] Autenticando com JWT..." -ForegroundColor Yellow

$loginBody = @{
    userId = "user_123"
    allowedDevices = @("0a3f73")
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "  ✅ Token JWT obtido: $($token.Substring(0, 50))..." -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════
# FASE 3: Consultar API com permissão
# ═══════════════════════════════════════════════════════════════
Write-Host "`n[FASE 3] Consultando API (dispositivo permitido)..." -ForegroundColor Yellow

$headers = @{ "Authorization" = "Bearer $token" }
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/location/0A3F73" -Headers $headers -Method Get
    Write-Host "  ✅ Sucesso! Dados recebidos:" -ForegroundColor Green
    $response.data | ConvertTo-Json -Depth 10
} catch {
    Write-Host "  ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# ═══════════════════════════════════════════════════════════════
# FASE 4: Testar autorização (dispositivo NÃO permitido)
# ═══════════════════════════════════════════════════════════════
Write-Host "`n[FASE 4] Testando autorização (dispositivo NÃO permitido)..." -ForegroundColor Yellow

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/v1/location/999999" -Headers $headers -Method Get
    Write-Host "  ❌ ERRO: Deveria ter bloqueado!" -ForegroundColor Red
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    if ($statusCode -eq 403) {
        Write-Host "  ✅ Bloqueado corretamente! Status: 403 Forbidden" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Status inesperado: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host "`n[CONCLUÍDO] Todos os testes finalizados!`n" -ForegroundColor Cyan
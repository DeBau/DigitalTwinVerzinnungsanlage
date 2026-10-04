# Sucht die neueste Siemens.Simatic.Simulation.Runtime.Api.x64.dll von PLCSIM Advanced
$basen = @("$env:CommonProgramFiles", "${env:CommonProgramFiles(x86)}") | Select-Object -Unique
$treffer = foreach ($b in $basen) {
  $api = Join-Path $b 'Siemens\PLCSIMADV\API'
  if (Test-Path $api) {
    Get-ChildItem -Path $api -Directory | ForEach-Object {
      $dll = Join-Path $_.FullName 'Siemens.Simatic.Simulation.Runtime.Api.x64.dll'
      if (Test-Path $dll) {
        $v = [version]'0.0'
        [void][version]::TryParse($_.Name, [ref]$v)
        [pscustomobject]@{ Version = $v; Pfad = $dll }
      }
    }
  }
}
$treffer | Sort-Object Version -Descending | Select-Object -First 1 -ExpandProperty Pfad

Set-Location "$PSScriptRoot\.."
Push-Location web; npm install; Pop-Location
Start-Process powershell -ArgumentList "-Command", "Set-Location '$PWD\web'; npm run dev"
Start-Sleep -Seconds 3
go run ./cmd/chronicle serve -dev

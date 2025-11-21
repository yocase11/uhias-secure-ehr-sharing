# PowerShell script to install dependencies and start both backend and frontend

# Navigate to backend, install dependencies, and start server
Write-Host "Starting backend..."
cd backend
if (!(Test-Path node_modules)) {
    Write-Host "Installing backend dependencies..."
    npm install
}
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; npm start'  # or 'node server.js' if no npm start
cd ..

# Navigate to frontend, install dependencies, and start React app
Write-Host "Starting frontend..."
cd frontend
if (!(Test-Path node_modules)) {
    Write-Host "Installing frontend dependencies..."
    npm install
}
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend; npm start'
cd ..

# Optionally open the frontend in browser (adjust port if needed)
Start-Sleep -Seconds 5
Start-Process http://localhost:3000

Write-Host "All services started. Backend on :3001, Frontend on :3000."

# Advanced Security and Monitoring Automation for Node.js/Express
# 1. Security: Use OWASP ZAP for automated API scanning
# 2. Monitoring: Use 'clinic.js' for profiling, and Winston for logging

# --- 1. OWASP ZAP API Scan (Docker, no install needed) ---
# Pull and run ZAP to scan your API (replace port if needed)
# Requires Docker Desktop running
# Save as zap_scan.ps1

Write-Host "Starting OWASP ZAP API scan..."
docker run -v ${PWD}:/zap/wrk/:rw -t owasp/zap2docker-stable zap-baseline.py -t http://host.docker.internal:3001 -r zap_report.html
Write-Host "ZAP scan complete. See zap_report.html for results."

# --- 2. Clinic.js for Node.js Profiling ---
# Save as profile_backend.ps1

Write-Host "Profiling backend with clinic.js..."
clinic doctor --on-port 'autocannon http://localhost:3001/ehr/e8a9410e-f27f-445e-895c-e81258b71d19' -- node server.js
Write-Host "Clinic.js profiling complete. Open the generated HTML report."

# --- 3. Winston Logging Example (add to server.js) ---
# const winston = require('winston');
# const logger = winston.createLogger({
#   level: 'info',
#   format: winston.format.json(),
#   transports: [
#     new winston.transports.File({ filename: 'error.log', level: 'error' }),
#     new winston.transports.File({ filename: 'combined.log' }),
#   ],
# });
# logger.info('Server started');
# logger.error('Error message');

# --- 4. System Resource Monitoring (PowerShell) ---
# Save as monitor_resources.ps1

Write-Host "Monitoring system resources..."
Get-Process -Name node | Select-Object CPU,PM,WS,Id,ProcessName
Write-Host "Use Task Manager or Resource Monitor for live stats."

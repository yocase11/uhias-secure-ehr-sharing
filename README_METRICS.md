Metrics report generator

This repository includes a standalone script that generates a visual metrics report (PNG + HTML + SVG) for the EHR project.

Files created:
- scripts/generate_metrics_report.py  — Standalone generator script
- requirements.txt                    — Python packages required
- outputs/metrics_report.png          — Generated when script runs
- outputs/metrics_report.html         — Generated when script runs
- outputs/metrics_report.svg          — Generated when script runs

How to run (Windows PowerShell):

1. Create and activate a virtual environment (recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Run the generator:

```powershell
python scripts\generate_metrics_report.py
```

Notes:
- The script attempts to fetch live metrics from http://localhost:3001/api/metrics. If your backend is running and exposes that endpoint, the report will reflect live values.
- If the backend is not reachable, the script will use a built-in sample metrics payload and still generate the report files.
- The script is intentionally standalone so no frontend integration is required.

Output files will be placed under the `outputs/` folder.

If you'd like, I can also:
- Add a scheduled run (Windows Task Scheduler) to periodically regenerate the image.
- Add CSV or JSON exports of the flattened metrics.
- Add higher-fidelity chart styling or additional charts from the full metrics list.

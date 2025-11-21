"""
Standalone metrics report generator for the healthcare EHR project.

What it does:
- Attempts to fetch metrics from http://localhost:3001/api/metrics
- Falls back to sample metrics if the backend is not available
- Creates a PNG image with multiple charts (performance, resources, security)
- Writes an HTML report that embeds the PNG and shows metric values
- Writes a simple SVG summary image (outputs/metrics_report.svg)

Run (PowerShell):
> python -m venv .venv; .\.venv\Scripts\Activate; pip install -r requirements.txt
> python scripts\generate_metrics_report.py

Outputs:
- outputs/metrics_report.png
- outputs/metrics_report.html
- outputs/metrics_report.svg

The script is intentionally standalone so you don't need to modify the frontend.
"""

import os
import sys
import json
import math
from datetime import datetime

try:
    import requests
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.gridspec import GridSpec
except Exception as e:
    print("Missing dependencies. Run: pip install -r requirements.txt")
    raise

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'outputs')
if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR, exist_ok=True)

METRICS_URL = 'http://localhost:3001/api/metrics'

# A comprehensive sample metrics payload covering requested metrics (used if backend not reachable)
SAMPLE_METRICS = {
    "performance": {
        "averageEncryptionTime": 12.5,
        "averageDecryptionTime": 9.7,
        "averageUploadLatency": 120.3,
        "averageDownloadLatency": 95.2,
        "averageEndToEndLatency": 230.4,
        "averageResponseTime": 42.1,
        "throughput": 5.2,
        "cpuUtilization": 18.6,
        "memoryUtilization": 12.4
    },
    "security": {
        "accessControlEnforcementRate": 99.5,
        "unauthorizedAccessRate": 0.5,
        "auditLogsCount": 123
    },
    "usability": {
        "averageTaskCompletionTime": 4.2,
        "errorRate": 1.8,
        "totalRequests": 2048
    },
    "scalability": {
        "concurrentUsers": 12,
        "transactionSuccessRate": 98.7,
        "uptime": 4320
    },
    # optional blockchain & research metrics (when available)
    "blockchain": {
        "gasCostPerTransactionUSD": 0.85,
        "averageGasUsage": 21000,
        "transactionConfirmationLatency": 1800,
        "eventEmissionLatency": 1200,
        "chainStorageCostBytes": 512,
        "transactionSuccessRate": 99.9,
        "onchainThroughput": 2.5
    },
    "analytical": {
        "meanTransactionLatency": 220.5,
        "stddevGasCost": 0.12,
        "avgAccessRequestsPerRecord": 3.1,
        "accessApprovalRatio": 72.4,
        "breakGlassCount": 1,
        "txcost_latency_corr": 0.42,
        "consentExpiryDistribution": {"0-30d": 40, "30-90d": 35, ">90d": 25}
    },
    "research": {
        "anonymitySetSize": 128,
        "consentGraphEntropy": 3.8,
        "smartContractVulnScore": 4.2,
        "formalVerificationCoverage": 12.0,
        "privacyLeakageProb": 0.02
    }
}


def fetch_metrics(url):
    try:
        r = requests.get(url, timeout=5)
        r.raise_for_status()
        print(f"Fetched metrics from {url}")
        return r.json()
    except Exception as e:
        print(f"Failed to fetch metrics from {url}: {e}")
        print("Using sample metrics payload.")
        return SAMPLE_METRICS


def safe_get(obj, *keys, default=None):
    cur = obj
    for k in keys:
        if cur is None:
            return default
        cur = cur.get(k)
    return cur if cur is not None else default


def numeric(v, default=0.0):
    try:
        if v is None:
            return default
        return float(v)
    except:
        return default


def create_png(metrics, out_png):
    # Create a multi-chart PNG summarizing many requested metrics
    fig = plt.figure(figsize=(14, 10))
    gs = GridSpec(3, 3, figure=fig, height_ratios=[1, 1, 0.6])

    # Performance bar chart (latencies)
    ax1 = fig.add_subplot(gs[0, 0:2])
    perf_labels = ['Encryption', 'Decryption', 'Upload', 'Download', 'E2E', 'Response']
    perf_vals = [
        numeric(safe_get(metrics, 'performance', 'averageEncryptionTime')),
        numeric(safe_get(metrics, 'performance', 'averageDecryptionTime')),
        numeric(safe_get(metrics, 'performance', 'averageUploadLatency')),
        numeric(safe_get(metrics, 'performance', 'averageDownloadLatency')),
        numeric(safe_get(metrics, 'performance', 'averageEndToEndLatency')),
        numeric(safe_get(metrics, 'performance', 'averageResponseTime'))
    ]
    ax1.bar(perf_labels, perf_vals, color='#4c72b0')
    ax1.set_title('Performance Latencies (ms)')
    ax1.set_ylabel('ms')
    for i, v in enumerate(perf_vals):
        ax1.text(i, v + max(1.0, v * 0.02), f"{v:.1f}", ha='center', va='bottom', fontsize=8)

    # Throughput / TPS
    ax2 = fig.add_subplot(gs[0, 2])
    throughput = numeric(safe_get(metrics, 'performance', 'throughput'))
    ax2.bar(['TPS'], [throughput], color='#dd8452')
    ax2.set_ylim(0, max(throughput * 1.5, 5))
    ax2.set_title('Throughput (transactions/sec)')
    ax2.text(0, throughput + 0.02 * max(1, throughput), f"{throughput:.2f}", ha='center')

    # CPU / Memory pie
    ax3 = fig.add_subplot(gs[1, 0])
    cpu = numeric(safe_get(metrics, 'performance', 'cpuUtilization'))
    mem = numeric(safe_get(metrics, 'performance', 'memoryUtilization'))
    other_cpu = max(0, 100 - cpu)
    other_mem = max(0, 100 - mem)
    ax3.pie([cpu, other_cpu], labels=[f'CPU {cpu:.1f}%', f'Idle {other_cpu:.1f}%'], autopct='%1.0f%%', colors=['#2ca02c', '#d62728'])
    ax3.set_title('CPU Utilization')

    ax4 = fig.add_subplot(gs[1, 1])
    ax4.pie([mem, other_mem], labels=[f'Mem {mem:.1f}%', f'Free {other_mem:.1f}%'], autopct='%1.0f%%', colors=['#9467bd', '#8c564b'])
    ax4.set_title('Memory Utilization')

    # Security metrics (bars)
    ax5 = fig.add_subplot(gs[1, 2])
    ac_rate = numeric(safe_get(metrics, 'security', 'accessControlEnforcementRate'))
    ua_rate = numeric(safe_get(metrics, 'security', 'unauthorizedAccessRate'))
    ax5.bar(['AccessCtrl%','Unauthorized%'], [ac_rate, ua_rate], color=['#1f77b4','#ff7f0e'])
    ax5.set_ylim(0, 100)
    ax5.set_title('Security Metrics (%)')
    for i, v in enumerate([ac_rate, ua_rate]):
        ax5.text(i, v + 1, f"{v:.1f}%", ha='center')

    # Usability metrics
    ax6 = fig.add_subplot(gs[2, 0])
    avg_task = numeric(safe_get(metrics, 'usability', 'averageTaskCompletionTime'))
    error_rate = numeric(safe_get(metrics, 'usability', 'errorRate'))
    ax6.bar(['TaskTime(s)','Error%'], [avg_task, error_rate], color=['#17becf', '#e377c2'])
    ax6.set_title('Usability')
    for i, v in enumerate([avg_task, error_rate]):
        ax6.text(i, v + 0.1, f"{v:.2f}", ha='center')

    # Scalability metrics
    ax7 = fig.add_subplot(gs[2, 1])
    conc_users = numeric(safe_get(metrics, 'scalability', 'concurrentUsers'))
    success_rate = numeric(safe_get(metrics, 'scalability', 'transactionSuccessRate'))
    ax7.bar(['Concurrent','Success%'], [conc_users, success_rate], color=['#7f7f7f', '#bcbd22'])
    ax7.set_title('Scalability')
    for i, v in enumerate([conc_users, success_rate]):
        ax7.text(i, v + (0.5 if i==0 else 1.0), f"{v:.2f}", ha='center')

    # Blockchain top-level snapshot (if present)
    ax8 = fig.add_subplot(gs[2, 2])
    gas_usg = numeric(safe_get(metrics, 'blockchain', 'averageGasUsage'))
    gas_cost = numeric(safe_get(metrics, 'blockchain', 'gasCostPerTransactionUSD'))
    onchain_tp = numeric(safe_get(metrics, 'blockchain', 'onchainThroughput'))
    ax8.bar(['GasUnits','GasUSD','OnchainTPS'], [gas_usg, gas_cost, onchain_tp], color=['#9edae5','#98df8a','#ff9896'])
    ax8.set_title('Blockchain Snapshot')
    for i, v in enumerate([gas_usg, gas_cost, onchain_tp]):
        ax8.text(i, v + max(1.0, v * 0.02), f"{v:.2f}", ha='center', fontsize=8)

    plt.tight_layout()
    fig.suptitle('EHR System Metrics Report — ' + datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'), y=1.02)
    plt.subplots_adjust(top=0.90)
    fig.savefig(out_png, dpi=150)
    plt.close(fig)
    print(f"Saved PNG report to {out_png}")


def write_html(metrics, png_path, html_path):
    # Write a simple HTML report that embeds the PNG and shows a key/value table
    title = 'EHR Metrics Report'
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')

    def kv_table_section(section_name, obj):
        if not obj:
            return f'<h4>{section_name}</h4><p>N/A</p>'
        rows = ''.join([f'<tr><td>{k}</td><td>{v}</td></tr>' for k, v in sorted(obj.items())])
        return f'<h4>{section_name}</h4><table>{rows}</table>'

    html = f"""
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>{title}</title>
      <style>
        body {{ font-family: Arial, Helvetica, sans-serif; margin: 20px; }}
        img.report {{ max-width: 100%; height: auto; border: 1px solid #ddd; }}
        table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
        table, th, td {{ border: 1px solid #ccc; }}
        td {{ padding: 6px; }}
        h2 {{ margin-top: 10px }}
      </style>
    </head>
    <body>
      <h1>{title}</h1>
      <p>Generated: {now}</p>
      <h2>Overview</h2>
      <img class="report" src="{os.path.basename(png_path)}" alt="metrics report" />

      <h2>Details</h2>
      {kv_table_section('Performance', metrics.get('performance'))}
      {kv_table_section('Security', metrics.get('security'))}
      {kv_table_section('Usability', metrics.get('usability'))}
      {kv_table_section('Scalability', metrics.get('scalability'))}
      {kv_table_section('Blockchain', metrics.get('blockchain'))}
      {kv_table_section('Analytical', metrics.get('analytical'))}

    </body>
    </html>
    """
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Saved HTML report to {html_path}")


def write_svg(metrics, svg_path):
    # A small textual SVG summary (portable image you can open directly)
    title = 'EHR Metrics Summary'
    cpu = numeric(safe_get(metrics, 'performance', 'cpuUtilization'))
    mem = numeric(safe_get(metrics, 'performance', 'memoryUtilization'))
    tps = numeric(safe_get(metrics, 'performance', 'throughput'))
    ac_rate = numeric(safe_get(metrics, 'security', 'accessControlEnforcementRate'))
    succ = numeric(safe_get(metrics, 'scalability', 'transactionSuccessRate'))

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="240">
      <style>
        .title {{ font: bold 18px sans-serif; fill: #222 }}
        .label {{ font: 12px sans-serif; fill: #333 }}
        .value {{ font: bold 14px sans-serif; fill: #0088FE }}
      </style>
      <rect width="100%" height="100%" fill="#fff" stroke="#ddd" />
      <text x="20" y="30" class="title">{title}</text>

      <text x="20" y="66" class="label">CPU Utilization</text>
      <text x="300" y="66" class="value">{cpu:.1f}%</text>

      <text x="20" y="96" class="label">Memory Utilization</text>
      <text x="300" y="96" class="value">{mem:.1f}%</text>

      <text x="20" y="126" class="label">Throughput (TPS)</text>
      <text x="300" y="126" class="value">{tps:.2f}</text>

      <text x="20" y="156" class="label">Access Control Rate</text>
      <text x="300" y="156" class="value">{ac_rate:.1f}%</text>

      <text x="20" y="186" class="label">Transaction Success Rate</text>
      <text x="300" y="186" class="value">{succ:.1f}%</text>

      <text x="620" y="216" class="label">Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</text>
    </svg>
    '''
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg)
    print(f"Saved SVG summary to {svg_path}")


def main():
    metrics = fetch_metrics(METRICS_URL)
    out_png = os.path.join(OUT_DIR, 'metrics_report.png')
    out_html = os.path.join(OUT_DIR, 'metrics_report.html')
    out_svg = os.path.join(OUT_DIR, 'metrics_report.svg')

    create_png(metrics, out_png)
    # copy PNG into same dir as HTML by using the basename reference
    write_html(metrics, out_png, out_html)
    write_svg(metrics, out_svg)

    print('\nDone. Files created:')
    print(' -', out_png)
    print(' -', out_html)
    print(' -', out_svg)
    print('\nOpen the HTML file in a browser to view the report.')


if __name__ == '__main__':
    main()

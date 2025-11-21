import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const MetricsDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/metrics');
                const data = await response.json();
                setMetrics(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchMetrics();
        // Refresh every 30 seconds
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div>Loading metrics...</div>;
    if (error) return <div>Error loading metrics: {error}</div>;
    if (!metrics) return <div>No metrics available</div>;

    // Format performance data for charts
    const performanceData = [
        { name: 'Encryption', value: parseFloat(metrics.performance.averageEncryptionTime) },
        { name: 'Decryption', value: parseFloat(metrics.performance.averageDecryptionTime) },
        { name: 'Upload', value: parseFloat(metrics.performance.averageUploadLatency) },
        { name: 'Download', value: parseFloat(metrics.performance.averageDownloadLatency) }
    ];

    // Format system resources data
    const resourceData = [
        { name: 'CPU', value: parseFloat(metrics.performance.cpuUtilization) },
        { name: 'Memory', value: parseFloat(metrics.performance.memoryUtilization) }
    ];

    return (
        <div className="metrics-dashboard">
            <h2>System Metrics Dashboard</h2>
            
            <div className="metrics-section">
                <h3>Performance Metrics</h3>
                <BarChart width={600} height={300} data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Latency (ms)" />
                </BarChart>
            </div>

            <div className="metrics-section">
                <h3>System Resources</h3>
                <PieChart width={400} height={300}>
                    <Pie
                        data={resourceData}
                        cx={200}
                        cy={150}
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                    >
                        {resourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </div>

            <div className="metrics-section">
                <h3>Security Metrics</h3>
                <div className="metric-cards">
                    <div className="metric-card">
                        <h4>Access Control Rate</h4>
                        <p>{metrics.security.accessControlEnforcementRate}%</p>
                    </div>
                    <div className="metric-card">
                        <h4>Unauthorized Access Rate</h4>
                        <p>{metrics.security.unauthorizedAccessRate}%</p>
                    </div>
                </div>
            </div>

            <div className="metrics-section">
                <h3>Usability & Scalability</h3>
                <div className="metric-cards">
                    <div className="metric-card">
                        <h4>Error Rate</h4>
                        <p>{metrics.usability.errorRate}%</p>
                    </div>
                    <div className="metric-card">
                        <h4>Transaction Success Rate</h4>
                        <p>{metrics.scalability.transactionSuccessRate}%</p>
                    </div>
                    <div className="metric-card">
                        <h4>Concurrent Users</h4>
                        <p>{metrics.scalability.concurrentUsers}</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .metrics-dashboard {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .metrics-section {
                    margin-bottom: 40px;
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .metric-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .metric-card {
                    background: #f5f5f5;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                }
                .metric-card h4 {
                    margin: 0 0 10px 0;
                    color: #333;
                }
                .metric-card p {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 0;
                    color: #0088FE;
                }
            `}</style>
        </div>
    );
};

export default MetricsDashboard;
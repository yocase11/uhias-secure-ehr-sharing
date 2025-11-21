const os = require('os');
const { performance } = require('perf_hooks');

class MetricsCollector {
    constructor() {
        this.metrics = {
            performance: {
                encryptionTime: [],
                decryptionTime: [],
                uploadLatency: [],
                downloadLatency: [],
                endToEndLatency: [],
                responseTime: [],
                throughput: {
                    startTime: Date.now(),
                    requestCount: 0
                }
            },
            security: {
                accessAttempts: 0,
                unauthorizedAttempts: 0,
                successfulAccess: 0,
                auditLogs: []
            },
            usability: {
                taskCompletionTimes: [],
                errorCount: 0,
                totalRequests: 0,
                consentLatencies: []
            },
            scalability: {
                concurrentUsers: new Set(),
                successfulTransactions: 0,
                totalTransactions: 0,
                systemStartTime: Date.now()
            }
        };
    }

    // Performance Metrics
    recordEncryptionTime(ms) {
        this.metrics.performance.encryptionTime.push(ms);
    }

    recordDecryptionTime(ms) {
        this.metrics.performance.decryptionTime.push(ms);
    }

    recordUploadLatency(ms) {
        this.metrics.performance.uploadLatency.push(ms);
    }

    recordDownloadLatency(ms) {
        this.metrics.performance.downloadLatency.push(ms);
    }

    recordEndToEndLatency(ms) {
        this.metrics.performance.endToEndLatency.push(ms);
    }

    recordResponseTime(ms) {
        this.metrics.performance.responseTime.push(ms);
    }

    // System Metrics
    getCPUUtilization() {
        const cpus = os.cpus();
        const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
        const totalTick = cpus.reduce((acc, cpu) => 
            acc + Object.values(cpu.times).reduce((a, b) => a + b), 0);
        return ((1 - totalIdle / totalTick) * 100).toFixed(2);
    }

    getMemoryUtilization() {
        const used = process.memoryUsage().heapUsed;
        const total = os.totalmem();
        return ((used / total) * 100).toFixed(2);
    }

    // Security Metrics
    recordAccessAttempt(authorized) {
        this.metrics.security.accessAttempts++;
        if (!authorized) {
            this.metrics.security.unauthorizedAttempts++;
        } else {
            this.metrics.security.successfulAccess++;
        }
    }

    recordAuditEvent(event) {
        this.metrics.security.auditLogs.push({
            timestamp: new Date(),
            ...event
        });
    }

    // Usability Metrics
    recordTaskCompletion(taskType, timeMs) {
        this.metrics.usability.taskCompletionTimes.push({
            type: taskType,
            time: timeMs
        });
    }

    recordError() {
        this.metrics.usability.errorCount++;
    }

    recordRequest() {
        this.metrics.usability.totalRequests++;
        this.metrics.performance.throughput.requestCount++;
    }

    // Scalability Metrics
    recordActiveUser(userId) {
        this.metrics.scalability.concurrentUsers.add(userId);
    }

    recordTransaction(success) {
        this.metrics.scalability.totalTransactions++;
        if (success) {
            this.metrics.scalability.successfulTransactions++;
        }
    }

    // Generate Reports
    getPerformanceReport() {
        const avgArray = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 0;
        
        return {
            averageEncryptionTime: avgArray(this.metrics.performance.encryptionTime),
            averageDecryptionTime: avgArray(this.metrics.performance.decryptionTime),
            averageUploadLatency: avgArray(this.metrics.performance.uploadLatency),
            averageDownloadLatency: avgArray(this.metrics.performance.downloadLatency),
            averageEndToEndLatency: avgArray(this.metrics.performance.endToEndLatency),
            averageResponseTime: avgArray(this.metrics.performance.responseTime),
            throughput: (this.metrics.performance.throughput.requestCount / 
                ((Date.now() - this.metrics.performance.throughput.startTime) / 1000)).toFixed(2),
            cpuUtilization: this.getCPUUtilization(),
            memoryUtilization: this.getMemoryUtilization()
        };
    }

    getSecurityReport() {
        return {
            accessControlEnforcementRate: (this.metrics.security.successfulAccess / 
                Math.max(1, this.metrics.security.accessAttempts) * 100).toFixed(2),
            unauthorizedAccessRate: (this.metrics.security.unauthorizedAttempts / 
                Math.max(1, this.metrics.security.accessAttempts) * 100).toFixed(2),
            auditLogsCount: this.metrics.security.auditLogs.length
        };
    }

    getUsabilityReport() {
        return {
            averageTaskCompletionTime: (this.metrics.usability.taskCompletionTimes.reduce((acc, curr) => 
                acc + curr.time, 0) / Math.max(1, this.metrics.usability.taskCompletionTimes.length)).toFixed(2),
            errorRate: (this.metrics.usability.errorCount / 
                Math.max(1, this.metrics.usability.totalRequests) * 100).toFixed(2),
            totalRequests: this.metrics.usability.totalRequests
        };
    }

    getScalabilityReport() {
        return {
            concurrentUsers: this.metrics.scalability.concurrentUsers.size,
            transactionSuccessRate: (this.metrics.scalability.successfulTransactions / 
                Math.max(1, this.metrics.scalability.totalTransactions) * 100).toFixed(2),
            uptime: ((Date.now() - this.metrics.scalability.systemStartTime) / 1000 / 60).toFixed(2) // minutes
        };
    }

    getAllMetrics() {
        return {
            performance: this.getPerformanceReport(),
            security: this.getSecurityReport(),
            usability: this.getUsabilityReport(),
            scalability: this.getScalabilityReport()
        };
    }
}

module.exports = new MetricsCollector();
const metrics = require('./utils/metrics');

// Middleware to track response times
const metricsMiddleware = (req, res, next) => {
    const start = performance.now();
    
    // Record active user if authenticated
    if (req.user) {
        metrics.recordActiveUser(req.user.id);
    }

    // Record request
    metrics.recordRequest();

    // Override end to capture response time
    const originalEnd = res.end;
    res.end = function(...args) {
        const duration = performance.now() - start;
        metrics.recordResponseTime(duration);
        
        // Record transaction success based on status code
        metrics.recordTransaction(res.statusCode >= 200 && res.statusCode < 400);
        
        originalEnd.apply(res, args);
    };

    next();
};

module.exports = metricsMiddleware;
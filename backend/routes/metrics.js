const express = require('express');
const router = express.Router();
const metrics = require('../utils/metrics');

// Get all metrics
router.get('/', (req, res) => {
    res.json(metrics.getAllMetrics());
});

// Get specific metric category
router.get('/:category', (req, res) => {
    const category = req.params.category;
    switch(category) {
        case 'performance':
            res.json(metrics.getPerformanceReport());
            break;
        case 'security':
            res.json(metrics.getSecurityReport());
            break;
        case 'usability':
            res.json(metrics.getUsabilityReport());
            break;
        case 'scalability':
            res.json(metrics.getScalabilityReport());
            break;
        default:
            res.status(404).json({ error: 'Invalid metric category' });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../api/auth');
const AuditTrail = require('../../models/AuditTrail');

// @route   POST api/audit
// @desc    Add an audit trail entry
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { action, details } = req.body;

        const newAuditTrail = new AuditTrail({
            user: req.user.id,
            action,
            details
        });

        const auditTrail = await newAuditTrail.save();
        res.json(auditTrail);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/audit
// @desc    Get all audit trail entries
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const auditTrails = await AuditTrail.find().populate('user', ['name', 'email']).sort({ timestamp: -1 });
        res.json(auditTrails);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

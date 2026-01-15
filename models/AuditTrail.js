const mongoose = require('mongoose');

const AuditTrailSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = AuditTrail = mongoose.model('audittrail', AuditTrailSchema);

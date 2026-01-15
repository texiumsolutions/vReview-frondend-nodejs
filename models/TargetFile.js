const mongoose = require('mongoose');

const TargetFileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    data: {
        type: Array,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TargetFile', TargetFileSchema);

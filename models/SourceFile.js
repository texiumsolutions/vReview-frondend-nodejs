const mongoose = require('mongoose');

const SourceFileSchema = new mongoose.Schema({
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

module.exports = mongoose.model('SourceFile', SourceFileSchema);

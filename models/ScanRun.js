const mongoose = require('mongoose');

const scanRunSchema = new mongoose.Schema({
  profile_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  run_number: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  objects_processed: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Running', 'Finished', 'Failed'],
    default: 'Finished'
  },
  started: {
    type: Date,
    default: Date.now
  },
  ended: {
    type: Date
  },
  data: [mongoose.Schema.Types.Mixed] // Store Excel data
}, {
  timestamps: true
});

module.exports = mongoose.model('ScanRun', scanRunSchema);
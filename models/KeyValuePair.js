// models/KeyValuePair.js - SIMPLIFIED (Array format for single profile)
const mongoose = require('mongoose');

const keyValuePairSchema = new mongoose.Schema({
  profileId: {
    type: String,
    required: true,
    index: true
  },
  // Store key-value pairs as an array of objects
  keyValuePairs: {
    type: [{
      key: {
        type: String,
        required: true,
        trim: true
      },
      value: {
        type: String,
        default: '',
        trim: true
      },
      value2: {
        type: String,
        default: '',
        trim: true
      },
      source: {
        type: String,
        enum: ['manual', 'excel', 'database'],
        default: 'manual'
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  // Metadata
  metadata: {
    totalPairs: {
      type: Number,
      default: 0
    },
    sources: {
      type: [String],
      default: []
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for efficient queries
keyValuePairSchema.index({ profileId: 1 }, { unique: true });
keyValuePairSchema.index({ "keyValuePairs.key": 1 });

const KeyValuePair = mongoose.model('fe_KeyValuePair', keyValuePairSchema);

module.exports = KeyValuePair;
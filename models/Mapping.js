// models/Mapping.js
const mongoose = require('mongoose');

const mappingSchema = new mongoose.Schema({
  profileId: {
    type: String,
    required: true
  },
  // Excel data structure
  mappings: [{
    sourceColumn: {
      type: String,
      default: ""
    },
    targetColumn: {
      type: String,
      required: true
    },
    mappingType: {
      type: String,
      default: "Not Mapped"
    },
    formula: {
      type: String,
      default: ""
    }
  }],
  // Additional info
  sourceHeaders: [String],
  savedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Create index for faster queries
mappingSchema.index({ profileId: 1 });

const Mapping = mongoose.model('fe_Mapping', mappingSchema);

module.exports = Mapping;
const mongoose = require('mongoose');

const fieldMappingSchema = new mongoose.Schema({
  profileId: {
    type: String,
    required: true,
    index: true
  },
  // Simple identifier without scan runs
  sessionId: {
    type: String,
    default: () => `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Field mapping data
  targetField: {
    type: String,
    required: true
  },
  sourceField: {
    type: String,
    default: ''
  },
  dataType: {
    type: String,
    enum: ['String', 'Number', 'Boolean', 'Date', 'ObjectReference', 'String'],
    default: 'String'
  },
  mappingType: {
    type: String,
    enum: [
      'One to One Mapping',
      'Default Value Mapping',
      'Mapping Using Formula',
      'Data Mapping',
      'One to Many Mapping',
      'Many to One Mapping',
      'Conditional Mapping',
      'Not Mapped'
    ],
    default: 'Not Mapped'
  },
  formula: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Mapped', 'Unmapped', 'Pending'],
    default: 'Unmapped'
  },
  required: {
    type: Boolean,
    default: false
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  originalSourceHeader: {
    type: String,
    default: ''
  },
  
  // Metadata for tracking
  excelFileName: {
    type: String
  },
  exportTimestamp: {
    type: Date
  },
  
  // Timestamps
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

// Create compound index for unique target fields per profile
fieldMappingSchema.index({ profileId: 1, targetField: 1 }, { unique: true });

// Pre-save middleware
fieldMappingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Ensure target field has _v suffix if not present
  if (this.targetField && !this.targetField.endsWith('_v')) {
    this.targetField = `${this.targetField}_v`;
  }
  
  next();
});

const FieldMapping = mongoose.model('fe_FieldMapping', fieldMappingSchema);

module.exports = FieldMapping;
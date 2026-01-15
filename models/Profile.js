// const mongoose = require('mongoose');
// const Counter = require('./Counter'); // We'll create a counter model

// const profileSchema = new mongoose.Schema({
//   profileId: {
//     type: Number,
//     unique: true
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   type: {
//     type: String,
//     default: 'Filesystem'
//   },
//   excel_path: {
//     type: String,
//     required: true
//   },
//   location: {
//     type: String
//   },
//   description: {
//     type: String
//   },
//   loader_file_path: {
//     type: String
//   },
//   mapping_file_path: {
//     type: String
//   },
//   transformation: {
//     type: String,
//     enum: ['Basic', 'Advanced', 'Custom', 'None'],
//     default: 'Basic'
//   },
//   migration_type: {
//     type: String,
//     enum: ['Full', 'Incremental', 'Delta', 'Test'],
//     default: 'Full'
//   },
//   scan_runs: [{
//     run_number: Number,
//     description: String,
//     objects_processed: Number,
//     status: {
//       type: String,
//       enum: ['Running', 'Finished', 'Failed'],
//       default: 'Finished'
//     },
//     started: Date,
//     ended: Date,
//     data: [mongoose.Schema.Types.Mixed], // Store Excel data
//     headers: [String] // Store Excel headers
//   }]
// }, {
//   timestamps: true
// });

// // Generate sequential ID before saving
// profileSchema.pre('save', async function(next) {
//   if (this.isNew) {
//     try {
//       const counter = await Counter.findByIdAndUpdate(
//         { _id: 'profileId' },
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true }
//       );
//       this.profileId = counter.seq;
//       next();
//     } catch (error) {
//       next(error);
//     }
//   } else {
//     next();
//   }
// });

// // Index for better query performance
// profileSchema.index({ profileId: 1 });
// profileSchema.index({ name: 1 });
// profileSchema.index({ type: 1 });
// profileSchema.index({ createdAt: -1 });

// module.exports = mongoose.model('Profile', profileSchema);


// const mongoose = require('mongoose');
// const Counter = require('./Counter');

// const profileSchema = new mongoose.Schema({
//   profileId: {
//     type: Number,
//     unique: true
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   type: {
//     type: String,
//     default: 'Filesystem'
//   },
//   excel_path: {
//     type: String,
//     required: true
//   },
//   location: {
//     type: String
//   },
//   description: {
//     type: String
//   },
//   loader_file_path: {
//     type: String
//   },
//   mapping_file_path: {
//     type: String
//   },
//   transformation: {
//     type: String,
//     enum: ['Basic', 'Advanced', 'Custom', 'None'],
//     default: 'Basic'
//   },
//   migration_type: {
//     type: String,
//     enum: ['Full', 'Incremental', 'Delta', 'Test'],
//     default: 'Full'
//   },
//   scan_runs: [{
//     run_number: Number,
//     description: String,
//     objects_processed: Number,
//     status: {
//       type: String,
//       enum: ['Running', 'Finished', 'Failed'],
//       default: 'Finished'
//     },
//     started: Date,
//     ended: Date,
//     data: [mongoose.Schema.Types.Mixed], // Store Excel data
//     headers: [String], // Store Excel headers
//     transform_data: [{
//       source_object: mongoose.Schema.Types.Mixed, // Original source data
//       transformed_object: mongoose.Schema.Types.Mixed, // Transformed data
//       transformation_details: [{
//         column_name: String,
//         original_value: String,
//         transformed_value: String,
//         transformation_function: String, // Function applied (e.g., 'reverse', 'uppercase', etc.)
//         transformation_applied: Boolean
//       }]
//     }]
//   }]
// }, {
//   timestamps: true
// });

// // Generate sequential ID before saving
// profileSchema.pre('save', async function(next) {
//   if (this.isNew) {
//     try {
//       const counter = await Counter.findByIdAndUpdate(
//         { _id: 'profileId' },
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true }
//       );
//       this.profileId = counter.seq;
//       next();
//     } catch (error) {
//       next(error);
//     }
//   } else {
//     next();
//   }
// });

// // Index for better query performance
// profileSchema.index({ profileId: 1 });
// profileSchema.index({ name: 1 });
// profileSchema.index({ type: 1 });
// profileSchema.index({ createdAt: -1 });

// module.exports = mongoose.model('Profile', profileSchema);


const mongoose = require('mongoose');
const Counter = require('./Counter');

const profileSchema = new mongoose.Schema({
  profileId: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    default: 'Filesystem'
  },
  excel_path: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  description: {
    type: String
  },
  loader_file_path: {
    type: String
  },
  mapping_file_path: {
    type: String
  },
  transformation: {
    type: String,
    enum: ['Basic', 'Advanced', 'Custom', 'None'],
    default: 'Basic'
  },
  migration_type: {
    type: String,
    enum: ['Full', 'Incremental', 'Delta', 'Test'],
    default: 'Full'
  },
  keyValuePairs: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'KeyValuePair'
}]
,
  scan_runs: [{
    run_number: Number,
    description: String,
    objects_processed: Number,
    status: {
      type: String,
      enum: ['Running', 'Finished', 'Failed'],
      default: 'Finished'
    },
    started: Date,
    ended: Date,
    data: [mongoose.Schema.Types.Mixed], // Store Excel data
    headers: [String] // Store Excel headers
  }],
  transform_data: [{
    scan_run_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'scan_runs',
      required: true
    },
    source_object: mongoose.Schema.Types.Mixed, // Original source data
    transformed_object: mongoose.Schema.Types.Mixed, // Transformed data
    transformation_details: [{
      column_name: String,
      original_value: String,
      transformed_value: String,
      transformation_function: String, // Function applied (e.g., 'reverse', 'uppercase', etc.)
      transformation_applied: Boolean
    }],
    created_at: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate sequential ID before saving
profileSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'profileId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.profileId = counter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Index for better query performance
profileSchema.index({ profileId: 1 });
profileSchema.index({ name: 1 });
profileSchema.index({ type: 1 });
profileSchema.index({ createdAt: -1 });
profileSchema.index({ 'transform_data.scan_run_id': 1 });

module.exports = mongoose.model('fe_Profile', profileSchema);
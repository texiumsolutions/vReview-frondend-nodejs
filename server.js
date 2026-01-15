require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/profile_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Import models
const Profile = require('./models/Profile');
const Counter = require('./models/Counter');
// Import the KeyValuePair model
const KeyValuePair = require('./models/KeyValuePair');
const mappingRoutes = require('./routes/mappingRoutes');


// API Routes

// Get all profiles with pagination
app.get('/api/profiles', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const profiles = await Profile.find()
      .sort({ profileId: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Profile.countDocuments();
    
    res.json({
      profiles,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProfiles: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search profiles
app.get('/api/profiles/search', async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const searchQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { excel_path: { $regex: q, $options: 'i' } },
        { transformation: { $regex: q, $options: 'i' } },
        { migration_type: { $regex: q, $options: 'i' } }
      ]
    };
    
    const profiles = await Profile.find(searchQuery)
      .sort({ profileId: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Profile.countDocuments(searchQuery);
    
    res.json({
      profiles,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProfiles: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single profile by ID
app.get('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ profileId: req.params.id });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new profile
app.post('/api/profiles', async (req, res) => {
  try {
    const {
      name,
      type,
      excel_path,
      location,
      description,
      loader_file_path,
      mapping_file_path,
      transformation,
      migration_type
    } = req.body;

    // Check if profile with same name already exists
    const existingProfile = await Profile.findOne({ name });
    if (existingProfile) {
      return res.status(400).json({ error: 'Profile with this name already exists' });
    }

    const profile = new Profile({
      name,
      type: type || 'Filesystem',
      excel_path,
      location: location || excel_path,
      description,
      loader_file_path,
      mapping_file_path,
      transformation: transformation || 'Basic',
      migration_type: migration_type || 'Full'
    });

    await profile.save();
    res.status(201).json({
      message: 'Profile created successfully',
      profile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a profile
app.put('/api/profiles/:id', async (req, res) => {
  try {
    const {
      name,
      type,
      excel_path,
      location,
      description,
      loader_file_path,
      mapping_file_path,
      transformation,
      migration_type
    } = req.body;

    // Check if another profile with the same name exists (excluding current profile)
    if (name) {
      const existingProfile = await Profile.findOne({ 
        name, 
        profileId: { $ne: req.params.id } 
      });
      if (existingProfile) {
        return res.status(400).json({ error: 'Another profile with this name already exists' });
      }
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { profileId: req.params.id },
      {
        name,
        type,
        excel_path,
        location: location || excel_path,
        description,
        loader_file_path,
        mapping_file_path,
        transformation,
        migration_type
      },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a profile
app.delete('/api/profiles/:id', async (req, res) => {
  try {
    const deletedProfile = await Profile.findOneAndDelete({ profileId: req.params.id });
    if (!deletedProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excel processing endpoint with file upload
app.post('/api/read-excel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Process data as needed
    const headers = data[0];
    const rows = data.slice(1);
    const objectsProcessed = rows.length;
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      data: rows,
      headers,
      objectsProcessed,
      message: 'Excel file processed successfully'
    });
  } catch (error) {
    console.error('Error processing Excel file:', error);
    res.status(500).json({ error: 'Failed to process Excel file' });
  }
});

// Excel processing from path (existing functionality)
app.post('/api/read-excel-path', async (req, res) => {
  try {
    const { path: excelPath } = req.body;
    
    if (!fs.existsSync(excelPath)) {
      return res.status(400).json({ error: 'File not found' });
    }
    
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Process data as needed
    const headers = data[0];
    const rows = data.slice(1);
    const objectsProcessed = rows.length;
    
    res.json({
      data: rows,
      headers,
      objectsProcessed,
      message: 'Excel file processed successfully'
    });
  } catch (error) {
    console.error('Error reading Excel file:', error);
    res.status(500).json({ error: 'Failed to read Excel file' });
  }
});

// Save scan run to profile (REPLACE existing runs)
app.post('/api/profiles/:id/scan-runs', async (req, res) => {
  try {
    const { description, objects_processed, data, headers } = req.body;
    
    const profile = await Profile.findOne({ profileId: req.params.id });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Clear all existing scan runs (only keep one at a time)
    profile.scan_runs = [];
    
    const newRun = {
      run_number: 1, // Always 1 since we're replacing
      description: description || `Scan Run`,
      objects_processed: objects_processed || 0,
      status: 'Finished',
      started: new Date(),
      ended: new Date(),
      data: data || [],
      headers: headers || []
    };
    
    profile.scan_runs.push(newRun);
    await profile.save();
    
    res.json({
      message: 'Scan run saved successfully (replaced previous run)',
      run: newRun,
      runId: profile.scan_runs[0]._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get scan runs for a profile
app.get('/api/profiles/:id/scan-runs', async (req, res) => {
  try {
    const profile = await Profile.findOne({ profileId: req.params.id });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json({ scan_runs: profile.scan_runs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific scan run with its data
app.get('/api/profiles/:profileId/scan-runs/:runId', async (req, res) => {
  try {
    const profile = await Profile.findOne({ profileId: req.params.profileId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const scanRun = profile.scan_runs.id(req.params.runId);
    if (!scanRun) {
      return res.status(404).json({ error: 'Scan run not found' });
    }
    
    res.json({ scan_run: scanRun });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get source objects for a specific scan run
app.get('/api/profiles/:profileId/scan-runs/:runId/source-objects', async (req, res) => {
  try {
    const profile = await Profile.findOne({ profileId: req.params.profileId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const scanRun = profile.scan_runs.id(req.params.runId);
    if (!scanRun) {
      return res.status(404).json({ error: 'Scan run not found' });
    }
    
    // Format data for frontend table
    const sourceObjects = scanRun.data.map((row, index) => {
      const obj = {};
      scanRun.headers.forEach((header, headerIndex) => {
        obj[header] = row[headerIndex] || '';
      });
      obj._id = index; // Add unique identifier for frontend
      return obj;
    });
    
    res.json({ 
      source_objects: sourceObjects,
      headers: scanRun.headers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SEPARATE TRANSFORM DATA ENDPOINTS

// Save transform data for a scan run
// Save transform data for a scan run - REPLACE existing data

app.post('/api/profiles/:profileId/scan-runs/:runId/transform-data', async (req, res) => {
  try {
    const { transformData } = req.body;
    
    if (!transformData || !Array.isArray(transformData)) {
      return res.status(400).json({ error: 'Transform data is required and must be an array' });
    }

    console.log(`=== TRANSFORM DATA REPLACEMENT START ===`);
    console.log(`Profile ID: ${req.params.profileId}`);
    console.log(`Run ID: ${req.params.runId}`);
    console.log(`New transform data records: ${transformData.length}`);

    // Find the profile
    const profile = await Profile.findOne({ profileId: req.params.profileId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    console.log(`Current transform_data count before: ${profile.transform_data.length}`);

    // Convert runId to ObjectId for proper comparison
    let targetRunId;
    try {
      targetRunId = new mongoose.Types.ObjectId(req.params.runId);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid run ID format' });
    }

    // DEBUG: Log all existing transform data scan_run_ids
    console.log('=== EXISTING TRANSFORM DATA SCAN_RUN_IDS ===');
    profile.transform_data.forEach((td, index) => {
      console.log(`Index ${index}: scan_run_id = ${td.scan_run_id} (type: ${typeof td.scan_run_id})`);
    });
    console.log(`Target run ID: ${targetRunId} (type: ${typeof targetRunId})`);

    // REMOVE ALL existing transform data for this scan run
    const initialCount = profile.transform_data.length;
    
    // Method 1: Filter out records with matching scan_run_id
    profile.transform_data = profile.transform_data.filter(td => {
      if (!td.scan_run_id) {
        return true; // Keep records without scan_run_id (shouldn't happen, but just in case)
      }
      
      // Compare ObjectId with ObjectId
      const shouldKeep = !td.scan_run_id.equals(targetRunId);
      if (!shouldKeep) {
        console.log(`Removing record with scan_run_id: ${td.scan_run_id}`);
      }
      return shouldKeep;
    });

    const removedCount = initialCount - profile.transform_data.length;
    console.log(`Removed ${removedCount} existing transform records`);

    // ADD NEW transform data
    const transformDataWithRunId = transformData.map((item, index) => ({
      _id: new mongoose.Types.ObjectId(), // Explicitly create new ObjectId
      ...item,
      scan_run_id: targetRunId,
      created_at: new Date(),
      batch_index: index
    }));

    console.log(`Adding ${transformDataWithRunId.length} new transform records`);
    profile.transform_data.push(...transformDataWithRunId);

    // Save the profile
    await profile.save();

    // Verify the save worked
    const updatedProfile = await Profile.findOne({ profileId: req.params.profileId });
    const finalCount = updatedProfile.transform_data.length;
    
    console.log(`Final transform_data count: ${finalCount}`);
    console.log(`=== TRANSFORM DATA REPLACEMENT COMPLETE ===`);

    res.json({
      message: 'Transform data REPLACED successfully',
      transform_data_count: transformDataWithRunId.length,
      records_removed: removedCount,
      records_added: transformDataWithRunId.length,
      final_count: finalCount
    });

  } catch (error) {
    console.error('Error replacing transform data:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to replace transform data in database'
    });
  }
});

// Save transform data in batches to avoid 16MB limit
// Save transform data in batches to avoid 16MB limit (FIXED)
app.post('/api/profiles/:profileId/scan-runs/:runId/transform-data-batch', async (req, res) => {
  try {
    const { transformData, batchIndex, totalBatches, clearExisting = true } = req.body;
    
    if (!transformData || !Array.isArray(transformData)) {
      return res.status(400).json({ error: 'Transform data is required and must be an array' });
    }

    console.log(`Processing batch ${batchIndex + 1}/${totalBatches} with ${transformData.length} records`);

    const profile = await Profile.findOne({ profileId: req.params.profileId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const scanRun = profile.scan_runs.id(req.params.runId);
    if (!scanRun) {
      return res.status(404).json({ error: 'Scan run not found' });
    }

    let removedCount = 0;
    
    // For first batch, clear existing data if clearExisting is true
    if (batchIndex === 0 && clearExisting) {
      console.log(`Clearing existing transform data for scan run ${req.params.runId}`);
      const initialCount = profile.transform_data.length;
      
      // FIXED: Properly compare ObjectId with string
      profile.transform_data = profile.transform_data.filter(
        td => {
          const tdRunId = td.scan_run_id ? td.scan_run_id.toString() : null;
          const targetRunId = req.params.runId.toString();
          return tdRunId !== targetRunId;
        }
      );
      
      removedCount = initialCount - profile.transform_data.length;
      console.log(`Removed ${removedCount} old transform records`);
    }

    // Add scan_run_id to each transform data item
    const transformDataWithRunId = transformData.map(item => ({
      ...item,
      scan_run_id: req.params.runId,
      batch_index: batchIndex,
      created_at: new Date()
    }));

    // Add the batch transform data
    profile.transform_data.push(...transformDataWithRunId);

    // Save the profile
    await profile.save();

    console.log(`Successfully saved batch ${batchIndex + 1}/${totalBatches} with ${transformDataWithRunId.length} records`);

    const response = {
      message: `Batch ${batchIndex + 1}/${totalBatches} saved successfully`,
      batch_index: batchIndex,
      records_saved: transformDataWithRunId.length,
      total_batches: totalBatches,
      action: batchIndex === 0 && clearExisting ? 'replaced' : 'appended'
    };

    // Include removal info only for first batch when clearing existing data
    if (batchIndex === 0 && clearExisting) {
      response.records_removed = removedCount;
    }

    res.json(response);
  } catch (error) {
    console.error('Error saving transform data batch:', error);
    
    if (error.message && error.message.includes('BSONObj size')) {
      return res.status(500).json({ 
        error: 'Data too large. Please reduce batch size.',
        details: 'Batch exceeds MongoDB 16MB document limit'
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// COMPLETE TRANSFORM DATA REPLACEMENT WITH BATCH PROCESSING
app.post('/api/profiles/:profileId/scan-runs/:runId/transform-data-replace', async (req, res) => {
  try {
    const { transformData } = req.body;
    
    if (!transformData || !Array.isArray(transformData)) {
      return res.status(400).json({ error: 'Transform data is required and must be an array' });
    }

    console.log(`=== STARTING COMPLETE TRANSFORM DATA REPLACEMENT ===`);
    console.log(`Profile: ${req.params.profileId}, Run: ${req.params.runId}`);
    console.log(`New records: ${transformData.length}`);

    const profile = await Profile.findOne({ profileId: req.params.profileId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const scanRun = profile.scan_runs.id(req.params.runId);
    if (!scanRun) {
      return res.status(404).json({ error: 'Scan run not found' });
    }

    console.log(`Current transform_data count: ${profile.transform_data.length}`);

    // STEP 1: REMOVE ALL EXISTING TRANSFORM DATA FOR THIS SCAN RUN
    const targetRunId = new mongoose.Types.ObjectId(req.params.runId);
    
    // Count records to be removed
    const recordsToRemove = profile.transform_data.filter(td => 
      td.scan_run_id && td.scan_run_id.equals(targetRunId)
    ).length;
    
    console.log(`Records to remove: ${recordsToRemove}`);

    // Remove using MongoDB update operation (more reliable)
    const removeResult = await Profile.updateOne(
      { profileId: req.params.profileId },
      { 
        $pull: { 
          transform_data: { 
            scan_run_id: targetRunId
          } 
        } 
      }
    );

    console.log(`Remove result:`, removeResult);

    // STEP 2: PROCESS NEW DATA IN BATCHES TO AVOID 16MB LIMIT
    const BATCH_SIZE = 500; // Adjust based on your data size
    const batches = [];
    
    // Split data into batches
    for (let i = 0; i < transformData.length; i += BATCH_SIZE) {
      batches.push(transformData.slice(i, i + BATCH_SIZE));
    }

    console.log(`Split into ${batches.length} batches of ${BATCH_SIZE} records each`);

    let totalAdded = 0;

    // Process batches sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      // Prepare batch data with ObjectId
      const batchData = batch.map(item => ({
        ...item,
        scan_run_id: targetRunId,
        created_at: new Date(),
        batch_index: batchIndex
      }));

      // Add batch to database
      const batchResult = await Profile.updateOne(
        { profileId: req.params.profileId },
        { 
          $push: { 
            transform_data: { 
              $each: batchData 
            } 
          } 
        }
      );

      totalAdded += batch.length;
      console.log(`Batch ${batchIndex + 1}/${batches.length} added: ${batch.length} records`);

      // Small delay between batches to avoid overwhelming the database
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // STEP 3: VERIFY FINAL COUNT
    const finalProfile = await Profile.findOne({ profileId: req.params.profileId });
    const finalCount = finalProfile.transform_data.length;

    console.log(`=== REPLACEMENT COMPLETE ===`);
    console.log(`Removed: ${recordsToRemove} old records`);
    console.log(`Added: ${totalAdded} new records`);
    console.log(`Final count: ${finalCount} total records`);

    res.json({
      message: 'Transform data completely replaced successfully',
      records_removed: recordsToRemove,
      records_added: totalAdded,
      final_record_count: finalCount,
      batches_processed: batches.length,
      action: 'replaced'
    });

  } catch (error) {
    console.error('Error in complete transform data replacement:', error);
    
    if (error.message && error.message.includes('BSONObj size')) {
      return res.status(500).json({ 
        error: 'Data too large. Please reduce batch size or transform fewer columns.',
        details: 'MongoDB 16MB document limit exceeded',
        suggestion: 'Try reducing BATCH_SIZE in the backend or transforming fewer columns'
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get all transform data for a profile
app.get('/api/profiles/:profileId/transform-data', async (req, res) => {
  try {
    const profile = await Profile.findOne({ profileId: req.params.profileId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json({ 
      transform_data: profile.transform_data || [],
      total_transformed: profile.transform_data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transform data for a specific scan run
app.get('/api/profiles/:profileId/scan-runs/:runId/transform-data', async (req, res) => {
  try {
    const profile = await Profile.findOne({ profileId: req.params.profileId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const transformDataForRun = profile.transform_data.filter(
      td => td.scan_run_id.toString() === req.params.runId
    );
    
    res.json({ 
      transform_data: transformDataForRun,
      total_transformed: transformDataForRun.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transformed objects for frontend display (for a specific scan run)
app.get('/api/profiles/:profileId/scan-runs/:runId/transformed-objects', async (req, res) => {
  try {
    const profile = await Profile.findOne({ profileId: req.params.profileId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const transformDataForRun = profile.transform_data.filter(
      td => td.scan_run_id.toString() === req.params.runId
    );
    
    // Format transform data for frontend table
    const transformedObjects = transformDataForRun.map((transformItem, index) => {
      const obj = {
        _id: transformItem._id || index,
        ...transformItem.transformed_object
      };
      
      // Add transformation metadata for display
      obj._transform_metadata = {
        transformations_applied: transformItem.transformation_details.filter(td => td.transformation_applied).length,
        total_columns: transformItem.transformation_details.length,
        transformation_details: transformItem.transformation_details,
        scan_run_id: transformItem.scan_run_id
      };
      
      return obj;
    });
    
    // Get headers from transformed objects
    const headers = transformedObjects.length > 0 
      ? Object.keys(transformedObjects[0]).filter(key => !key.startsWith('_'))
      : [];
    
    res.json({ 
      transformed_objects: transformedObjects,
      headers: headers,
      total_transformed: transformedObjects.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare source vs transformed data for a specific object
app.get('/api/profiles/:profileId/transform-data/:transformId', async (req, res) => {
  try {
    const profile = await Profile.findOne({ profileId: req.params.profileId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const transformItem = profile.transform_data.id(req.params.transformId);
    if (!transformItem) {
      return res.status(404).json({ error: 'Transform data not found' });
    }
    
    res.json({
      source_object: transformItem.source_object,
      transformed_object: transformItem.transformed_object,
      transformation_details: transformItem.transformation_details,
      scan_run_id: transformItem.scan_run_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transform data for a specific scan run
app.delete('/api/profiles/:profileId/scan-runs/:runId/transform-data', async (req, res) => {
  try {
    const profile = await Profile.findOne({ profileId: req.params.profileId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Remove transform data for this scan run
    profile.transform_data = profile.transform_data.filter(
      td => !td.scan_run_id.equals(req.params.runId)
    );
    
    await profile.save();
    
    res.json({
      message: 'Transform data deleted successfully',
      deleted_for_scan_run: req.params.runId
    });
  } catch (error) {
    console.error('Error deleting transform data:', error);
    res.status(500).json({ error: error.message });
  }
});



// Add this after other transform data endpoints in server.js

// Save key-value mapping transform data to profile
// ==============================================
// SIMPLE KEY-VALUE PAIR ROUTES (ARRAY FORMAT)
// ==============================================

// Save key-value pairs for a profile (REPLACE entire array)
app.post('/api/profiles/:profileId/save-keyvalue-pairs', async (req, res) => {
  try {
    const { keyValuePairs } = req.body;
    const { profileId } = req.params;

    console.log(`Saving key-value pairs for profile: ${profileId}`);
    console.log(`Number of pairs to save: ${keyValuePairs?.length || 0}`);

    if (!keyValuePairs || !Array.isArray(keyValuePairs)) {
      return res.status(400).json({ 
        success: false,
        error: 'Key-value pairs data is required and must be an array' 
      });
    }

    if (!profileId) {
      return res.status(400).json({ 
        success: false,
        error: 'Profile ID is required' 
      });
    }

    // Check if profile exists (optional, but good for validation)
    const profileExists = await Profile.findOne({ profileId });
    if (!profileExists) {
      console.warn(`Profile ${profileId} not found, but will save key-value pairs anyway`);
    }

    // Prepare the key-value pairs data
    const preparedPairs = keyValuePairs.map(pair => ({
      key: pair.key?.toString().trim() || '',
      value: pair.value?.toString().trim() || '',
      value2: pair.value2?.toString().trim() || '',
      source: pair.source || 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Calculate statistics
    const sources = [...new Set(preparedPairs.map(p => p.source))];
    
    // Save or update the key-value pairs document
    const result = await KeyValuePair.findOneAndUpdate(
      { profileId },
      {
        $set: {
          profileId,
          keyValuePairs: preparedPairs,
          metadata: {
            totalPairs: preparedPairs.length,
            sources: sources,
            lastUpdated: new Date()
          },
          updatedAt: new Date()
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    console.log(`Successfully saved ${preparedPairs.length} key-value pairs for profile ${profileId}`);

    res.json({
      success: true,
      message: 'Key-value pairs saved successfully',
      data: {
        profileId,
        totalPairs: preparedPairs.length,
        sources: sources,
        savedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error saving key-value pairs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: 'Failed to save key-value pairs'
    });
  }
});

// Get key-value pairs for a profile
app.get('/api/profiles/:profileId/keyvalue-pairs', async (req, res) => {
  try {
    const { profileId } = req.params;
    const { 
      search,
      source,
      limit = 1000,
      page = 1
    } = req.query;

    console.log(`Fetching key-value pairs for profile: ${profileId}`);

    // Find the key-value pairs document
    const kvDocument = await KeyValuePair.findOne({ profileId });
    
    if (!kvDocument) {
      return res.json({
        success: true,
        message: 'No key-value pairs found for this profile',
        data: {
          keyValuePairs: [],
          metadata: {
            totalPairs: 0,
            sources: [],
            lastUpdated: null
          }
        }
      });
    }

    let filteredPairs = [...kvDocument.keyValuePairs];

    // Apply filters if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPairs = filteredPairs.filter(pair => 
        pair.key.toLowerCase().includes(searchLower) ||
        pair.value.toLowerCase().includes(searchLower) ||
        pair.value2.toLowerCase().includes(searchLower)
      );
    }

    if (source) {
      filteredPairs = filteredPairs.filter(pair => pair.source === source);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPairs = filteredPairs.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        keyValuePairs: paginatedPairs,
        metadata: {
          totalPairs: kvDocument.metadata.totalPairs,
          filteredPairs: filteredPairs.length,
          sources: kvDocument.metadata.sources,
          lastUpdated: kvDocument.metadata.lastUpdated,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredPairs.length,
            pages: Math.ceil(filteredPairs.length / limit)
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching key-value pairs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Add individual key-value pair (append to array)
app.post('/api/profiles/:profileId/keyvalue-pairs/add', async (req, res) => {
  try {
    const { profileId } = req.params;
    const { key, value, value2, source = 'manual' } = req.body;

    if (!key || key.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Key is required' 
      });
    }

    const newPair = {
      key: key.trim(),
      value: value?.toString().trim() || '',
      value2: value2?.toString().trim() || '',
      source,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add the pair to the array
    const result = await KeyValuePair.findOneAndUpdate(
      { profileId },
      {
        $push: { keyValuePairs: newPair },
        $inc: { 'metadata.totalPairs': 1 },
        $addToSet: { 'metadata.sources': source },
        $set: { 
          'metadata.lastUpdated': new Date(),
          updatedAt: new Date()
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Key-value pair added successfully',
      data: {
        profileId,
        newPair,
        totalPairs: result.metadata.totalPairs
      }
    });

  } catch (error) {
    console.error('Error adding key-value pair:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Update specific key-value pair
app.put('/api/profiles/:profileId/keyvalue-pairs/:key', async (req, res) => {
  try {
    const { profileId, key } = req.params;
    const { value, value2, source } = req.body;

    const keyDecoded = decodeURIComponent(key);

    // Build update object
    const updateFields = {};
    if (value !== undefined) updateFields['keyValuePairs.$.value'] = value.toString().trim();
    if (value2 !== undefined) updateFields['keyValuePairs.$.value2'] = value2.toString().trim();
    if (source !== undefined) updateFields['keyValuePairs.$.source'] = source;
    updateFields['keyValuePairs.$.updatedAt'] = new Date();
    updateFields['metadata.lastUpdated'] = new Date();
    updateFields['updatedAt'] = new Date();

    const result = await KeyValuePair.findOneAndUpdate(
      { 
        profileId,
        'keyValuePairs.key': keyDecoded
      },
      {
        $set: updateFields
      },
      {
        new: true
      }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Key not found'
      });
    }

    res.json({
      success: true,
      message: 'Key-value pair updated successfully',
      data: {
        profileId,
        key: keyDecoded,
        updatedFields: updateFields
      }
    });

  } catch (error) {
    console.error('Error updating key-value pair:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Delete specific key-value pair
app.delete('/api/profiles/:profileId/keyvalue-pairs/:key', async (req, res) => {
  try {
    const { profileId, key } = req.params;
    const keyDecoded = decodeURIComponent(key);

    const result = await KeyValuePair.findOneAndUpdate(
      { profileId },
      {
        $pull: { 
          keyValuePairs: { key: keyDecoded }
        },
        $inc: { 'metadata.totalPairs': -1 },
        $set: { 
          'metadata.lastUpdated': new Date(),
          updatedAt: new Date()
        }
      },
      {
        new: true
      }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Key-value pair deleted successfully',
      data: {
        profileId,
        deletedKey: keyDecoded,
        remainingPairs: result.metadata.totalPairs
      }
    });

  } catch (error) {
    console.error('Error deleting key-value pair:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Clear all key-value pairs for a profile
app.delete('/api/profiles/:profileId/keyvalue-pairs', async (req, res) => {
  try {
    const { profileId } = req.params;

    const result = await KeyValuePair.findOneAndDelete({ profileId });

    if (!result) {
      return res.json({
        success: true,
        message: 'No key-value pairs found to delete'
      });
    }

    res.json({
      success: true,
      message: 'All key-value pairs cleared successfully',
      data: {
        profileId,
        deletedCount: result.metadata.totalPairs
      }
    });

  } catch (error) {
    console.error('Error clearing key-value pairs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Check if key-value pairs exist for a profile
app.get('/api/profiles/:profileId/keyvalue-pairs/exists', async (req, res) => {
  try {
    const { profileId } = req.params;

    const kvDocument = await KeyValuePair.findOne({ profileId });

    const exists = !!kvDocument && kvDocument.keyValuePairs.length > 0;

    res.json({
      success: true,
      data: {
        exists,
        count: exists ? kvDocument.keyValuePairs.length : 0,
        lastUpdated: exists ? kvDocument.metadata.lastUpdated : null
      }
    });

  } catch (error) {
    console.error('Error checking key-value pairs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// In server.js, update the create-test-profile endpoint
app.post('/api/create-test-profile', async (req, res) => {
  try {
    // Check if profile already exists
    const existingProfile = await Profile.findOne({ profileId: 1 });
    if (existingProfile) {
      return res.json({
        message: 'Profile already exists',
        profileId: 1,
        scanRunId: existingProfile.scan_runs[0]?._id || 'create-scan-run-first'
      });
    }
    
    // Create a test profile with all required fields
    const testProfile = new Profile({
      profileId: 1, // Numeric ID
      name: 'Test Profile',
      type: 'Filesystem',
      excel_path: '/default/path.xlsx', // Add required field
      location: '/default/location',
      description: 'Test profile for key-value pairs',
      loader_file_path: '/default/loader.txt',
      mapping_file_path: '/default/mapping.txt',
      transformation: 'Basic',
      migration_type: 'Full'
    });
    
    await testProfile.save();
    
    // Create a test scan run if not exists
    if (!testProfile.scan_runs || testProfile.scan_runs.length === 0) {
      testProfile.scan_runs.push({
        run_number: 1,
        description: 'Test Scan Run',
        objects_processed: 0,
        status: 'Finished',
        started: new Date(),
        ended: new Date(),
        data: [],
        headers: []
      });
      
      await testProfile.save();
    }
    
    res.json({
      message: 'Test profile created successfully',
      profileId: 1,
      scanRunId: testProfile.scan_runs[0]._id,
      profile: {
        name: testProfile.name,
        scanRunsCount: testProfile.scan_runs.length
      }
    });
  } catch (error) {
    console.error('Error creating test profile:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to create test profile'
    });
  }
});


// Routes
app.use('/api/profiles', mappingRoutes);



// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
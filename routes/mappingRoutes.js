// routes/mappingRoutes.js
const express = require('express');
const router = express.Router();
const Mapping = require('../models/Mapping');

// Save/Update Excel data to MongoDB
router.post('/:profileId/mappings', async (req, res) => {
  try {
    const { profileId } = req.params;
    const { mappings, sourceHeaders } = req.body;

    console.log('📥 Saving mapping data for profile:', profileId);
    console.log('📊 Number of mappings:', mappings?.length);

    // Validate data
    if (!mappings || !Array.isArray(mappings)) {
      return res.status(400).json({
        success: false,
        error: 'Mappings data is required as an array'
      });
    }

    // Prepare mapping data (only Excel columns)
    const excelMappings = mappings.map(item => ({
      sourceColumn: item.sourceField || item.originalSourceHeader || "",
      targetColumn: item.targetField,
      mappingType: item.mappingType || "Not Mapped",
      formula: item.formula || ""
    }));

    // Check if mapping already exists for this profile
    const existingMapping = await Mapping.findOne({ profileId });

    if (existingMapping) {
      // UPDATE existing mapping
      existingMapping.mappings = excelMappings;
      existingMapping.sourceHeaders = sourceHeaders || [];
      existingMapping.savedAt = new Date();
      
      const updatedMapping = await existingMapping.save();
      
      console.log('✅ Mapping updated successfully');
      
      return res.status(200).json({
        success: true,
        message: 'Mapping updated successfully',
        data: {
          profileId,
          mappingsCount: updatedMapping.mappings.length,
          savedAt: updatedMapping.savedAt,
          isUpdate: true
        }
      });
    } else {
      // CREATE new mapping
      const newMapping = new Mapping({
        profileId,
        mappings: excelMappings,
        sourceHeaders: sourceHeaders || []
      });

      const savedMapping = await newMapping.save();
      
      console.log('✅ New mapping saved successfully');
      
      return res.status(201).json({
        success: true,
        message: 'Mapping saved successfully',
        data: {
          profileId,
          mappingsCount: savedMapping.mappings.length,
          savedAt: savedMapping.savedAt,
          isUpdate: false
        }
      });
    }

  } catch (error) {
    console.error('❌ Error saving mapping:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save mapping data',
      details: error.message
    });
  }
});

// Get saved mapping for a profile
router.get('/:profileId/mappings', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const mapping = await Mapping.findOne({ profileId });
    
    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'No mapping found for this profile'
      });
    }

    res.status(200).json({
      success: true,
      data: mapping
    });

  } catch (error) {
    console.error('❌ Error fetching mapping:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mapping data'
    });
  }
});

module.exports = router;
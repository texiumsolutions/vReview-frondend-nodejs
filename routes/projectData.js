const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');

// @route   POST /api/project/:projectId
// @desc    Save project data
// @access  Private
router.post('/:projectId', auth, async (req, res) => {
    const { homogenize, source, target, mapping } = req.body;
    try {
        let project = await Project.findOne({ userId: req.user.id, projectId: req.params.projectId });
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        project.homogenize = homogenize;
        project.source = source;
        project.target = target;
        project.mapping = mapping;

        await project.save();
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/project/:projectId
// @desc    Get project data
// @access  Private
router.get('/:projectId', auth, async (req, res) => {
    try {
        let project = await Project.findOne({ userId: req.user.id, projectId: req.params.projectId });
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }
        res.json({
            homogenize: project.homogenize,
            source: project.source,
            target: project.target,
            mapping: project.mapping
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
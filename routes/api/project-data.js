const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Project = require('../../models/Project');

// @route   GET api/project-data/:projectId
// @desc    Get project data by projectId
// @access  Private
router.get('/:projectId', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ projectId: req.params.projectId, userId: req.user.id });
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }
        res.json(project.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/project-data/:projectId
// @desc    Save project data
// @access  Private
router.post('/:projectId', auth, async (req, res) => {
    const { mappings, sourceHeaders, targetHeaders } = req.body;

    try {
        let project = await Project.findOne({ projectId: req.params.projectId, userId: req.user.id });

        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        project.data = { mappings, sourceHeaders, targetHeaders };
        await project.save();
        res.json(project.data);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

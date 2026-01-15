const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Project = require('../../models/Project');

// @route   GET api/project
// @desc    Get user's project structure
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ userId: req.user.id });
        if (!project) {
            const projectId = `${req.user.id}-${Date.now()}`;
            const newProject = new Project({
                userId: req.user.id,
                projectId,
                tree: []
            });
            await newProject.save();
            return res.json({ tree: [], projectId: newProject.projectId });
        }
        res.json({ tree: project.tree, projectId: project.projectId });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/project
// @desc    Save user's project structure
// @access  Private
router.post('/', auth, async (req, res) => {
    const { tree } = req.body;

    try {
        let project = await Project.findOne({ userId: req.user.id });

        if (project) {
            // Update existing project
            project.tree = tree;
            await project.save();
            return res.json(project);
        }

        // This part should ideally not be reached if GET is called first
        const projectId = `${req.user.id}-${Date.now()}`;
        project = new Project({
            userId: req.user.id,
            projectId,
            tree
        });

        await project.save();
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/project/validation
// @desc    Save validation strategy
// @access  Private
router.post('/validation', auth, async (req, res) => {
    const { validationStrategy } = req.body;

    try {
        let project = await Project.findOne({ userId: req.user.id });

        if (project) {
            project.validationStrategy = validationStrategy;
            await project.save();
            return res.json(project);
        }

        res.status(404).send('Project not found');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;

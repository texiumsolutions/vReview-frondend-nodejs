const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Project = require('../../models/Project');

// Helper function to find node by ID
const findNodeById = (nodes, id) => {
    try {
        if (!nodes || !Array.isArray(nodes)) return null;

        for (const node of nodes) {
            if (node && node.id === id) return node;
            if (node && node.children && Array.isArray(node.children)) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    } catch (error) {
        console.error('Error in findNodeById:', error);
        return null;
    }
};

// Helper function to add node to parent
const addNodeToParent = (nodes, parentId, newNode) => {
    if (!nodes || !Array.isArray(nodes)) {
        return parentId ? [] : [newNode];
    }

    return nodes.map(node => {
        if (node.id === parentId) {
            if (node.type === 'folder') {
                return {
                    ...node,
                    expanded: true,
                    children: [...(node.children || []), newNode]
                };
            } else {
                console.warn(`Cannot add children to file node: ${node.id}`);
                return node;
            }
        }
        if (node.children && Array.isArray(node.children)) {
            return {
                ...node,
                children: addNodeToParent(node.children, parentId, newNode)
            };
        }
        return node;
    });
};

// Helper function to update node
const updateNodeInTree = (nodes, id, updates) => {
    if (!nodes || !Array.isArray(nodes)) return nodes;

    return nodes.map(node => {
        if (node.id === id) {
            return { ...node, ...updates, updatedAt: new Date() };
        }
        if (node.children && Array.isArray(node.children)) {
            return {
                ...node,
                children: updateNodeInTree(node.children, id, updates)
            };
        }
        return node;
    });
};

// Helper function to delete node
const deleteNodeFromTree = (nodes, id) => {
    if (!nodes || !Array.isArray(nodes)) return [];

    return nodes.filter(node => {
        if (node.id === id) return false;
        if (node.children && Array.isArray(node.children)) {
            node.children = deleteNodeFromTree(node.children, id);
        }
        return true;
    });
};

// GET /api/files - Get sidebar structure and selected file
router.get('/', auth, async (req, res) => {
    try {
        console.log('GET /api/files - User ID:', req.user.id);

        let project = await Project.findOne({ userId: req.user.id });

        if (!project) {
            console.log('No project found, creating new one...');
            // Create project with proper projectId
            const projectId = `project-${req.user.id}-${Date.now()}`;
            project = new Project({
                userId: req.user.id,
                projectId: projectId,
                tree: [],
                selectedFileId: null
            });

            try {
                await project.save();
                console.log('New project created:', projectId);
            } catch (saveError) {
                console.error('Error saving new project:', saveError);
                // Try to find project again in case it was created by another request
                project = await Project.findOne({ userId: req.user.id });
                if (!project) {
                    return res.status(500).json({
                        msg: 'Failed to create project',
                        error: saveError.message
                    });
                }
            }
        }

        // Ensure tree is always an array
        const tree = Array.isArray(project.tree) ? project.tree : [];

        console.log('Returning tree with', tree.length, 'items');
        res.json({
            tree: tree,
            selectedFileId: project.selectedFileId
        });
    } catch (err) {
        console.error('GET /api/files Error:', err.message);
        console.error(err.stack);
        res.status(500).json({
            msg: 'Server Error',
            error: err.message
        });
    }
});

// POST /api/files - Create new file or folder
router.post('/', auth, async (req, res) => {
    const { name, parentId, type = 'file' } = req.body;

    try {
        console.log('POST /api/files - Creating:', { type, name, parentId });
        console.log('User ID:', req.user.id);

        let project = await Project.findOne({ userId: req.user.id });

        if (!project) {
            console.log('Project not found, creating new one...');

            // Create project with explicit projectId to ensure it's set
            const projectId = `project-${req.user.id}-${Date.now()}`;
            console.log('Creating project with ID:', projectId);

            project = new Project({
                userId: req.user.id,
                projectId: projectId, // Explicitly set projectId
                tree: [],
                selectedFileId: null
            });

            // Save the project first
            try {
                await project.save();
                console.log('New project created successfully:', projectId);
            } catch (saveError) {
                console.error('Error saving new project:', saveError);

                // If there's still a validation error, try to find existing project
                project = await Project.findOne({ userId: req.user.id });
                if (!project) {
                    return res.status(500).json({
                        msg: 'Failed to create project',
                        error: saveError.message
                    });
                }
            }
        }

        console.log('Project found/created:', project.projectId);

        let newNode;
        if (type === 'file') {
            newNode = {
                id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                label: name || 'New File',
                type: 'file',
                expanded: false,
                content: {
                    homogenize: {
                        dataStructures: [],
                        selectedType: "",
                        selectedStructure: ""
                    },
                    source: {
                        connectionType: "WINDOWS_FILE",
                        connectionName: "Select",
                        dataStructureName: "",
                        files: "",
                        query: "",
                        uploadedFile: null,
                        previewData: []
                    },
                    target: {
                        connectionType: "WINDOWS_FILE",
                        connectionName: "Select",
                        dataStructureName: "",
                        files: "",
                        query: "",
                        uploadedFile: null,
                        previewData: []
                    },
                    mapping: {
                        mappings: [],
                        validationStrategy: "exhaustive",
                        options: {
                            isAllKey: false,
                            ignoreNewLineChar: false,
                            includeDistinctDuplicate: false,
                            mismatchCSV: false
                        }
                    },
                    openSections: {
                        homogenize: true,
                        source: false,
                        target: false,
                        mapping: false
                    }
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
        } else if (type === 'folder') {
            newNode = {
                id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                label: name || 'New Folder',
                type: 'folder',
                expanded: true,
                children: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
        } else {
            return res.status(400).json({ msg: 'Invalid node type' });
        }

        let newTree;
        if (parentId) {
            newTree = addNodeToParent(project.tree || [], parentId, newNode);
        } else {
            newTree = [...(project.tree || []), newNode];
        }

        project.tree = newTree;

        // Only set selected file if it's a file, not a folder
        if (type === 'file') {
            project.selectedFileId = newNode.id;
        }

        // Save the updated project
        await project.save();

        console.log(`${type} created successfully:`, newNode.id);
        res.json({
            node: newNode,
            selectedFileId: project.selectedFileId
        });
    } catch (err) {
        console.error('POST /api/files Error:', err.message);
        console.error('Error details:', err);

        // More detailed error response
        if (err.name === 'ValidationError') {
            const validationErrors = [];
            for (const field in err.errors) {
                validationErrors.push({
                    field: field,
                    message: err.errors[field].message,
                    value: err.errors[field].value
                });
            }
            return res.status(400).json({
                msg: 'Validation Error',
                errors: validationErrors
            });
        }

        res.status(500).json({
            msg: 'Server Error',
            error: err.message
        });
    }
});

// GET /api/files/:id - Get file content by ID
router.get('/:id', auth, async (req, res) => {
    try {
        console.log('GET /api/files/:id - File ID:', req.params.id);

        const project = await Project.findOne({ userId: req.user.id });
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Ensure tree is an array
        const tree = Array.isArray(project.tree) ? project.tree : [];

        const fileNode = findNodeById(tree, req.params.id);
        if (!fileNode) {
            return res.status(404).json({ msg: 'File not found - node not found in tree' });
        }

        if (fileNode.type !== 'file') {
            return res.status(400).json({ msg: 'Requested node is not a file' });
        }

        // Ensure content exists with proper defaults
        const fileContent = fileNode.content || {};
        const defaultContent = {
            homogenize: { dataStructures: [], selectedType: "", selectedStructure: "" },
            source: { connectionType: "WINDOWS_FILE", connectionName: "Select", dataStructureName: "", files: "", query: "", uploadedFile: null, previewData: [] },
            target: { connectionType: "WINDOWS_FILE", connectionName: "Select", dataStructureName: "", files: "", query: "", uploadedFile: null, previewData: [] },
            mapping: { mappings: [], validationStrategy: "exhaustive", options: { isAllKey: false, ignoreNewLineChar: false, includeDistinctDuplicate: false, mismatchCSV: false } },
            openSections: { homogenize: true, source: false, target: false, mapping: false }
        };

        // Merge with defaults to ensure all properties exist
        const mergedContent = {
            homogenize: { ...defaultContent.homogenize, ...fileContent.homogenize },
            source: { ...defaultContent.source, ...fileContent.source },
            target: { ...defaultContent.target, ...fileContent.target },
            mapping: { ...defaultContent.mapping, ...fileContent.mapping },
            openSections: { ...defaultContent.openSections, ...fileContent.openSections }
        };

        // Update selected file
        project.selectedFileId = req.params.id;
        await project.save();

        console.log('File content loaded successfully for:', fileNode.label);
        res.json({
            content: mergedContent,
            fileInfo: {
                id: fileNode.id,
                label: fileNode.label,
                createdAt: fileNode.createdAt || new Date(),
                updatedAt: fileNode.updatedAt || new Date()
            }
        });
    } catch (err) {
        console.error('GET /api/files/:id Error:', err.message);
        console.error('Error stack:', err.stack);
        res.status(500).json({
            msg: 'Server Error loading file content',
            error: err.message
        });
    }
});

// PUT /api/files/:id - Update file content or node label
router.put('/:id', auth, async (req, res) => {
    const { content, label } = req.body;

    try {
        console.log('PUT /api/files/:id - Updating node:', req.params.id);

        const project = await Project.findOne({ userId: req.user.id });
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const tree = Array.isArray(project.tree) ? project.tree : [];

        const updatedTree = updateNodeInTree(tree, req.params.id, { content, label });

        // Check if node was found and updated
        const checkIfNodeExists = (nodes, id) => {
            for (const node of nodes) {
                if (node.id === id) return true;
                if (node.children && Array.isArray(node.children)) {
                    if (checkIfNodeExists(node.children, id)) return true;
                }
            }
            return false;
        };

        const nodeFound = checkIfNodeExists(updatedTree, req.params.id);

        if (!nodeFound) {
            return res.status(404).json({ msg: 'Node not found' });
        }

        project.tree = updatedTree;
        await project.save();

        res.json({ msg: 'Node updated successfully' });
    } catch (err) {
        console.error('PUT /api/files/:id Error:', err.message);
        console.error(err.stack);
        res.status(500).json({
            msg: 'Server Error',
            error: err.message
        });
    }
});

// DELETE /api/files/:id - Delete file or folder
router.delete('/:id', auth, async (req, res) => {
    try {
        console.log('DELETE /api/files/:id - Deleting node:', req.params.id);

        const project = await Project.findOne({ userId: req.user.id });
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const tree = Array.isArray(project.tree) ? project.tree : [];

        const newTree = deleteNodeFromTree(tree, req.params.id);

        // Clear selected file if it was deleted
        if (project.selectedFileId === req.params.id) {
            project.selectedFileId = null;
        }

        project.tree = newTree;
        await project.save();

        res.json({ msg: 'Node deleted successfully' });
    } catch (err) {
        console.error('DELETE /api/files/:id Error:', err.message);
        console.error(err.stack);
        res.status(500).json({
            msg: 'Server Error',
            error: err.message
        });
    }
});

// PATCH /api/files/:id/toggle - Toggle folder expansion
router.patch('/:id/toggle', auth, async (req, res) => {
    try {
        console.log('PATCH /api/files/:id/toggle - Toggling node:', req.params.id);

        const project = await Project.findOne({ userId: req.user.id });
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const tree = Array.isArray(project.tree) ? project.tree : [];

        const updatedTree = updateNodeInTree(tree, req.params.id, {
            expanded: req.body.expanded
        });

        project.tree = updatedTree;
        await project.save();

        res.json({ msg: 'Folder toggled successfully' });
    } catch (err) {
        console.error('PATCH /api/files/:id/toggle Error:', err.message);
        console.error(err.stack);
        res.status(500).json({
            msg: 'Server Error',
            error: err.message
        });
    }
});

// PATCH /api/files/:id/rename - Rename node
router.patch('/:id/rename', auth, async (req, res) => {
    const { label } = req.body;

    try {
        console.log('PATCH /api/files/:id/rename - Renaming node:', req.params.id, 'to:', label);

        if (!label || label.trim() === '') {
            return res.status(400).json({ msg: 'Label cannot be empty' });
        }

        const project = await Project.findOne({ userId: req.user.id });
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const tree = Array.isArray(project.tree) ? project.tree : [];

        const updatedTree = updateNodeInTree(tree, req.params.id, {
            label: label.trim()
        });

        // Check if node was found and updated
        const checkIfNodeExists = (nodes, id) => {
            for (const node of nodes) {
                if (node.id === id) return true;
                if (node.children && Array.isArray(node.children)) {
                    if (checkIfNodeExists(node.children, id)) return true;
                }
            }
            return false;
        };

        const nodeFound = checkIfNodeExists(updatedTree, req.params.id);

        if (!nodeFound) {
            return res.status(404).json({ msg: 'Node not found' });
        }

        project.tree = updatedTree;
        await project.save();

        res.json({ msg: 'Node renamed successfully' });
    } catch (err) {
        console.error('PATCH /api/files/:id/rename Error:', err.message);
        console.error(err.stack);
        res.status(500).json({
            msg: 'Server Error',
            error: err.message
        });
    }
});

// GET /api/files/debug/project - Debug route to check project state
router.get('/debug/project', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ userId: req.user.id });
        if (!project) {
            return res.json({
                message: 'No project found',
                userId: req.user.id
            });
        }

        return res.json({
            message: 'Project found',
            projectId: project.projectId,
            userId: project.userId,
            treeLength: project.tree?.length || 0,
            selectedFileId: project.selectedFileId,
            tree: project.tree
        });
    } catch (error) {
        console.error('Debug route error:', error);
        return res.status(500).json({
            error: error.message,
            userId: req.user.id
        });
    }
});

module.exports = router;
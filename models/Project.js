const mongoose = require('mongoose');

const FileContentSchema = new mongoose.Schema({
    homogenize: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({
            dataStructures: [],
            selectedType: "",
            selectedStructure: ""
        })
    },
    source: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({
            connectionType: "WINDOWS_FILE",
            connectionName: "Select",
            dataStructureName: "",
            files: "",
            query: "",
            uploadedFile: null,
            previewData: []
        })
    },
    target: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({
            connectionType: "WINDOWS_FILE",
            connectionName: "Select",
            dataStructureName: "",
            files: "",
            query: "",
            uploadedFile: null,
            previewData: []
        })
    },
    mapping: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({
            mappings: [],
            validationStrategy: "exhaustive",
            options: {
                isAllKey: false,
                ignoreNewLineChar: false,
                includeDistinctDuplicate: false,
                mismatchCSV: false
            }
        })
    },
    openSections: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({
            homogenize: true,
            source: false,
            target: false,
            mapping: false
        })
    }
});

const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, required: true },
    expanded: { type: Boolean, default: false },
    children: { type: [mongoose.Schema.Types.Mixed], default: undefined },
    content: { type: FileContentSchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const ProjectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    projectId: {
        type: String,
        required: true,
        unique: true
    },
    tree: { type: [NodeSchema], default: [] },
    selectedFileId: { type: String, default: null }
}, {
    versionKey: false // This disables the __v version key
});

// Pre-save middleware
ProjectSchema.pre('save', function (next) {
    if (!this.projectId) {
        this.projectId = `project-${this.userId}-${Date.now()}`;
    }

    if (!this.tree) {
        this.tree = [];
    }

    next();
});

module.exports = mongoose.model('Project', ProjectSchema);
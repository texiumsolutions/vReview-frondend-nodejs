const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const alasql = require('alasql');
const SourceFile = require('../../models/SourceFile');

const upload = multer({ dest: 'uploads/' });

router.post('/preview', upload.single('file'), async (req, res) => {
    const { query } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    try {
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const newSourceFile = new SourceFile({
            name: file.originalname,
            data: data
        });
        await newSourceFile.save();

        const result = alasql(query, [data]);

        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

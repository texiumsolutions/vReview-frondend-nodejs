const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.fields([{ name: 'file1' }, { name: 'file2' }]), (req, res) => {
    if (!req.files || !req.files.file1 || !req.files.file2) {
        return res.status(400).json({ msg: 'Please upload both files.' });
    }

    try {
        const workbook1 = xlsx.readFile(req.files.file1[0].path);
        const workbook2 = xlsx.readFile(req.files.file2[0].path);

        const sheet1 = workbook1.SheetNames[0];
        const sheet2 = workbook2.SheetNames[0];

        const sources = xlsx.utils.sheet_to_json(workbook1.Sheets[sheet1]);
        const targets = xlsx.utils.sheet_to_json(workbook2.Sheets[sheet2]);

        const matched = [];
        const mismatched = [];

        const n = sources.length;
        if (n != targets.length) {
            return res.status(400).json({ msg: 'Files have different number of rows.' });
        }


        for (let i = 0; i < n; i++) {
            const sourceRow = sources[i];
            const targetRow = targets[i];

            const result1 = sourceRow.document_status;
            const result2 = targetRow.document_status;

            let isMatch = false;
            if (result1 === "Effective" && result2 === "Approved") {
                isMatch = true;
            } else if (result1 === "In Approval" && result2 === "Approved") {
                isMatch = true;
            } else if (result1 === "In Review" && result2 === "Draft") {
                isMatch = true;
            } else if (result1 === result2) {
                isMatch = true;
            }

            if (isMatch) {
                matched.push(sourceRow);
            } else {
                mismatched.push(sourceRow);
            }
        }

        res.json({
            matched,
            mismatched,
            summary: {
                sourceCount: sources.length,
                targetCount: targets.length,
                matched: matched.length,
                mismatched: mismatched.length
            }
        });

    } catch (error) {
        console.error('Comparison Error:', error);
        res.status(500).json({ msg: 'Server error during file comparison.' });
    }
});

module.exports = router;

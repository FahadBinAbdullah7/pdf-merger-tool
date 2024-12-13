// api/merge-pdfs.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// API route for merging PDFs
router.post('/merge-pdfs', upload.array('files'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
    }

    try {
        // Create a new PDF document to merge the files into
        const pdfDoc = await PDFDocument.create();

        // Iterate over the uploaded PDF files and add their pages to the new document
        for (let i = 0; i < req.files.length; i++) {
            const filePath = req.files[i].path;
            const pdfBytes = fs.readFileSync(filePath);
            const pdf = await PDFDocument.load(pdfBytes);
            const pages = await pdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page) => pdfDoc.addPage(page));

            // Clean up: Delete the uploaded files after processing
            fs.unlinkSync(filePath);
        }

        // Save the merged PDF
        const mergedPdfBytes = await pdfDoc.save();

        // Set response headers and send the merged PDF file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
        res.send(mergedPdfBytes);

    } catch (error) {
        console.error('Error merging PDFs:', error);
        res.status(500).json({ error: 'An error occurred while merging PDFs' });
    }
});

module.exports = router;

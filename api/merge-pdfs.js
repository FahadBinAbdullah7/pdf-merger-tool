const express = require('express');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// Multer configuration for file uploads
const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory
    limits: { fileSize: 50 * 1024 * 1024 }, // Limit file size to 50 MB
});

// PDF merge route
app.post('/api/merge-pdfs', upload.array('pdfFiles', 10), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();

        for (let file of files) {
            const pdfBytes = file.buffer; // Access file buffer directly
            const existingPdfDoc = await PDFDocument.load(pdfBytes);
            const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());

            copiedPages.forEach(page => pdfDoc.addPage(page));
        }

        // Serialize the PDF document to bytes
        const mergedPdfBytes = await pdfDoc.save();

        // Set headers to trigger file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');

        // Send the PDF bytes directly
        res.send(mergedPdfBytes);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

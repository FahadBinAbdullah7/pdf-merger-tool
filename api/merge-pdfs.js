const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');

const app = express();
const port = 3000;

// Configure Multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

// PDF merge route
app.post('/api/merge-pdfs', upload.array('pdfFiles', 10), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();

        // Iterate over uploaded files
        for (const file of files) {
            const existingPdfDoc = await PDFDocument.load(file.buffer);
            const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());

            copiedPages.forEach((page) => pdfDoc.addPage(page));
        }

        // Serialize the PDF document to bytes
        const mergedPdfBytes = await pdfDoc.save();

        // Set response headers and send the PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
        res.send(mergedPdfBytes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

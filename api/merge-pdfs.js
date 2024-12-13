const express = require('express');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');

const app = express();
const port = 3000;

// Middleware for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/merge-pdfs', upload.array('pdfFiles'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No PDF files uploaded.' });
        }

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();

        for (const file of req.files) {
            const existingPdfBytes = file.buffer;
            const existingPdfDoc = await PDFDocument.load(existingPdfBytes);

            const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
            copiedPages.forEach(page => pdfDoc.addPage(page));
        }

        // Serialize the PDF document to bytes
        const mergedPdfBytes = await pdfDoc.save();

        // Send the PDF as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
        res.send(Buffer.from(mergedPdfBytes));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while merging PDFs.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

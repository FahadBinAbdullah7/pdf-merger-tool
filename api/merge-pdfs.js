const express = require('express');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
const axios = require('axios');

const app = express();
const port = 3000;

// Middleware for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware for parsing JSON
app.use(express.json());

app.post('/api/merge-pdfs', upload.array('pdfFiles'), async (req, res) => {
    try {
        const pdfDoc = await PDFDocument.create();

        // Process uploaded files if any
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const existingPdfBytes = file.buffer;
                const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
                const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
                copiedPages.forEach(page => pdfDoc.addPage(page));
            }
        }

        // Process URLs if provided
        if (req.body.pdfUrls && Array.isArray(req.body.pdfUrls)) {
            for (const url of req.body.pdfUrls) {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                const existingPdfBytes = response.data;
                const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
                const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
                copiedPages.forEach(page => pdfDoc.addPage(page));
            }
        }

        // Check if no files or URLs were provided
        if ((!req.files || req.files.length === 0) && (!req.body.pdfUrls || req.body.pdfUrls.length === 0)) {
            return res.status(400).json({ error: 'No PDF files or URLs provided.' });
        }

        // Serialize the merged PDF document
        const mergedPdfBytes = await pdfDoc.save();

        // Send the PDF as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
        res.send(Buffer.from(mergedPdfBytes));
    } catch (error) {
        console.error('Error merging PDFs:', error);
        res.status(500).json({ error: 'An error occurred while merging PDFs.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

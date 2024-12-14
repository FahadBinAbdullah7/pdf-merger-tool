const express = require('express');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
const axios = require('axios');

const app = express();
const port = 3000;

// Middleware for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware for parsing JSON bodies
app.use(express.json({ limit: '50mb' }));

app.post('/api/merge-pdfs', upload.array('pdfFiles'), async (req, res) => {
    try {
        const pdfDoc = await PDFDocument.create(); // Create a new PDF document

        // Check for uploaded files
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const existingPdfBytes = file.buffer;
                const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
                const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
                copiedPages.forEach(page => pdfDoc.addPage(page));
            }
        }

        // Check for URLs
        if (req.body.pdfUrls && Array.isArray(req.body.pdfUrls)) {
            for (const url of req.body.pdfUrls) {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                const existingPdfDoc = await PDFDocument.load(response.data);
                const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
                copiedPages.forEach(page => pdfDoc.addPage(page));
            }
        }

        // If neither files nor URLs are provided
        if ((!req.files || req.files.length === 0) && (!req.body.pdfUrls || req.body.pdfUrls.length === 0)) {
            return res.status(400).json({ error: 'No PDF files or URLs provided.' });
        }

        // Serialize the PDF document to bytes
        const mergedPdfBytes = await PDFDocument.save();

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

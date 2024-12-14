const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');

const app = express();

// Middleware for parsing JSON bodies and handling file uploads
app.use(express.json({ limit: '50mb' }));
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint to merge PDFs from URLs
app.post('/merge-pdfs-from-urls', async (req, res) => {
    try {
        const { pdfUrls } = req.body; // Expecting an array of URLs

        if (!pdfUrls || pdfUrls.length === 0) {
            return res.status(400).json({ error: 'No PDF URLs provided.' });
        }

        const pdfDoc = await PDFDocument.create();

        for (const url of pdfUrls) {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const pdfBytes = response.data;
            const existingPdfDoc = await PDFDocument.load(pdfBytes);
            const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());

            copiedPages.forEach((page) => pdfDoc.addPage(page));
        }

        const mergedPdfBytes = await pdfDoc.save();

        // Send the merged PDF as a downloadable file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=merged-from-urls.pdf');
        res.send(Buffer.from(mergedPdfBytes));
    } catch (error) {
        console.error('Error merging PDFs from URLs:', error);
        res.status(500).json({ error: 'Failed to merge PDFs from provided URLs.' });
    }
});

// Endpoint to merge uploaded PDFs
app.post('/merge-uploaded-pdfs', upload.array('pdfFiles'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No PDF files uploaded.' });
        }

        const pdfDoc = await PDFDocument.create();

        for (const file of req.files) {
            const existingPdfBytes = file.buffer;
            const existingPdfDoc = await PDFDocument.load(existingPdfBytes);

            const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
            copiedPages.forEach(page => pdfDoc.addPage(page));
        }

        const mergedPdfBytes = await pdfDoc.save();

        // Send the merged PDF as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=merged-from-uploads.pdf');
        res.send(Buffer.from(mergedPdfBytes));
    } catch (error) {
        console.error('Error merging uploaded PDFs:', error);
        res.status(500).json({ error: 'An error occurred while merging PDFs.' });
    }
});

module.exports = app;

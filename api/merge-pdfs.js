const express = require('express');
const { PDFDocument } = require('pdf-lib');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json({ limit: '50mb' })); // Increase the size limit for larger files

// PDF merge route
app.post('/api/merge-pdfs', async (req, res) => {
    try {
        const { files } = req.body;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();

        for (let file of files) {
            const pdfBytes = Buffer.from(file, 'base64');
            const existingPdfDoc = await PDFDocument.load(pdfBytes);
            const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());

            copiedPages.forEach(page => pdfDoc.addPage(page));
        }

        // Serialize the PDF document to bytes
        const mergedPdfBytes = await pdfDoc.save();

        // Convert to base64 string
        const mergedPdfBase64 = mergedPdfBytes.toString('base64');

        // Create a base64 URL (data URL)
        const base64Url = `data:application/pdf;base64,${mergedPdfBase64}`;

        // Return the base64 URL as the response
        res.json({ base64Url });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

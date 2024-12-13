const express = require('express');
const fileUpload = require('express-fileupload');
const { PDFDocument } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable file upload
app.use(fileUpload());

// Serve static files from the public directory
app.use(express.static('public'));

// API Endpoint for merging PDFs
app.post('/merge-pdfs', async (req, res) => {
    if (!req.files || !req.files.files) {
        return res.status(400).send('No files were uploaded.');
    }

    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];

    try {
        const mergedPdf = await PDFDocument.create();

        for (const file of files) {
            const pdfBuffer = file.data;
            const donorPdf = await PDFDocument.load(pdfBuffer);
            const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="merged.pdf"',
        });
        res.send(mergedPdfBytes);
    } catch (error) {
        console.error('Error merging PDFs:', error);
        res.status(500).send('An error occurred while merging the PDFs.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

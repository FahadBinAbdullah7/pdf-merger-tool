const express = require('express');
const fileUpload = require('express-fileupload');
const { PDFDocument } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for handling file uploads
app.use(fileUpload());

// Root endpoint
app.get('/', (req, res) => {
    res.send('Welcome to the PDF Merger API!');
});

// PDF merging endpoint
app.post('/merge-pdfs', async (req, res) => {
    // Check if files are uploaded
    if (!req.files || !req.files.files) {
        return res.status(400).send('No files were uploaded.');
    }

    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];

    console.log('Uploaded files:', files.map(file => file.name)); // Debug: Log file names

    try {
        const mergedPdf = await PDFDocument.create();

        for (const file of files) {
            // Validate file type
            if (file.mimetype !== 'application/pdf') {
                return res.status(400).send(`${file.name} is not a valid PDF file.`);
            }

            console.log(`Processing file: ${file.name}`); // Debug: File being processed

            const pdfBuffer = file.data;
            const donorPdf = await PDFDocument.load(pdfBuffer);

            console.log(`Loaded file: ${file.name}`); // Debug: File successfully loaded

            const copiedPages = await donorPdf.copyPages(donorPdf, donorPdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));

            console.log(`Copied pages from file: ${file.name}`); // Debug: Pages copied
        }

        // Save the merged PDF
        const mergedPdfBytes = await mergedPdf.save();

        // Set headers and send the merged PDF
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="merged.pdf"',
        });
        res.send(mergedPdfBytes);

    } catch (error) {
        console.error('Error merging PDFs:', error); // Log detailed error
        res.status(500).send('An error occurred while merging the PDFs.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

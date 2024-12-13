const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const app = express();

// Set up file upload using Multer
const upload = multer({ dest: 'uploads/' });

app.post('/api/merge-pdfs', upload.array('pdfFiles'), async (req, res) => {
    try {
        if (!req.files || req.files.length < 2) {
            return res.status(400).json({ error: 'Please upload at least two PDF files to merge.' });
        }

        // Create a new PDF document for the merged result
        const pdfDoc = await PDFDocument.create();

        // Loop through the uploaded PDFs and merge them
        for (const file of req.files) {
            const pdfBytes = fs.readFileSync(file.path);
            const donorPdfDoc = await PDFDocument.load(pdfBytes);
            const copiedPages = await pdfDoc.copyPages(donorPdfDoc, donorPdfDoc.getPageIndices());
            copiedPages.forEach((page) => pdfDoc.addPage(page));
            // Remove the uploaded file after processing
            fs.unlinkSync(file.path);
        }

        // Save the merged PDF
        const mergedPdfBytes = await pdfDoc.save();

        // Set the response header for downloading the file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
        res.send(mergedPdfBytes);

    } catch (error) {
        console.error('Error merging PDFs:', error);
        res.status(500).json({ error: 'An error occurred while merging the PDFs.' });
    }
});

// Serve static files (index.html and assets)
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

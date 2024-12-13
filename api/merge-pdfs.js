const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const app = express();
const port = 3000;

// Set up multer for file handling
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Upload directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage }).array('files');

// Middleware to ensure 'uploads' folder exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.post('/api/merge-pdfs', upload, async (req, res) => {
    try {
        // Log uploaded files for debugging
        console.log('Uploaded files:', req.files.map(file => file.originalname));

        // Validate file types
        for (let file of req.files) {
            if (!file.mimetype.startsWith('application/pdf')) {
                return res.status(400).json({ error: `File ${file.originalname} is not a valid PDF.` });
            }
        }

        // Load PDF files using pdf-lib
        const pdfDoc = await PDFDocument.create();
        for (let file of req.files) {
            const filePath = path.join(__dirname, 'uploads', file.filename);
            const pdfBytes = fs.readFileSync(filePath);
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await pdfDoc.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => pdfDoc.addPage(page));
            fs.unlinkSync(filePath); // Delete the file after processing
        }

        // Save the merged PDF to a buffer
        const mergedPdfBytes = await pdfDoc.save();

        // Set the response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
        res.send(Buffer.from(mergedPdfBytes));

    } catch (error) {
        console.error('Error merging PDFs:', error);
        res.status(500).json({ error: 'An unexpected error occurred while merging PDFs.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

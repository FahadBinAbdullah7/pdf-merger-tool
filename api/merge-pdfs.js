const { IncomingForm } = require('formidable');
const fs = require('fs');
const path = require('path');
const PDFLib = require('pdf-lib');

export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Create a new IncomingForm to handle file uploads
    const form = new IncomingForm({
        keepExtensions: true,  // Keep file extensions
        maxFileSize: 10 * 1024 * 1024,  // 10 MB limit (adjust as needed)
    });

    // Parse the incoming request and handle the files
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing files:', err);  // Log error details
            return res.status(400).json({ error: 'Error parsing files' });
        }

        // Log received files
        console.log('Files received:', files);

        const filesArray = Array.isArray(files.files) ? files.files : [files.files];
        
        // Validate that all files are PDFs
        for (const file of filesArray) {
            if (file.mimetype !== 'application/pdf') {
                return res.status(400).json({ error: 'Only PDF files are allowed.' });
            }
        }

        try {
            // Create a new PDF document to merge files into
            const pdfDoc = await PDFLib.PDFDocument.create();

            // Loop through each uploaded PDF file
            for (const file of filesArray) {
                const pdfBytes = fs.readFileSync(file.filepath);  // Read the file from the temporary location

                const donorPdf = await PDFLib.PDFDocument.load(pdfBytes);
                const copiedPages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices());
                copiedPages.forEach((page) => pdfDoc.addPage(page));
            }

            // Save the merged PDF document
            const mergedPdfBytes = await pdfDoc.save();

            // Set response headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');

            // Send the merged PDF as a response to trigger download
            return res.status(200).send(Buffer.from(mergedPdfBytes));

        } catch (error) {
            console.error('Error merging PDFs:', error);  // Log the error
            return res.status(500).json({ error: 'Failed to merge PDFs.' });
        }
    });
};

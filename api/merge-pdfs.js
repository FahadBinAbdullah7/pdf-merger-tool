const PDFLib = require('pdf-lib');
const fs = require('fs');
const path = require('path');

export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const files = req.files; // Expect files in the form of file uploads (not base64)

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        const pdfDoc = await PDFLib.PDFDocument.create();

        // Process each uploaded PDF
        for (const file of files) {
            const pdfBytes = file.buffer; // Get the file buffer
            const donorPdf = await PDFLib.PDFDocument.load(pdfBytes);
            const copiedPages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices());
            copiedPages.forEach((page) => pdfDoc.addPage(page));
        }

        const mergedPdfBytes = await pdfDoc.save();

        // Set the response header for downloading the file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
        
        // Send the merged PDF as a downloadable file
        return res.status(200).send(Buffer.from(mergedPdfBytes));

    } catch (error) {
        console.error('Error merging PDFs:', error);
        return res.status(500).json({ error: 'Failed to merge PDFs.' });
    }
};

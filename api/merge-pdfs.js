const PDFLib = require('pdf-lib');

export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const files = req.body.files; // Expect base64-encoded files array
        if (!Array.isArray(files) || files.some(file => typeof file !== 'string')) {
            return res.status(400).json({ error: 'Invalid files format. Expected an array of base64 strings.' });
        }

        const MAX_FILES = 10;
        if (files.length > MAX_FILES) {
            return res.status(400).json({ error: `Maximum of ${MAX_FILES} files allowed.` });
        }

        const pdfDoc = await PDFLib.PDFDocument.create();

        for (const file of files) {
            const pdfBytes = Buffer.from(file, 'base64'); // Decode base64
            const donorPdf = await PDFLib.PDFDocument.load(pdfBytes);
            const copiedPages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices());
            copiedPages.forEach((page) => pdfDoc.addPage(page));
        }

        const mergedPdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
        return res.status(200).send(Buffer.from(mergedPdfBytes));
    } catch (error) {
        console.error('Error merging PDFs:', error.message, error.stack);
        return res.status(500).json({ error: 'Failed to merge PDFs.' });
    }
};

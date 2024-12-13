const PDFLib = require('pdf-lib');

export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const files = req.body.files; // Expect base64-encoded files array
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
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
        return res.status(200).send(Buffer.from(mergedPdfBytes));
    } catch (error) {
        console.error('Error merging PDFs:', error);
        return res.status(500).json({ error: 'Failed to merge PDFs.' });
    }
};

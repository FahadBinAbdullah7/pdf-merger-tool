import { IncomingForm } from 'formidable';
import fs from 'fs';
import PDFLib from 'pdf-lib';

export const config = {
    api: {
        bodyParser: false, // Disable bodyParser to handle raw multipart data
    },
};

export default async (req, res) => {
    const form = new IncomingForm({
        maxFileSize: 50 * 1024 * 1024, // 50 MB file size limit
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error during file parsing:', err);
            return res.status(500).json({ error: 'Error parsing files', details: err });
        }

        const pdfFiles = files.files; // All uploaded files are in files.files

        if (!pdfFiles || pdfFiles.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        try {
            const pdfDoc = await PDFLib.PDFDocument.create();

            for (let file of pdfFiles) {
                const filePath = file[0].filepath;

                if (fs.existsSync(filePath)) {
                    const pdfBytes = fs.readFileSync(filePath); // Read the PDF file
                    const donorPdf = await PDFLib.PDFDocument.load(pdfBytes);
                    const copiedPages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices());
                    copiedPages.forEach((page) => pdfDoc.addPage(page));
                } else {
                    console.error(`File not found: ${filePath}`);
                    return res.status(500).json({ error: `File not found: ${filePath}` });
                }
            }

            const mergedPdfBytes = await pdfDoc.save();
            res.setHeader('Content-Type', 'application/pdf');
            return res.status(200).send(Buffer.from(mergedPdfBytes));
        } catch (error) {
            console.error('Error merging PDFs:', error);
            return res.status(500).json({ error: 'Failed to merge PDFs', details: error });
        }
    });
};

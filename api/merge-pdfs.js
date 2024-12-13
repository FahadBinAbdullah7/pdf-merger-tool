import { IncomingForm } from 'formidable';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

// Disable body parsing to handle the multipart/form-data manually
export const config = {
    api: {
        bodyParser: false, // Disables the default body parsing to handle form data ourselves
    },
};

export default async (req, res) => {
    // Initialize formidable to handle file parsing
    const form = new IncomingForm();

    // Parse the incoming request to handle the form data and files
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error while parsing files:', err);
            return res.status(400).json({ error: 'Error parsing files' });
        }

        try {
            // Create a new PDF document to merge the PDFs into
            const pdfDoc = await PDFDocument.create();

            // Ensure files are an array, if only one file was uploaded, turn it into an array
            const filesArray = Array.isArray(files.files) ? files.files : [files.files];

            // Loop through the uploaded files
            for (const file of filesArray) {
                // Read the PDF file data from the temporary location
                const pdfBytes = fs.readFileSync(file.filepath);

                // Load the PDF document
                const donorPdf = await PDFDocument.load(pdfBytes);

                // Get all pages from the donor PDF and add them to the new PDF document
                const copiedPages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices());
                copiedPages.forEach((page) => pdfDoc.addPage(page));
            }

            // Save the merged PDF as a byte array
            const mergedPdfBytes = await pdfDoc.save();

            // Set the response headers to indicate that a PDF file is being sent
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
            
            // Send the merged PDF in the response
            return res.status(200).send(Buffer.from(mergedPdfBytes));

        } catch (error) {
            console.error('Error while merging PDFs:', error);
            return res.status(500).json({ error: 'Failed to merge PDFs.' });
        }
    });
};

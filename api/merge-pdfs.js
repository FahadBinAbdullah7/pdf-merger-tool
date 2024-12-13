const formidable = require('formidable');
const PDFLib = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');  // Install uuid: npm install uuid

export const config = {
    api: {
        bodyParser: false,  // Disable Next.js body parser to handle file uploads manually
    },
};

export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Use formidable to parse the incoming form-data
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error during file upload:', err);
            return res.status(500).json({ error: 'Error processing file upload' });
        }

        try {
            // Get the uploaded PDF files from the form-data
            const filePaths = Object.values(files).map(file => file[0].filepath);  // If multiple files

            if (!filePaths || filePaths.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }

            const pdfDoc = await PDFLib.PDFDocument.create();

            for (const filePath of filePaths) {
                const pdfBytes = fs.readFileSync(filePath);  // Read the uploaded file
                const donorPdf = await PDFLib.PDFDocument.load(pdfBytes);
                const copiedPages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices());
                copiedPages.forEach((page) => pdfDoc.addPage(page));
            }

            // Save the merged PDF to a file with a unique name
            const mergedPdfBytes = await pdfDoc.save();
            const fileName = `merged-${uuidv4()}.pdf`;
            const filePathToSave = path.join(process.cwd(), 'public', 'uploads', fileName); // Ensure you have a folder 'public/uploads'

            // Create the uploads folder if it doesn't exist
            if (!fs.existsSync(path.join(process.cwd(), 'public', 'uploads'))) {
                fs.mkdirSync(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
            }

            // Save the merged PDF to the disk
            fs.writeFileSync(filePathToSave, mergedPdfBytes);

            // Return the URL for the downloaded file
            const downloadUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
            return res.status(200).json({ downloadUrl });

        } catch (error) {
            console.error('Error merging PDFs:', error);
            return res.status(500).json({ error: 'Failed to merge PDFs.' });
        }
    });
};

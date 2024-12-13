import formidable from 'formidable';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js built-in body parser to handle file uploads manually
  },
};

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error parsing files' });
    }

    try {
      const pdfDoc = await PDFDocument.create();
      const filePaths = Object.values(files).map(file => file[0].filepath);

      // Merge each uploaded PDF
      for (const filePath of filePaths) {
        const pdfBytes = fs.readFileSync(filePath);
        const donorPdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices());
        copiedPages.forEach((page) => pdfDoc.addPage(page));
      }

      // Save the merged PDF in memory (no file system saving)
      const mergedPdfBytes = await pdfDoc.save();

      // Set the response header for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
      
      // Send the merged PDF as a response
      res.status(200).send(Buffer.from(mergedPdfBytes));
    } catch (error) {
      console.error('Error merging PDFs:', error);
      return res.status(500).json({ error: 'Failed to merge PDFs' });
    }
  });
};

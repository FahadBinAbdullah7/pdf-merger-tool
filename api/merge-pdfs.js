const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse incoming JSON body
    const { files } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided!' });
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add pages from each uploaded PDF file
    for (const file of files) {
      const { fileContent } = file;  // File content should be base64-encoded
      const fileBuffer = Buffer.from(fileContent, 'base64');
      const donorPdfDoc = await PDFDocument.load(fileBuffer);
      const copiedPages = await pdfDoc.copyPages(donorPdfDoc, donorPdfDoc.getPageIndices());
      copiedPages.forEach((page) => pdfDoc.addPage(page));
    }

    // Save the merged PDF
    const mergedPdfBytes = await pdfDoc.save();

    // Save the merged PDF file temporarily on the server
    const tempFilePath = path.join(os.tmpdir(), 'merged.pdf');
    fs.writeFileSync(tempFilePath, mergedPdfBytes);

    // Upload the merged PDF to a public location (if needed, use AWS S3, Vercel file system, etc.)
    const downloadUrl = `https://your-vercel-domain.vercel.app/merged-pdfs/merged.pdf`; // This is just an example URL

    // Return the download URL
    return res.status(200).json({
      status: 'success',
      message: 'PDFs merged successfully.',
      downloadUrl: downloadUrl,
    });
  } catch (error) {
    console.error('Error merging PDFs:', error);
    return res.status(500).json({ error: 'An error occurred while merging the PDFs.' });
  }
};

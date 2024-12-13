const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFLib = require('pdf-lib');
const app = express();
const port = 5000;

// Set up multer for file uploads
const storage = multer.memoryStorage();  // Store files in memory for processing
const upload = multer({ storage: storage }).array('files');

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint to merge PDFs
app.post('/api/merge-pdfs', upload, async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  console.log('Uploaded Files:', req.files.map(file => file.originalname));  // Log uploaded files

  try {
    const pdfDoc = await PDFLib.PDFDocument.create();

    // Merge all uploaded PDFs
    for (const file of req.files) {
      const arrayBuffer = file.buffer;
      const donorPdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
      const copiedPages = await pdfDoc.copyPages(donorPdfDoc, donorPdfDoc.getPageIndices());
      copiedPages.forEach(page => pdfDoc.addPage(page));
    }

    // Save the merged PDF
    const mergedPdfBytes = await pdfDoc.save();
    
    // Generate a filename and save the merged PDF to disk
    const outputFileName = `merged-${Date.now()}.pdf`;
    const outputFilePath = path.join(__dirname, '../public', outputFileName);
    
    fs.writeFileSync(outputFilePath, mergedPdfBytes);
    
    // Send the download link as a response
    const downloadLink = `${req.protocol}://${req.get('host')}/` + outputFileName;
    res.status(200).json({ downloadLink: downloadLink });
  } catch (error) {
    console.error('Error merging PDFs:', error);  // Log detailed error
    res.status(500).json({ message: 'An error occurred while merging the PDFs.', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// api/merge-pdfs.js
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

module.exports = (req, res) => {
  // Handling file upload and merging
  upload.array('files')(req, res, async (err) => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(500).json({ error: 'An error occurred during file upload.' });
    }

    if (!req.files || req.files.length === 0) {
      console.error('No files uploaded.');
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    try {
      console.log('Merging PDFs...');
      const pdfDoc = await PDFDocument.create();

      // Process each uploaded PDF file
      for (const file of req.files) {
        try {
          console.log(`Processing file: ${file.originalname}`);
          const existingPdfBytes = await fs.promises.readFile(file.path);
          const donorPdfDoc = await PDFDocument.load(existingPdfBytes);
          
          const copiedPages = await pdfDoc.copyPages(donorPdfDoc, donorPdfDoc.getPageIndices());
          copiedPages.forEach((page) => pdfDoc.addPage(page));

          // Clean up uploaded files after processing
          await fs.promises.unlink(file.path);
        } catch (fileError) {
          console.error('Error processing file:', file.originalname, fileError);
          return res.status(500).json({ error: `An error occurred while processing file: ${file.originalname}` });
        }
      }

      // Save merged PDF to a buffer
      const mergedPdfBytes = await pdfDoc.save();

      // Generate a unique filename (e.g., using the timestamp or input file names)
      const timestamp = Date.now();
      const mergedPdfFilename = `merged_${timestamp}.pdf`;
      const mergedPdfPath = path.join(__dirname, '../public', mergedPdfFilename);
      
      await fs.promises.writeFile(mergedPdfPath, mergedPdfBytes);

      console.log('PDFs merged successfully');
      
      // Return the download URL with the filename
      res.json({ downloadUrl: `/public/${mergedPdfFilename}` });
    } catch (error) {
      console.error('Error merging PDFs:', error);
      res.status(500).json({ error: 'An error occurred while merging the PDFs.' });
    }
  });
};

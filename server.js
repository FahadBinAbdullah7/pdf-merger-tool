const express = require('express');
const multer = require('multer');
const path = require('path');
const mergePdfRouter = require('./api/merge-pdfs');
const app = express();

// Serve the frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Use the merge-pdfs API route
app.use('/api', mergePdfRouter);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

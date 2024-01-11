const express = require('express');
const multer = require('multer');
const tesseract = require('node-tesseract-ocr');

const app = express();
const port = 3000;

// Use memory storage to hold the file in a buffer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// OCR Configuration
const ocrConfig = {
    lang: 'eng',
    oem: 1,
    psm: 3,
};

// Regular expressions for email and URL matching
const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|]|\bwww\.[A-Z0-9.-]+\.[A-Z]{2,})/gi;

app.post('/upload', upload.single('image'), (req, res) => {
    // req.file.buffer contains the file data in memory
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded."
        });
    }

    tesseract
        .recognize(req.file.buffer, ocrConfig)
        .then(text => {
            console.log('OCR Text:', text);

            const emails = text.match(emailRegex) || [];
            const urls = text.match(urlRegex) || [];

            res.status(200).json({
                success: true,
                message: "Text extracted successfully.",
                data: { emails, urls }
            });
        })
        .catch(error => {
            console.log(error.message);
            res.status(500).json({
                success: false,
                message: "An error occurred during text extraction.",
                error: error.message
            });
        });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

const express = require('express');
const multer = require('multer');
const tesseract = require('node-tesseract-ocr');
const tesseractConfig = {
    // Specify the absolute path to the Tesseract executable
    binary: '/usr/bin/tesseract',
    // Other configurations...
};

const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|]|\bwww\.[A-Z0-9.-]+\.[A-Z]{2,})/gi;


const app = express();
const port = 3000;

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now());
    }
});
const upload = multer({ storage: storage });

// OCR Configuration
const ocrConfig = {
    lang: 'eng',
    oem: 1,
    psm: 3,
};



app.post('/upload', upload.single('image'), (req, res) => {
    tesseract
        .recognize(req.file.path, ocrConfig)
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

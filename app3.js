const express = require('express');
const multer = require('multer');
const tesseract = require('node-tesseract-ocr');

const app = express();
const port = 3000;

// Use memory storage to hold the files in a buffer
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


app.post('/upload', upload.array('images', 10), async (req, res) => { // 'images' is the field name, 10 is the max count
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No files uploaded."
        });
    }

    try {
        const ocrPromises = req.files.map(file => tesseract.recognize(file.buffer, ocrConfig));
        const texts = await Promise.all(ocrPromises);

        // Process texts to extract emails and URLs
        const results = texts.map(text => ({
            emails: text.match(emailRegex) || [],
            urls: text.match(urlRegex) || [],
        }));

        res.status(200).json({
            success: true,
            message: "Texts extracted successfully.",
            data: results
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: "An error occurred during text extraction.",
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

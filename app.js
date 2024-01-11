require('dotenv').config();

const express = require('express');
const multer = require('multer');
const tesseract = require('node-tesseract-ocr');

const app = express();
const port = 3000;

const storage = memoryStorage();
const upload = multer({ storage: storage });

// OCR.space API endpoint
const ocrSpaceApiUrl = process.env.OCR_SPACE_API_URL;

// Your OCR.space API key
const apiKey = process.env.OCR_SPACE_API_KEY;

// Regular expressions for email and URL matching
const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|]|\bwww\.[A-Z0-9.-]+\.[A-Z]{2,})/gi;

app.post('/upload', upload.array('images', 10), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No files uploaded."
        });
    }

    try {
        const ocrPromises = req.files.map(file => {
            // Set up form data for the POST request
            let formData = new FormData();
            formData.append('apikey', apiKey);
            formData.append('language', 'eng');
            formData.append('isOverlayRequired', true);
            // Append the file buffer as a blob
            formData.append('file', new Blob([file.buffer], { type: 'image/jpeg' }), 'image.jpg');

            // Set the headers for axios
            const config = {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
                }
            };

            return post(ocrSpaceApiUrl, formData, config)
                .then(response => response.data)
                .then(data => {
                    if (data.ParsedResults && data.ParsedResults.length > 0) {
                        return data.ParsedResults[0].ParsedText;
                    }
                    throw new Error('No text found');
                });
        });

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

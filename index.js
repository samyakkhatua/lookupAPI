const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS package
require('dotenv').config(); // Load environment variables

// Initialize Express App
const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// Load Google Sheets API Credentials from .env
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix new line formatting
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

// Google Sheets API
const sheets = google.sheets({ version: 'v4', auth });

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// API Route to Get Records by Email
app.post('/get-records', async (req, res) => {
    const email = req.body.email;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Fetch data from Google Sheets
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'Sheet1!A1:Z1000', // Adjust the range according to your sheet
        });

        const rows = response.data.values;

        if (rows.length) {
            // Filter rows that contain the email
            const matchingRows = rows.filter(row => row.includes(email));

            if (matchingRows.length > 0) {
                return res.status(200).json({ records: matchingRows });
            } else {
                return res.status(404).json({ message: 'No records found for this email' });
            }
        } else {
            return res.status(404).json({ message: 'No data found in the sheet' });
        }
    } catch (error) {
        console.error('Error accessing Google Sheets:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

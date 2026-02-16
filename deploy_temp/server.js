const express = require('express');

const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));



require('dotenv').config();

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify(function (error, success) {
    if (error) {
        console.log("Email server connection error:", error);
    } else {
        console.log("Email server is ready to take our messages");
    }
});

const admin = require('firebase-admin');

// Initialize Firebase Admin
// This works automatically on Cloud Run with the default service account.
// For local development, set GOOGLE_APPLICATION_CREDENTIALS environment variable.
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

app.post('/api/signup', async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    try {
        // Use email as the document ID to ensure uniqueness
        const docRef = db.collection('signups').doc(email);
        const doc = await docRef.get();

        if (doc.exists) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Save to Firestore
        await docRef.set({
            email: email,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`New signup: ${email}`);

        const mailOptions = {
            from: '"SNAPYOURDATE" <no-reply@snapyourdate.com>',
            to: email,
            subject: 'Willkommen bei SNAPYOURDATE! 🚀',
            text: `Danke für deine Anmeldung!\n\nDu bist auf der Liste. Wir melden uns, sobald es losgeht.\n\nDein SNAPYOURDATE Team.`,
            html: `
                <div style="font-family: sans-serif; color: #111;">
                    <h1>Willkommen bei SNAPYOURDATE!</h1>
                    <p>Danke für deine Anmeldung. Du bist auf der Liste.</p>
                    <p><strong>Wir melden uns, sobald es losgeht (15. März 2026).</strong></p>
                    <br>
                    <p>Folge uns in der Zwischenzeit auf Instagram, um nichts zu verpassen.</p>
                    <p>Dein SNAPYOURDATE Team.</p>
                </div>
            `
        };

        // Send email asynchronously logic
        if (transporter) {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Confirmation email sent: %s', info.messageId);
                }
            });
        }

        res.status(201).json({ message: 'Signup successful' });

    } catch (err) {
        console.error('Firestore error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

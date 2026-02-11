const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from current directory

// Database Setup
const db = new sqlite3.Database('./signup.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS signups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            }
        });
    }
});

require('dotenv').config();

// Email Transporter (Gmail)
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log("Email server connection error:", error);
    } else {
        console.log("Email server is ready to take our messages");
    }
});

// API Routes
app.post('/api/signup', (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    const stmt = db.prepare('INSERT INTO signups (email) VALUES (?)');
    stmt.run(email, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Email already registered' });
            }
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }

        console.log(`New signup: ${email} (ID: ${this.lastID})`);

        // Send Confirmation Email
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

        if (transporter) {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    // Don't fail the request if email fails, just log it
                } else {
                    console.log('Confirmation email sent: %s', info.messageId);
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                }
            });
        }

        res.status(201).json({ message: 'Signup successful', id: this.lastID });
    });
    stmt.finalize();
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

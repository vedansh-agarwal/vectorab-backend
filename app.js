const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fileupload = require('express-fileupload');
const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');


const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '10mb'}));
app.use(express.urlencoded({ extended: true }));
app.use(fileupload());
dotenv.config();

const questions_directory = path.join(__dirname, 'Questions');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
      user: process.env.SENDER_GMAIL, 
      pass: process.env.SENDER_PASSWORD, 
    }
});

app.post('/vectorab-api/check-email', (req, res) => {
    const {email} = req.body;

    const email_regex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

    if(!email_regex.test(email)) {
        return res.status(222).json({ message: "Invalid email" });
    } else {
        db.query("SELECT email FROM students WHERE email = ?", 
        [email], 
        (err, result) => {
            if (err) {
                return res.status(299).json({ message: "Database error", error: err.message });
            } else {
                if(result.length !== 0) {
                    return res.status(222).json({ message: "Email already exists" });
                } else {
                    return res.status(200).json({ message: "Email is available" });
                }
            }
        });
    }
});

app.post('/vectorab-api/sign-up-otp-generation', async (req, res) => {
    const {email} = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        await transporter.sendMail({
            from: 'VectorAB <mail.for.vedansh@gmail.com>',
            to: email,
            subject: 'OTP Verification for VectorAB Account',
            text: `Your OTP is ${otp}`,
        });
        db.query("INSERT INTO otp (email, otp) VALUES (?, ?)",
        [email, otp],
        (err) => {
            if (err) {
                return res.status(299).json({ message: "Database error", error: err.message });
            } else {
                return res.status(200).json({ message: "OTP sent successfully"});
            }
        });
    } catch (err) {
        return res.status(289).json({ message: "Error sending email", error: err.message });
    }

});

app.post('/vectorab-api/sign-up-confirmation', (req, res) => {
    const {email, otp} = req.body;

    db.query("SELECT email FROM otp WHERE email = ? AND otp = ?",
    [email, otp],
    (err, result) => {
        if (err) {
            return res.status(299).json({ message: "Database error", error: err.message });
        } else {
            db.query("DELETE FROM otp WHERE email = ?",
            [email],
            (err1) => {
                if (err1) {
                    return res.status(299).json({ message: "Database error", error: err1.message });
                } else {
                    if(result.length !== 0) {
                        return res.status(200).json({ message: "OTP is valid" });
                    } else {
                        return res.status(222).json({ message: "Invalid OTP" });
                    }
                }
            });
        }
    });
});

app.post('/vectorab-api/check-password', (req, res) => {
    const {password} = req.body;

    const password_regex = /(?=.*\d)(?=.*[A-Z])^[^ ]+$/;

    if(password_regex.test(password)) {
        return res.status(200).json({ message: "Password is valid" });
    } else {
        return res.status(222).json({ message: "Password must contain an uppercase letter and a number" });
    }
});

app.post('/vectorab-api/sign-up', (req, res) => {
    const {email, password} = req.body;

    db.query("INSERT INTO students (email, password) VALUES (?, ?)",
    [email, password],
    (err) => {
        if (err) {
            return res.status(299).json({ message: "Database error", error: err.message });
        } else {
            return res.status(200).json({ message: "Account created successfully" });
        }
    });
});

app.post('/vectorab-api/sign-in', (req, res) => {
    const {email, password} = req.body;

    db.query("SELECT email FROM students WHERE email = ? AND password = ?",
    [email, password],
    (err, result) => {
        if (err) {
            return res.status(299).json({ message: "Database error", error: err.message });
        } else {
            if(result.length > 0) {
                return res.status(200).json({ message: "Login successful" });
            } else {
                return res.status(222).json({ message: "Invalid email or password" });
            }
        }
    });
});

app.post('/vectorab-api/forgot-password-otp-generation', async (req, res) => {
    const {email} = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        await transporter.sendMail({
            from: 'VectorAB <mail.for.vedansh@gmail.com>',
            to: email,
            subject: 'OTP Verification for VectorAB Account Password Reset',
            text: `Your OTP is ${otp}`
        });
        db.query("INSERT INTO otp (email, otp) VALUES (?, ?)",
        [email, otp],
        (err) => {
            if (err) {
                return res.status(299).json({ message: "Database error", error: err.message });
            } else {
                return res.status(200).json({ message: "OTP sent successfully"});
            }
        });
    } catch (err) {
        return res.status(289).json({ message: "Error sending email", error: err.message });
    }
});

app.post('/vectorab-api/forgot-password-confirmation', (req, res) => {
    const {email, otp} = req.body;

    db.query("SELECT email FROM otp WHERE email = ? AND otp = ?",
    [email, otp],
    (err, result) => {
        if (err) {
            return res.status(299).json({ message: "Database error", error: err.message });
        } else {
            db.query("DELETE FROM otp WHERE email = ?",
            [email],
            (err1) => {
                if (err1) {
                    return res.status(299).json({ message: "Database error", error: err1.message });
                } else {
                    if(result.length !== 0) {
                        return res.status(200).json({ message: "OTP is valid" });
                    } else {
                        return res.status(222).json({ message: "Invalid OTP" });
                    }
                }
            });
        }
    });
});

app.post('/vectorab-api/reset-password', (req, res) => {
    const {email, password} = req.body;

    db.query("UPDATE students SET password = ? WHERE email = ?",
    [password, email],
    (err) => {
        if (err) {
            return res.status(299).json({ message: "Database error", error: err.message });
        } else {
            return res.status(200).json({ message: "Password reset successful" });
        }
    });
});

app.get('/vectorab-api/get-courses', (req, res) => {
    fs.readdir(questions_directory, { withFileTypes: true }, (error, files) => {
        const course_list = files
            .filter((item) => item.isDirectory())
            .map((item) => item.name);
        return res.status(200).json({ message: "Courses fetched successfully", courses: course_list });
    });
});

app.post('/vectorab-api/get-subjects', (req, res) => {
    const {course} = req.body;
    const course_directory = path.join(questions_directory, course);
    fs.readdir(course_directory, { withFileTypes: true }, (error, files) => {
        const subject_list = files
            .filter((item) => item.name.includes(".xlsx"))
            .map((item) => {
                const subject_name = item.name.substring(0, item.name.length - 5);
                return {label: subject_name, value: subject_name};
            });
        return res.status(200).json({ message: "Subjects fetched successfully", subjects: subject_list });
    });
});

// app.post('/vectorab-api/get-questions', (req, res) => {
//     const {course, subjects, difficulty} = req.body;
//     const course_directory = path.join(questions_directory, course);
// });

app.listen(port, () => {
    db.connect((err) => {
        if (err) {
            console.log(err);
            process.exit(1);
        } else {
            console.log(`Example app listening on port ${port}`);
        }
    });
    // console.log(`Example app listening on port ${port}`);
});
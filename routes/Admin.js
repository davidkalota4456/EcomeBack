
// routes/AdminLogin.js
const express = require('express');
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');

const router = express.Router();

// Admin Login
router.post('/', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find admin by username
        const admin = await Admin.findOne({ where: { username } });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, admin.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Store admin details in session
        req.session.admin = {
            username: admin.username   
        };

        res.json({ message: 'Login successful', admin: req.session.admin });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
});



router.put('/update', async (req, res) => {
    // Check if admin is logged in and stored in session
    if (!req.session.admin || !req.session.admin.username) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }

    const { username, email, password } = req.body;

    try {
        // Get the first admin record (assuming there is only one)
        const admin = await Admin.findOne({ where: { username: req.session.admin.username } });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Update admin details
        if (username) admin.username = username;
        if (email) admin.email = email;
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            admin.password = hashedPassword;
        }

        await admin.save();

        // Update session with new username if changed
        if (username) {
            req.session.admin.username = username;
        }

        res.json({ message: 'Admin information updated successfully', admin });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
});

module.exports = router;
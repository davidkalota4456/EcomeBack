const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/Users');
const Admin = require('../models/Admin');
const Session = require('../models/Session'); // Import your Session model

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Check if the email belongs to an admin
        const admin = await Admin.findOne({ where: { email: email } });

        if (admin) {
            // Admin login successful without password
            console.log('Admin login successful');
            return res.status(200).json({ message: 'Admin login successful' });
        }

        // If not an admin, check if it's a regular user
        const user = await User.findOne({ where: { email: email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check user password
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            // Check if there are existing sessions for this user
            const existingSessions = await Session.findAll({
                where: {
                    username: user.fullName // Use the new `username` column
                }
            });

            if (existingSessions.length > 0) {
                // Delete all existing sessions
                await Session.destroy({
                    where: {
                        username: user.fullName // Use the new `username` column
                    }
                });
            }

            // Create a new session for the user
            req.session.user = { username: user.fullName };
            console.log('Session after setting:', req.session);

            await Session.create({
                sid: req.sessionID, // Set session ID
                expires: req.session.cookie.expires, // Set session expiration
                data: JSON.stringify(req.session), // Convert session data to string
                username: user.fullName // Save username
            });

            console.log('User session data:', req.session.user);
            return res.status(200).json({ message: 'User login successful', session: req.session.user });
        } else {
            return res.status(401).json({ message: 'Invalid user password' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

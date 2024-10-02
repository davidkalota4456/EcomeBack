const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/Users');
const Session = require('../models/Session'); // Import your Session model

const router = express.Router();

// Register route
router.post('/', async (req, res) => {
    const { fullName, email, password } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ where: { email: email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
        });

        // Create a new session entry
        req.session.user = { username: user.fullName };
        
        await Session.create({
            sid: req.sessionID, // Set session ID
            expires: req.session.cookie.expires, // Set session expiration
            data: JSON.stringify(req.session), // Convert session data to string
            username: user.fullName // Save username
        });


        // Return success response
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

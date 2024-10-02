// routes/Revenue.js
const express = require('express');
const Revenue = require('../models/totalRevenue');

const router = express.Router();

// Get Total Revenue
router.get('/total', async (req, res) => {
    try {
        // Calculate the total revenue
        const totalRevenue = await Revenue.sum('amount');

        res.json({ totalRevenue: totalRevenue || 0 });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
});

module.exports = router;

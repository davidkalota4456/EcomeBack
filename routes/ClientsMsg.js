// routes/messages.js
const express = require('express');
const router = express.Router();
const ClientsMsg = require('../models/ClientsMsg');

// POST /messages - Create a new client message


// POST route to handle incoming messages
router.post('/', async (req, res) => {
    const { fullName, email, message } = req.body;

    console.log('Request body:', req.body);

    try {
        const newMessage = await ClientsMsg.create({
            name: fullName,
            email,
            message
        });

        console.log('Received the message:', newMessage);
        res.status(201).json({ message: 'Message received and saved successfully', data: newMessage });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Failed to save message', error: error.message });
    }
});


// GET /messages - Retrieve all client messages (admin use)
router.get('/', async (req, res) => {
    try {
        const messages = await ClientsMsg.findAll();
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error });
    }
});

// DELETE /messages/:id - Delete a specific message by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const message = await ClientsMsg.findByPk(id);
        if (message) {
            await message.destroy();
            res.status(200).json({ message: 'Message deleted successfully' });
        } else {
            res.status(404).json({ message: 'Message not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting message', error });
    }
});

module.exports = router;

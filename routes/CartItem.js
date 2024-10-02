// routes/cartItems.js
const express = require('express');
const router = express.Router();
const CartItem = require('../models/CartItem');

// Add a new item to the cart
router.post('/', async (req, res) => {
    try {
        const { cartId, productId, quantity, price } = req.body;

        // Create a new CartItem
        const newItem = await CartItem.create({
            cartId,
            productId,
            quantity,
            price,
        });

        res.status(201).json(newItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all items in a specific cart
router.get('/:cartId', async (req, res) => {
    try {
        const cartItems = await CartItem.findAll({
            where: { cartId: req.params.cartId },
        });

        res.status(200).json(cartItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a specific CartItem (e.g., update quantity)
router.put('/update/:id', async (req, res) => {
    try {
        const { quantity, price } = req.body;
        const cartItem = await CartItem.findByPk(req.params.id);

        if (cartItem) {
            cartItem.quantity = quantity !== undefined ? quantity : cartItem.quantity;
            cartItem.price = price !== undefined ? price : cartItem.price;

            await cartItem.save();
            res.status(200).json(cartItem);
        } else {
            res.status(404).json({ message: 'CartItem not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Delete a CartItem from the cart
router.delete('/delete/:id', async (req, res) => {
    try {
        const cartItem = await CartItem.findByPk(req.params.id);

        if (cartItem) {
            await cartItem.destroy();
            res.status(200).json({ message: 'CartItem deleted' });
        } else {
            res.status(404).json({ message: 'CartItem not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

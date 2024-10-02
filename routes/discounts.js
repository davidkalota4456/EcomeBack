const express = require('express');
const Discounts = require('../models/discounts');
const Products = require('../models/products');
const moment = require('moment'); // For time calculations
const router = express.Router();
const { Op } = require('sequelize');


router.get('/Ids', async (req, res) => {
    try {
        console.log('Fetching discount IDs');  // Debugging log
        // Fetching only IDs from the database
        const discounts = await Discounts.findAll({
            attributes: ['id'] // Only fetch the 'id' field
        });
        
        // Extracting IDs from the discounts
        const discountIds = discounts.map(discount => discount.id);

        res.json(discountIds);
    } catch (error) {
        console.error('Error fetching existing discounts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.post('/updateToNormalPrice', async (req, res) => {
    const { productName } = req.body;

    try {
        // Find the discount for the given product
        const discount = await Discounts.findOne({ where: { productName } });

        if (!discount) {
            return res.status(404).json({ error: 'Discount not found for the product' });
        }

        // Retrieve the original price from the discount record
        const originalPrice = discount.originalPrice;

        // Find the product and update its price
        const product = await Products.findOne({ where: { name: productName } });

        if (product) {
            await product.update({ price: originalPrice });

            // Destroy the discount record as it is no longer needed
            await discount.destroy();

            res.status(200).json({ message: 'Product price updated and discount removed successfully' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error updating product price:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



router.post('/sumerDiscount', async (req, res) => {
        const { percentageOffDiscount, familyType, value } = req.body;
    
    try {
        // Create a new discount entry in the Discounts table
        const discount = await Discounts.create({
            productName: null,
            percentageOffDiscount: percentageOffDiscount,
            productFamily: familyType,
            minimumSunOrders: value, // Minimum cart sum to trigger the discount
        });

       

        res.status(201).json({ message: 'Discount created successfully', discount });
    } catch (error) {
        console.error('Error creating discount:', error);
        res.status(500).json({ message: 'Error creating discount', error });
    }
});




router.post('/CounterDiscount', async (req, res) => {
    const { minimumOrderAmount, percentageOffDiscount, productFamily } = req.body;
    try {
        const newPrice = 0;
        const discount = await Discounts.create({
            minimumOrderAmount,
            percentageOffDiscount,
            productFamily,
            newPrice: newPrice,
            
        });

        res.status(201).json({ message: 'Discount created successfully', discount });
    } catch (error) {
        console.error('Error creating discount:', error);
        res.status(500).json({ message: 'Error creating discount', error });
    }
});




const updateProduct = async (productName, { price, description }) => {
    const product = await Products.findOne({ where: { name: productName } });

    if (!product) {
        throw new Error('Product not found');
    }

    if (price !== undefined) {
        product.price = price;
    }
    if (description !== undefined) {
        product.description = description;
    }

    await product.save();
    return product;
};

// Create a new discount
router.post('/', async (req, res) => {
    const { productName, newPrice } = req.body;

    try {
        const discount = await Discounts.create({
            productName,
            newPrice,
        });
        const product = await Products.findOne({ where: { name: productName } });
        if(product){
            product.price = newPrice;
        }

        res.status(201).json({ message: 'Discount created successfully', discount });
    } catch (error) {
        res.status(500).json({ message: 'Error creating discount', error });
    }
});


// Endpoint to apply a discount to all products
router.post('/all', async (req, res) => {
    const { percentageOffDiscount } = req.body;

    try {
        // Create a global discount entry
        const discount = await Discounts.create({
            productName: null, // Set to null to indicate discount for all products
            percentageOffDiscount,
        });

        // Get all products
        const products = await Products.findAll();

        // Apply the discount to each product
        for (const product of products) {
            const originalPrice = product.price;
            const discountAmount = (originalPrice * percentageOffDiscount) / 100;
            const newPrice = originalPrice - discountAmount;

            await product.update({
                price: newPrice
            });
        }

        res.status(201).json({ message: 'Discount applied to all products successfully', discount });
    } catch (error) {
        console.error('Error creating discount:', error);
        res.status(500).json({ message: 'Error creating discount', error });
    }
});

module.exports = router;






router.post('/time', async (req, res) => {
    const { productName, newPrice, startDate, endDate } = req.body;
    const today = new Date();
    
    // Convert startDate and endDate from string to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date logic
    if (today < start) {
        return res.status(400).json({ message: 'Discount cannot start in the past.' });
    }
    if (start >= end) {
        return res.status(400).json({ message: 'Start date must be before end date.' });
    }

    try {
        // Get the current price of the product
        const product = await Products.findOne({ where: { name: productName } });
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Create the discount with the original price
        const discount = await Discounts.create({
            productName,
            newPrice,
            originalPrice: product.price,  // Store the original price
            startDate,
            endDate

        });

        // Update the product price
        await updateProduct(productName, { price: newPrice });

        

        res.status(201).json({ message: 'Discount created successfully', discount });
    } catch (error) {
        res.status(500).json({ message: 'Error creating discount', error });
    }
});




router.delete('/delete/:productName', async (req, res) => {
    const { productName } = req.params;

    try {
        const result = await Discounts.destroy({ where: { productName } });

        if (result === 0) {
            return res.status(404).json({ message: 'Discount not found' });
        }

        res.json({ message: 'Discount deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting discount', error });
    }
});

// Delete discounts that have expired
router.delete('/delete/expired', async (req, res) => {
    try {
        const currentDate = new Date();
        const result = await Discounts.destroy({
            where: {
                endDate: {
                    [Op.lt]: currentDate
                }
            }
        });

        res.json({ message: 'Expired discounts deleted successfully', deletedCount: result });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting expired discounts', error });
    }
});
router.get('/timer', async (req, res) => {
    try {
        
        const discounts = await Discounts.findAll({
            where: {
                startDate: {
                    [Op.not]: null
                },
                endDate: {
                    [Op.not]: null
                }
            }
        });

        if (!discounts || discounts.length === 0) {
            return res.json([]);
        }

        const now = new Date();
        const discountDetails = discounts.map(discount => {
            const endDiscount = new Date(discount.endDate);
            const timeRemaining = Math.max(0, endDiscount - now);

            return {
                productName: discount.productName,
                newPrice: discount.newPrice,
                startDiscount: discount.startDate,
                endDiscount: discount.endDate,
                timeRemaining
            };
        });

        
        res.json(discountDetails);
    } catch (error) {
        console.error('Error retrieving discounts:', error);
        res.status(500).json({ message: 'Error retrieving discounts', error: error.message });
    }
});




// Get all discounts
router.get('/', async (req, res) => {
    try {
        const discounts = await Discounts.findAll();
        res.json(discounts);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving discounts', error });
    }
});

router.get('/typeOffDiscount', async (req, res) => {
    try {
        const sumerDiscounts = await Discounts.findOne({ where: { minimumSunOrders } });
        const counterDiscount = await Discounts.findOne({ where: { minimumOrderAmount } });

        if (sumerDiscounts !== null && counterDiscount === null) {
            res.json({ message: 'Cart needs to pass', discount: sumerDiscounts });
        } else if (counterDiscount !== null && sumerDiscounts === null) {
            res.json({ message: 'The counter is', discount: counterDiscount });
        } else if (sumerDiscounts !== null && counterDiscount !== null) {
            res.json({
                message: 'Both discounts are available',
                sumerDiscounts,
                counterDiscount,
            });
        } else {
            res.json({ message: 'No discounts available' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving discounts', error });
    }
});


// Get a discount by product name
router.get('/:productName', async (req, res) => {
    const { productName } = req.params;

    try {
        const discount = await Discounts.findOne({ where: { productName } });

        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }

        res.json(discount);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving discount', error });
    }
});

// Update a discount
router.put('/update/:productName', async (req, res) => {
    const { productName } = req.params;
    const { newPrice, minimumSunOrders, minimumOrderAmount, startDate, endDate, usageLimit, earnPerLose } = req.body;

    try {
        const discount = await Discounts.findOne({ where: { productName } });

        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }

        discount.newPrice = newPrice || discount.newPrice;
        discount.minimumSunOrders = minimumSunOrders || discount.minimumSunOrders;
        discount.minimumOrderAmount = minimumOrderAmount || discount.minimumOrderAmount;
        discount.startDate = startDate || discount.startDate;
        discount.endDate = endDate || discount.endDate;
        discount.usageLimit = usageLimit || discount.usageLimit;
        discount.earnPerLose = earnPerLose || discount.earnPerLose;

        await discount.save();

        res.json({ message: 'Discount updated successfully', discount });
    } catch (error) {
        res.status(500).json({ message: 'Error updating discount', error });
    }
});

// Apply a discount to an order
router.post('/orderDiscount', async (req, res) => {
    const { productName, orderAmount, quantity } = req.body;

    try {
        const discount = await Discounts.findOne({ where: { productName } });

        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }

        const currentDate = new Date();
        if (discount.startDate && discount.startDate > currentDate) {
            return res.status(400).json({ message: 'Discount not yet started' });
        }
        if (discount.endDate && discount.endDate < currentDate) {
            return res.status(400).json({ message: 'Discount has expired' });
        }

        if (discount.minimumOrderAmount && orderAmount < discount.minimumOrderAmount) {
            return res.status(400).json({ message: 'Order amount is less than minimum required for discount' });
        }

        let discountAmount = 0;
        if (quantity >= discount.minimumSunOrders) {
            discountAmount = discount.newPrice * quantity;
        } else {
            return res.status(400).json({ message: 'Not enough items to apply discount' });
        }

        // Update discount usage count
        discount.usedCount += 1;
        if (discount.usageLimit && discount.usedCount > discount.usageLimit) {
            discount.status = 'inactive';
        }
        await discount.save();

        res.json({ message: 'Discount applied successfully', discountAmount });
    } catch (error) {
        res.status(500).json({ message: 'Error applying discount', error });
    }
});

router.delete('/oneDelete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Find the discount by ID
        const discount = await Discounts.findByPk(id);

        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }

        // Delete the discount
        await discount.destroy();

        res.status(200).json({ message: 'Discount deleted successfully' });
    } catch (error) {
        console.error('Error deleting discount:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



module.exports = router;

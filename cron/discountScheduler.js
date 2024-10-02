const cron = require('node-cron');
const { Op } = require('sequelize');
const Discounts = require('../models/discounts');
const Products = require('../models/products');

// Function to update product price
const updateProduct = async (productName, updatedFields) => {
    try {
        const product = await Products.findOne({ where: { name: productName } });
        if (product) {
            await product.update(updatedFields);
        }
    } catch (error) {
        console.error('Error updating product:', error);
    }
};

// Function to process expired discounts
const processExpiredDiscounts = async () => {
    try {
        const today = new Date();
        const expiredDiscounts = await Discounts.findAll({
            where: {
                endDate: {
                    [Op.lt]: today
                }
            }
        });

        for (const discount of expiredDiscounts) {
            await updateProduct(discount.productName, { price: discount.originalPrice });
            await discount.destroy();
        }
    } catch (error) {
        console.error('Error processing expired discounts:', error);
    }
};

// Schedule the cron job to run every night at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running cron job to process expired discounts');
    await processExpiredDiscounts();
});

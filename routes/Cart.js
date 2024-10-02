// routes/Cart.js
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Session = require('../models/Session');
const Discounts = require('../models/discounts');
const CartItem = require('../models/CartItem');
const { Op } = require('sequelize');
const Products = require('../models/products');


const CheckIfThisProductGotAdiscountTimer = async (productName) => {
    try {
        const productWithTimerDiscount = await Discounts.findOne({
            where: {
                [Op.and]: [
                    { productName: productName },
                    { endDate: { [Op.gt]: new Date() } } // Check if the discount is still active
                ]
            }
        });

        return productWithTimerDiscount ? productWithTimerDiscount : null;
    } catch (error) {
        console.error('Error checking discount timer:', error);
        throw error; // Throw the error to be handled in the main function
    }
};
// Example: Authentication middleware

const isAuthenticated = (req, res, next) => {
    console.log('Session Info:', req.session);
    if (!req.session || !req.session.user) {
        console.error('Session is not defined or user is missing');  
        return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
};

const checkIfGotCounterDiscount = async (itemCount, Counter) => {
    try {
        const counter = itemCount - Counter
        const discountBaseOnCounter = await Discounts.findOne({
            where: {
                minimumOrderAmount: { [Op.lte]: counter }
            }
        });

        if (discountBaseOnCounter) {
            // If a discount is found, return an object with both values
            return {
                percentageOffDiscount: discountBaseOnCounter.percentageOffDiscount
            };
        }
        
        // Return null if no discount is found
        return null; 
    } catch (error) {
        console.error('Error checking for counter discount:', error);
        return null; // Return null in case of an error as well
    }
};

const checkIfGotSumDiscount = async (cartSum, Summer) => {
    try {
        const CartSum = cartSum - Summer
        const discountBaseOnSumOffPrice = await Discounts.findOne({
            where: {
                minimumSunOrders: { [Op.lte]: CartSum }
            }
        });

        if (discountBaseOnSumOffPrice) {
            // Return both minimumSunOrders and sumOfDiscount if found
            return {
                sumOfDiscount: discountBaseOnSumOffPrice.percentageOffDiscount
            };
        }

        // Return null if no discount is found
        return null;
    } catch (error) {
        console.error('Error checking for sum discount:', error);
        return null;
    }
};




router.post('/', isAuthenticated, async (req, res) => {
    try {
        let Summer = 0;  // Track sum-based discount calculation
        let Counter = 0;  // Track count-based discount calculation
        let discountPrice = null;  // This will store the discounted price if any

        const sessionId = req.sessionID;
        const { productName, TotalPrice } = req.body;
        let finalPrice = parseFloat(TotalPrice); // Original price without discounts

        // Retrieve the session and cart data
        let session = await Session.findOne({ where: { sid: sessionId } });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
    
        const cart = JSON.parse(session.cart || '[]');
    
        // Check if the product has a discount timer
        const discount = await CheckIfThisProductGotAdiscountTimer(productName);
    
        // Apply discount if applicable (Timer-based discount)
        if (discount) {
            finalPrice = discount.newPrice;
            Counter += 1;
            Summer += finalPrice;
        };

        // Check for counter-based discount
        let itemCount = session.itemCount || 0;
        const flagForCount = await checkIfGotCounterDiscount(itemCount, Counter);
        if (flagForCount) {
            finalPrice = finalPrice * (1 - flagForCount.percentageOffDiscount);
            discountPrice = finalPrice;  // Update discount price to be returned
        };

        // Check for sum-based discount
        let cartSum = session.cartSum || 0;
        const flagForSum = await checkIfGotSumDiscount(cartSum, Summer);
        if (flagForSum) {
            finalPrice = finalPrice * (1 - flagForSum.sumOfDiscount);
            discountPrice = finalPrice;  // Update discount price to be returned
        }

        // Add the product to the cart
        const cartItem = { productName };
        cart.push(cartItem);

        // Update session cart and cart sum
        session.cart = JSON.stringify(cart);
        session.itemCount = (session.itemCount || 0) + 1;
        session.cartSum = (session.cartSum || 0) + finalPrice;
        await session.save();
    
        // Construct the response payload
        const responsePayload = {
            message: 'Cart item added successfully',
            cart,
            totalSumPrice: session.cartSum,
            noDiscountPrice: TotalPrice,
            DiscountPrice: discountPrice || null  // Return null if no discount applied
        };
    
        // Send the response back to the client
        res.status(201).json(responsePayload);
    
    } catch (err) {
        console.error('Error adding cart item:', err);
        res.status(500).json({ error: 'Failed to add cart item' });
    }
});

















router.get('/getCart', async (req, res) => {
    try {
      const sessionId = req.sessionID;
      // Ensure the user is logged in and the session is valid
      if (!req.session || !req.session.user || !req.session.user.username) {
        return res.status(401).json({ error: 'User not logged in' });
      }
      // Retrieve the session from the database
      const session = await Session.findOne({ where: { sid: sessionId } });
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      // Retrieve cart and total price from the session
      const cart = JSON.parse(session.cart || '[]');
      const totalSumOfCart = session.cartSum || 0;
      // Extract product names from the cart
      const productNames = cart.map(item => item.productName);
      // Fetch product details (including prices) from the database
      const products = await Products.findAll({
        where: {
          name: productNames
        }
      });
      // Create a map of product names to prices for quick lookup
      const productPrices = {};
      products.forEach(product => {
        productPrices[product.name] = product.price;
      });
      // Add price information to the cart items
      const cartWithPrices = cart.map(item => ({
        ...item,
        price: productPrices[item.productName] || 0
      }));
      return res.status(200).json({ cart: cartWithPrices, totalSumOfCart });
    } catch (err) {
      console.error('Error fetching cart:', err);
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  });


  router.delete('/deleteFromCart/:productName', async (req, res) => {
    try {
      // Ensure the user is logged in and the session is valid
      if (!req.session || !req.session.user || !req.session.user.username) {
        return res.status(401).json({ error: 'User not logged in' });
      }
  
      const username = req.session.user.username;
      const sessionId = req.sessionID;
      const productName = req.params.productName;
  
      // Retrieve the session from the database
      const session = await Session.findOne({ where: { sid: sessionId } });
  
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
  
      // Retrieve the cart data from the session
      let cart = JSON.parse(session.cart || '[]');
  
      // Find the product in the cart
      const productIndex = cart.findIndex(item => item.productName === productName);
      if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found in the cart' });
      }
  
      // Remove the product from the cart
      cart.splice(productIndex, 1);
      const productFind = await Products.findOne({ where: { name: productName }});
      const price = productFind.price

  
      // Update the session with the new cart data
      session.cart = JSON.stringify(cart);
      session.itemCount = session.itemCount - 1; // Update item count
      session.cartSum = session.cartSum - price // Update total price
      await session.save();
      // Return success response
      res.status(200).json({ message: session.cartSum });
  
    } catch (err) {
      console.error('Error deleting product from cart:', err);
      res.status(500).json({ error: 'Failed to delete product from cart' });
    }
  });

  router.get('/TotalPrice', async (req, res) => {
    try {
      // Check if the user is logged in
      if (!req.session || !req.session.user || !req.session.user.username) {
        return res.status(401).json({ error: 'User not logged in' });
      }
  
      // Get the username and session ID
      const username = req.session.user.username;
      const sessionId = req.sessionID;
  
      // Fetch the session from the database
      const session = await Session.findOne({ where: { sid: sessionId } });
  
      // Check if the session exists
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
  
      // Retrieve the cart price from the session
      const cartPrice = session.cartSum || 0; // Default to 0 if cartSum is undefined
  
      // Respond with the cart price
      res.status(200).json({ totalSumOfCart: cartPrice });
    } catch (error) {
      // Handle unexpected errors
      console.error('Error fetching total price:', error);
      res.status(500).json({ error: 'Failed to fetch total price' });
    }
  });





router.post('/checkout', async (req, res) => {
    try {
        // Ensure the user is logged in and the session is valid
        if (!req.session || !req.session.user || !req.session.user.username) {
            return res.status(401).json({ error: 'User not logged in' });
        }

        const username = req.session.user.username;
        const sessionId = req.sessionID;

        // Retrieve the session from the database
        const session = await Session.findOne({ where: { sid: sessionId } });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Retrieve the cart data from the session
        const cart = JSON.parse(session.cart || '[]');

        const totalQuantity = session.itemCount;
        const totalSum = session.cartSum;

        // Check if the cart is empty
        if (cart.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Create a new cart entry in the Cart model
        const newCart = await Cart.create({
            userName: username,
            productQuantity: totalQuantity,
            cartSum: totalSum,
        });

        // Count product quantities
        const productCounts = cart.reduce((acc, item) => {
            if (item && typeof item === 'object' && item.productName) {
                const productName = item.productName.toString();
                acc[productName] = (acc[productName] || 0) + 1;
            } else {
                console.error(`Invalid cart item: ${JSON.stringify(item)}`);
            }
            return acc;
        }, {});

        console.log('Product counts:', productCounts);

        // Create cart items based on product counts
        for (const productName in productCounts) {
            const quantity = productCounts[productName];

            // Ensure productName is a string
            const productNameStr = productName.toString();

            // Fetch the actual product price from the Products table based on the productName
            const product = await Products.findOne({ where: { name: productNameStr } });

            if (!product) {
                console.error(`Product not found: ${productNameStr}`);
                continue;
            }

            // Calculate the total price based on the quantity and unit price
            const totalProductPrice = product.price * quantity;

            // Create the CartItem with the correct product price and quantity
            await CartItem.create({
                cartId: newCart.id,  // Associate with the Cart ID
                productName: productNameStr,
                productQuantity: quantity,  // Use the counted quantity
                productPrice: totalProductPrice,  // Total price for the quantity
            });
        }

        // Optionally clear the cart in the session after checkout
        session.cart = JSON.stringify([]);
        session.itemCount = 0;
        session.cartSum = 0;
        await session.save();
        

        // Return success response
        res.status(201).json({ message: 'Cart submitted successfully', cartId: newCart.id });

    } catch (err) {
        console.error('Error submitting cart:', err);
        res.status(500).json({ error: 'Failed to submit cart' });
    }
});






// Get all cart items
router.get('/', async (req, res) => {
    try {
        const cartItems = await Cart.findAll();
        res.status(200).json(cartItems);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve cart items' });
    }
});

// Get cart items by userId
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const cartItems = await Cart.findAll({ where: { userId } });
        res.status(200).json(cartItems);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve cart items for user' });
    }
});

// Update cart item (e.g., change quantity or status)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, status } = req.body;
        const updatedCartItem = await Cart.update(
            { quantity, status },
            { where: { id } }
        );
        res.status(200).json({ message: 'Cart item updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update cart item' });
    }
});

// Delete cart item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Cart.destroy({ where: { id } });
        res.status(200).json({ message: 'Cart item deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete cart item' });
    }
});

module.exports = router;

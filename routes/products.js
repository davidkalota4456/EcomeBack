const express = require('express');
const router = express.Router();
const Products = require('../models/products');
const IMAGES_BASE_URL = '/images/';
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Discounts = require('../models/discounts');
const { Op } = require('sequelize');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { config } = require('dotenv');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');


config();

// Create an S3 client instance
const s3 = new S3Client({
    region: "eu-north-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Retrieve image file name based on product name
const retrieveTheKeyBasedOnTheName = async (productName) => {
    switch (productName) {
        case 'AquaPulse 2.0':
            return 'aq1.jpg';
        case 'FitMax Pro':
            return 'img4.jpg';
        case 'Garmin Forerunner 945':
            return 'image1.jpg';
        case 'RunTime X':
            return 'rntimex.jpg';
        case 'Rolex Submariner':
            return 'rolex1.jpg';
        case 'Audemars Piguet Royal Oak':
            return 'ap1.jpg';    
        case 'Rado Captain Cook':
            return 'rado1.jpg';
        case 'Omega Speedmaster':
            return 'omega1.jpg';    
        default:
            return null; // Handle unknown product names
    }
};

// Generate a pre-signed URL for accessing S3 images
const getPresignedUrl = async (key) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
    });

    try {
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        return url;
    } catch (error) {
        console.error('Error generating pre-signed URL:', error);
        return null;
    }
};

// Get S3 image URLs using pre-signed URLs
const getS3ImageUrls = async (productName) => {
    const imageFileName = await retrieveTheKeyBasedOnTheName(productName);
    if (!imageFileName) {
        console.error("No image file name found for the product.");
        return null; // Return null if no image is found
    }

    const fullImageKey = `${productName}/${imageFileName}`;
    return await getPresignedUrl(fullImageKey);
};

// Route to fetch products and their corresponding images
router.get('/sectionOne', async (req, res) => {
    try {
        const flag = req.query.flag;

        // Fetch products that match the flag
        const products = await Products.findAll({
            where: {
                family: flag // Assuming 'family' is the column that matches with 'flag'
            }
        });

        // Map over products to attach S3 image URLs
        const productsWithDetails = await Promise.all(products.map(async product => {
            const productName = product.name;

            // Get S3 pre-signed image URL
            const imageUrl = await getS3ImageUrls(productName);

            return {
                ...product.toJSON(),
                s3Image: imageUrl // This will contain a single pre-signed image URL
            };
        }));

        res.status(200).json(productsWithDetails);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products', error });
    }
});



router.get('/', async (req, res) => {
    try {
        const products = await Products.findAll({
            attributes: ['id', 'name'] // Include 'id' along with 'name'
        });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to retrieve products' });
    }
});



router.get('/family-options', async (req, res) => {
    try {
        // Fetch products with the family attribute
        const products = await Products.findAll({
            attributes: ['family'],
        });

        // Create a Set to store unique family names
        const uniqueFamilies = new Set(products.map(product => product.family));

        // Convert the Set back to an array of objects
        const familyOptions = Array.from(uniqueFamilies).map(family => ({ family }));

        console.log(familyOptions);

        // Send the unique family options as a JSON response
        res.status(200).json(familyOptions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product names', error });
    }
});




router.get('/names', async (req, res) => {
    try {
        const products = await Products.findAll({
            attributes: ['name'], 
        });

        // Extract the names from the result
        const names = products.map(product => product.name);

        res.status(200).json(names);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product names', error });
    }
});


// Handle POST request for adding a product
router.post('/', async (req, res) => {
    try {
        const { productName, productPrice, productDescription, family, quantity } = req.body;

        // Create a new product entry in your database
        const newProduct = await Products.create({
            name: productName,
            price: productPrice,
            description: productDescription,
            family: family,
            quantity: quantity,
        });

        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ message: 'Error creating product', error });
    }
});



router.put('/:id', async (req, res) => {
    const productId = req.params.id;
    const { name, description, price } = req.body;

    try {
        // Find the product by ID
        const product = await Products.findByPk(productId);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Update the product fields if they are provided
        if (name) product.name = name;
        if (description) product.description = description;
        if (price) product.price = price;

        // Save the updated product
        await product.save();

        res.json({ message: 'Product updated successfully', product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});





const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderName = req.params.FolderName;
        const uploadPath = path.join(__dirname, '../public/images', folderName);

        // Check if folder exists; if not, create it
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, req.params.PictureFile); // Use the provided file name
    }
});

const upload = multer({ storage: storage });

// Route to handle image upload
router.post('/images/:FolderName/:PictureFile', upload.single('file'), (req, res) => {
    try {
        res.status(200).json({ message: 'Image uploaded successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading image', error });
    }
});


const deleteFolderRecursive = (folderPath) => {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            
            const currentPath = path.join(folderPath, file);
            if (fs.lstatSync(currentPath).isDirectory()) {
                deleteFolderRecursive(currentPath); // Recursive call
            } else {
                fs.unlinkSync(currentPath); // Delete file
            }
        });
        fs.rmdirSync(folderPath); // Remove empty folder
    }
};

// Delete product by name and its associated images
router.delete('/:name', async (req, res) => {
    try {
        const productName = req.params.name;

        // Find the product by name
        const product = await Products.findOne({ where: { name: productName } });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // Delete the product from the database
        await product.destroy();

        res.status(200).json({ message: 'Product and associated images deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product and images', error });
    }
});



module.exports = router;
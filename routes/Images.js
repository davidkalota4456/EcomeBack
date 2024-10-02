
const express = require('express');
const router = express.Router();
const { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const fileUpload = require('express-fileupload');
const { Upload } = require('@aws-sdk/lib-storage');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Enable file upload middleware
router.use(fileUpload());

// Upload route
router.post('/', async (req, res) => {
    try {
        const { productName } = req.body;
        const file = req.files.image; // Access the uploaded file

        // Check if productName and file are provided
        if (!productName || !file) {
            return res.status(400).json({ message: 'Product name or image data is missing' });
        }

        // Check if the image file is empty
        if (file.size === 0) {
            return res.status(400).json({ message: 'Image file is empty' });
        }

        const bucketName = process.env.AWS_S3_BUCKET; // Use the bucket name from .env

        // Step 1: Check if the folder exists by listing objects with the product name as a prefix
        const folderKey = `${productName}/`;
        const listParams = {
            Bucket: bucketName,
            Prefix: folderKey,
        };

        const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));

        // Step 2: Check if there are any objects in the folder
        if (listedObjects.Contents && listedObjects.Contents.length > 0) {
            return res.status(409).json({ message: 'You already have a picture for this product.' });
        }

        // Step 3: Create the folder by uploading an empty object (just to create the folder)
        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: folderKey, // Key for the folder
            Body: '', // Empty body to create the "folder"
        }));

        // Step 4: Upload the image to the specified folder
        const uploadParams = {
            Bucket: bucketName,
            Key: `${folderKey}${file.name}`, // Full path for the image
            Body: file.data, // Image data
            ContentType: file.mimetype, // Set the correct content type
        };

        const upload = new Upload({
            client: s3Client,
            params: uploadParams,
            queueSize: 4, // Optional: Adjust based on your needs
            leavePartsOnError: false, // Optional: Change if needed
        });

        // Handle upload completion
        await upload.done(); // Wait for the upload to finish
        res.status(201).json({ message: 'Image uploaded successfully' });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:productName', async (req, res) => {
    const { productName } = req.params;
    const bucketName = process.env.AWS_S3_BUCKET;

    try {
        // List objects in the folder
        const listParams = {
            Bucket: bucketName,
            Prefix: `${productName}/`, // Specify the folder to list
        };

        const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));

        // If the folder is empty or does not exist
        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            return res.status(404).json({ message: 'Folder not found or is already empty' });
        }

        // Delete the objects
        const deleteParams = {
            Bucket: bucketName,
            Delete: {
                Objects: listedObjects.Contents.map(item => ({ Key: item.Key })),
            },
        };

        await s3Client.send(new DeleteObjectsCommand(deleteParams));

        res.status(200).json({ message: 'Folder and all images deleted successfully' });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

router.get('/:productName', async (req, res) => {
    const { productName } = req.params;
    const bucketName = process.env.AWS_S3_BUCKET;

    try {
        const listParams = {
            Bucket: bucketName,
            Prefix: `${productName}/`,
        };

        const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            return res.status(404).json({ message: 'No images found in this folder' });
        }

        const imageUrls = listedObjects.Contents.map(item => {
            return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`;
        });

        res.status(200).json({ images: imageUrls });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;


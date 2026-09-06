const express = require("express");
const router = express.Router();
// Search suggestions endpoint
router.get('/suggest', async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const listings = await Listing.find({
        $or: [
            { title: { $regex: q, $options: 'i' } },
            { location: { $regex: q, $options: 'i' } }
        ]
    }).limit(7);
    // Return unique suggestions (title + location)
    const suggestions = Array.from(new Set(listings.map(l => l.title).concat(listings.map(l => l.location)))).filter(s => s.toLowerCase().includes(q.toLowerCase())).slice(0, 7);
    res.json(suggestions);
});
const Listing = require('../models/listing.js');
const wrapAsync = require('../utils/wrapAsync.js');
const ExpressError = require("../utils/expressError.js"); 
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

router
    .route("/")
    .get(
        wrapAsync(
            listingController.index
        ))
    .post(
    isLoggedIn, 
    upload.single('listing[image]'),
    validateListing, 
    wrapAsync(
        listingController.createListing
    ));
  
//New Route
router.get("/new",
    isLoggedIn, 
    listingController.renderNewForm
);

router
    .route("/:id")
    .get(
        listingController.showListing
      ) 
    .put(
    isLoggedIn,
    isOwner,
    upload.single('listing[image]'),
    validateListing, 
    wrapAsync(
        listingController.updateListing
    ))
    .delete(
    isLoggedIn, 
    isOwner, 
    wrapAsync(
        listingController.destoryListing
    ));
    
//Edit Route
router.get("/:id/edit",
    isLoggedIn,
    isOwner, 
    wrapAsync(
        listingController.renderEditForm
    ));

// Image Route - Serve image from MongoDB
router.get("/:id/image", async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing || !listing.image || !listing.image.data) {
            return res.status(404).send("Image not found");
        }
        res.contentType(listing.image.contentType);
        res.send(listing.image.data);
    } catch (err) {
        res.status(500).send("Error retrieving image");
    }
});

module.exports = router; 
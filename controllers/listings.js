
const Listing = require("../models/listing");

 const ExpressError = require("../utils/expressError.js"); 

module.exports.index = async (req, res) => {
    const { q } = req.query;
    let query = {};
    if (q) {
        query.$or = [
            { title: { $regex: q, $options: 'i' } },
            { location: { $regex: q, $options: 'i' } }
        ];
    }
    const allListings = await Listing.find(query);
    res.render("listings/index.ejs", { allListings, q });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res, next) => {
   
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id)
            .populate({
                path: 'reviews',
                populate: {
                    path: 'author'
                }
            })
            .populate('owner');
        if (!listing) {
            req.flash("error", "Listing you requested does not exist!");
            return res.redirect("/listings");
        }
        res.render("listings/show.ejs", { listing });
    } catch (err) {
        next(err);
    }
};


module.exports.createListing = async (req, res, next) => {
    try {
        
        console.log("---------- DEBUGGING createListing ----------");
        console.log("req.body:", req.body);
        console.log("req.body.listing:", req.body.listing);
        console.log("req.user:", req.user);
        console.log("-------------------------------------------");

        if (!req.file) {
            console.warn("No file uploaded or Multer failed to process the file.");
            req.flash("error", "Please upload an image for the listing.");
            
            return res.redirect("/listings/new"); 
                }

        const newListing = new Listing(req.body.listing);

        if (req.user) {
            newListing.owner = req.user._id;
            newListing.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                filename: req.file.originalname
            };
            console.log("Assigned owner:", newListing.owner);
            console.log("Assigned image:", newListing.image.filename);
        } else {
            
            console.log("Warning: No user logged in for new listing. Redirecting to login.");
            req.flash("error", "You must be logged in to create a listing.");
            return res.redirect("/login");
        }

        const savedListing = await newListing.save();
        console.log("Saved Listing Object:", savedListing);

        req.flash("success", "New Listing Created!");
        res.redirect(`/listings/${savedListing._id}`);

    } catch (e) {
        
        console.error("Error saving new listing:", e);
        console.error("Error Name:", e.name); 
        console.error("Error Message:", e.message);
        console.error("Error Stack:", e.stack);

        let errorMessage = "Something went wrong while creating your listing.";
        if (e.name === 'ValidationError') {
            
            errorMessage = `Validation failed: ${e.message}`;
        } else if (e.name === 'MongoServerError' && e.code === 11000) {
            
            errorMessage = "A listing with this unique property already exists.";
        }
        
        req.flash("error", errorMessage);
        res.redirect("/listings/new"); 
    }
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist !");
        return res.redirect("/listings"); 
    }

    res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if(typeof req.file !== "undefined"){
        listing.image = {
            data: req.file.buffer,
            contentType: req.file.mimetype,
            filename: req.file.originalname
        };
        await listing.save();
    }

    req.flash("success", "Listing Updated Successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.destoryListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
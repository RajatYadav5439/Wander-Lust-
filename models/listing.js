
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const { ref } = require("joi");


const listingSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: {
        data: Buffer,
        contentType: String,
        filename: String
    },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    country: { type: String, required: true },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    owner: {
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    }
});


listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) { 
        if (listing.reviews && Array.isArray(listing.reviews) && listing.reviews.length > 0) 
            {
            await Review.deleteMany({ _id: { $in: listing.reviews } });
            console.log("Associated reviews deleted for listing:", listing._id);
        } else {
            console.log("No reviews to delete or reviews array is empty/invalid for listing:", listing._id);
        }
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;

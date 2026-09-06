const mongoose = require('mongoose'); 
const Listing = require('../models/listing'); 
const initData = require('./data');
const https = require('https');
const http = require('http');
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

// Function to download image from URL and return Buffer
const downloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
};

const initDB = async () => {
  try {
    await Listing.deleteMany({});
    console.log("Deleted existing listings");
    console.log(`Downloading ${initData.data.length} images in parallel...`);
    
    // Download all images in parallel
    const downloadPromises = initData.data.map(async (obj, index) => {
      try {
        const imageBuffer = await downloadImage(obj.image.url);
        console.log(`✓ ${index + 1}/${initData.data.length} Downloaded: ${obj.title}`);
        
        return {
          ...obj,
          owner: "6884b8d362108716a6d3aef6",
          image: {
            data: imageBuffer,
            contentType: 'image/jpeg',
            filename: obj.image.filename
          }
        };
      } catch (error) {
        console.error(`✗ Failed: ${obj.title} - ${error.message}`);
        return null;
      }
    });
    
    const results = await Promise.all(downloadPromises);
    const processedListings = results.filter(listing => listing !== null);
    
    await Listing.insertMany(processedListings);
    console.log(`\n✅ Data initialized! ${processedListings.length} listings added.`);
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    mongoose.connection.close();
  }
};

initDB();
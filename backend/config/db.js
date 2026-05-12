const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) {
            console.warn("MONGO_URI not found in env, skipping MongoDB connection for now.");
            return;
        }
        
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        // We do not exit process immediately in case user forgets to set password 
        // while testing front/back connectivity, but normally you'd do: process.exit(1);
    }
};

module.exports = connectDB;

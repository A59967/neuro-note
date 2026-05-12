require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const notesRoutes = require("./routes/notes");
const transcriptRoutes = require("./routes/transcript");
const chatRoutes = require("./routes/chat");
const quizRoutes = require("./routes/quiz");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for long lecture transcripts
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use("/api/notes", notesRoutes);
app.use("/api/transcript", transcriptRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/quiz", quizRoutes);

// Base route test
app.get("/", (req, res) => {
    res.send("Neuro Note API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

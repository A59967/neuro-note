const express = require("express");
const router = express.Router();

router.post("/youtube", async (req, res) => {
    try {
        const { url, videoId: maybeVideoId } = req.body;
        
        // Extract video ID from URL or use provided videoId
        let finalVideoId = maybeVideoId;
        if (url) {
            // Match youtube.com/watch?v=ID or youtu.be/ID
            const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
            const match = url.match(regex);
            if (match && match[1]) {
                finalVideoId = match[1];
            }
        }

        if (!finalVideoId) {
            return res.status(400).json({ error: "Invalid YouTube URL or Video ID missing" });
        }

        const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
        const response = await fetch(
            `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${finalVideoId}`,
            {
                method: "GET",
                headers: {
                    "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
                    "x-rapidapi-key": RAPIDAPI_KEY,
                },
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error("RapidAPI Response Error:", errText);
            throw new Error(`RapidAPI error: ${response.status} ${response.statusText} - ${errText}`);
        }

        const data = await response.json();
        console.log("RAW TRANSCRIPT API RESPONSE:", JSON.stringify(data, null, 2));
        
        if (!data.transcript || !Array.isArray(data.transcript)) {
            console.error("RapidAPI returned unexpected data format:", JSON.stringify(data));
            return res.status(400).json({ error: "No transcript found for this video. Make sure subtitles are enabled.", details: data });
        }

        const fullTranscript = data.transcript.map((item) => item.text).join(" ");
        res.status(200).json({ transcript: fullTranscript });
    } catch (error) {
        console.error("YouTube Parse error:", error.message, error.stack);
        res.status(500).json({ error: "Failed to extract YouTube transcript", details: error.message });
    }
});

module.exports = router;

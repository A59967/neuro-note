const express = require("express");
const router = express.Router();
const Note = require("../models/Note");

router.post("/", async (req, res) => {
    try {
        const { message, noteId } = req.body;
        
        if (!message || !noteId) {
            return res.status(400).json({ error: "Message and Note ID are required" });
        }

        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        const prompt = `You are a study assistant. Answer questions ONLY based on these notes: [${note.content}]. If the question is not covered in the notes, respond with exactly: This question is not covered in your lecture notes.
        
User Question: ${message}`;

        const GROQ_KEY = process.env.GROQ_KEY;
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${GROQ_KEY}`,
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: prompt }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        res.status(200).json({ aiResponse });
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: "Failed to get chat response" });
    }
});

module.exports = router;

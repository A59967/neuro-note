const express = require("express");
const router = express.Router();
const Note = require("../models/Note");

router.post("/generate", async (req, res) => {
    try {
        const { noteId, mcqCount = 20 } = req.body;
        
        if (!noteId) {
            return res.status(400).json({ error: "Note ID is required" });
        }

        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        const shortCount = Math.floor(mcqCount / 2);
        const prompt = `Generate ${mcqCount} MCQ questions and ${shortCount} short answer questions from these notes. Return ONLY valid JSON with this exact format: {"mcqs": [{"question": "...", "options": ["a","b","c","d"], "answer": "..."}], "shortQuestions": [{"question": "...", "answer": "..."}]}
        
Notes: ${note.content}`;

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
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data = await response.json();
        const generatedText = data.choices[0].message.content;
        
        try {
            const quizData = JSON.parse(generatedText);
            res.status(200).json(quizData);
        } catch (parseError) {
            console.error("JSON parse error from Groq:", parseError);
            res.status(500).json({ error: "Failed to parse quiz format" });
        }
    } catch (error) {
        console.error("Quiz generate error:", error);
        res.status(500).json({ error: "Failed to generate quiz" });
    }
});

module.exports = router;

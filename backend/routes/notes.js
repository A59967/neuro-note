const express = require("express");
const router = express.Router();
const Note = require("../models/Note");

// GET /api/notes?userId=... - get all notes for a user
router.get("/", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "userId query parameter is required" });
        }
        const notes = await Note.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        console.error("Fetch notes error:", error);
        res.status(500).json({ error: "Failed to fetch notes" });
    }
});

// GET /api/notes/:id - get single note
router.get("/:id", async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }
        res.status(200).json(note);
    } catch (error) {
        console.error("Fetch single note error:", error);
        res.status(500).json({ error: "Failed to fetch note" });
    }
});

// DELETE /api/notes/:id - delete a note
router.delete("/:id", async (req, res) => {
    try {
        const deletedNote = await Note.findByIdAndDelete(req.params.id);
        if (!deletedNote) {
            return res.status(404).json({ error: "Note not found" });
        }
        res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Delete note error:", error);
        res.status(500).json({ error: "Failed to delete note" });
    }
});

// PUT /api/notes/:id - update a note (used for saving highlights)
router.put("/:id", async (req, res) => {
    try {
        const { content } = req.body;
        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id, 
            { content },
            { new: true }
        );
        if (!updatedNote) return res.status(404).json({ error: "Note not found" });
        res.status(200).json(updatedNote);
    } catch (error) {
        console.error("Update note error:", error);
        res.status(500).json({ error: "Failed to update note" });
    }
});

router.post('/generate', async (req, res) => {
    req.setTimeout(300000);
    res.setTimeout(300000);

    try {
        const { transcript, userId, title, folderName } = req.body;
        if (!transcript || !userId) return res.status(400).json({ error: 'Missing fields' });

        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Transfer-Encoding', 'chunked');

        const words = transcript.split(' ');
        const chunkSize = 2000;
        const chunks = [];
        for (let i = 0; i < words.length; i += chunkSize) {
            chunks.push(words.slice(i, i + chunkSize).join(' '));
        }

        const apiKey = process.env.GEMINI_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        let combinedContent = "";

        for (let i = 0; i < chunks.length; i++) {
            res.write(JSON.stringify({ progress: `Processing chunk ${i + 1} of ${chunks.length} — please wait...`, current: i + 1, total: chunks.length }) + '\n');
            
            let chunkSuccess = false;
            let attempts = 0;
            
            while (!chunkSuccess && attempts < 2) {
                attempts++;
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000);
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `Make detailed study notes from this lecture chunk. If this is part of a larger lecture, smoothly continue the notes:\n\n${chunks[i]}` }] }]
                        }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    const rawText = await response.text();
                    if (!response.ok) {
                        console.error(`Chunk ${i+1} attempt ${attempts} failed:`, rawText);
                        if (attempts === 2) {
                            console.log(`Skipping chunk ${i+1} after 2 failed attempts.`);
                        }
                    } else {
                        const data = JSON.parse(rawText);
                        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (content) {
                            combinedContent += content + "\n\n";
                            chunkSuccess = true;
                            console.log(`Chunk ${i+1} processed successfully.`);
                        } else {
                            console.error(`Chunk ${i+1} attempt ${attempts} returned unexpected format:`, rawText);
                        }
                    }
                } catch (err) {
                    console.error(`Chunk ${i+1} attempt ${attempts} error:`, err.message);
                    if (attempts === 2) {
                        console.log(`Skipping chunk ${i+1} after 2 failed attempts.`);
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        const note = new Note({ userId, title: title || 'My Notes', content: combinedContent.trim(), folderName: folderName || 'All Notes' });
        await note.save();
        
        res.write(JSON.stringify({ note }) + '\n');
        res.end();
    } catch (err) {
        console.error('FULL ERROR:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        } else {
            res.write(JSON.stringify({ error: err.message }) + '\n');
            res.end();
        }
    }
});

module.exports = router;

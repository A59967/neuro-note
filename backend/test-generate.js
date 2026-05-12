async function testGenerate() {
    try {
        const response = await fetch('http://localhost:5000/api/notes/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: "testId",
                transcript: "The mitochondria is the powerhouse of the cell. It's responsible for cellular respiration and energy production in the form of ATP. This energy is essential for various cellular processes."
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        console.log("======================================");
        console.log("Success! Generated Notes:");
        console.log("======================================");
        console.log(data.notes);
    } catch (error) {
        console.error("Failed to generate notes:", error.message);
    }
}

testGenerate();

async function testYoutube() {
    const res = await fetch('http://localhost:5000/api/transcript/youtube', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        })
    });
    const d = await res.json();
    console.log(JSON.stringify(d, null, 2));
}

testYoutube();

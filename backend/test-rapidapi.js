require('dotenv').config();

async function check() {
    const response = await fetch(
        `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=dQw4w9WgXcQ`,
        {
            method: "GET",
            headers: {
                "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
                "x-rapidapi-key": process.env.RAPIDAPI_KEY,
            },
        }
    );
    const data = await response.json();
    require('fs').writeFileSync('rapidapi_json.json', JSON.stringify(data, null, 2), 'utf8');
    console.log("Written to rapidapi_json.json");
}

check();

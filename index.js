require("dotenv").config();
const http = require("http");
const { OpenAI } = require("openai");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Game Idea Generator</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #0f172a;
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            .box {
              background: #1e293b;
              padding: 30px;
              border-radius: 10px;
              text-align: center;
              width: 500px;
            }
            button {
              margin-top: 15px;
              padding: 10px;
              width: 100%;
              border: none;
              border-radius: 6px;
              background: #38bdf8;
              font-size: 16px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Game Idea AI</h1>

            <input 
              id="ideaInput" 
              type="text" 
              placeholder="A game you made before"
              style="width: 90%; padding:8px; margin-bottom:10px;"
            >
            <input 
              id="gameEngine" 
              type="text" 
              placeholder="Game Engine you used or want to use"
              style="width: 90%; padding:8px; margin-bottom:10px;"
            >

            <p id="idea">Click the button</p>
            <button onclick="generate()">Generate Idea</button>
          </div>

          <script>
            async function generate() {
            const userInput = document.getElementById("ideaInput").value;
            const userInputGameEngine = document.getElementById("gameEngine").value;
            document.getElementById("idea").innerText = "Generating...";

            const response = await fetch("/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: userInput, engine: userInputGameEngine })
         });

        const data = await response.json();
        console.log("Response from server:", data);
        document.getElementById("idea").innerText = data.response || data.error || "Something went wrong";
        }
          </script>
        </body> 
      </html>

    `);
  }
  else if (req.url === "/generate" && req.method === "POST") {
  let body = "";

  req.on("data", chunk => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    const { prompt, engine } = JSON.parse(body);

    try {
      const ideas = [];

      // Call AI 5 times, each generating 1 micro-idea
      for (let i = 0; i < 5; i++) {
        const completion = await client.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            { 
              role: "system", 
              content: "ONLY output 1 short game idea in around 5-6 words. Only output the type or mechanic, no names, stories, or extra text. REMEMBER i want the general idea i dont want the NAME i want the GENERAK IDEA." 
            },
            { 
              role: "user", 
              content: (prompt || "A random game") + (engine ? " using " + engine : "")
            }
          ]
        });

        const output = completion.choices[0].message.content.trim();
        ideas.push(output);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ response: ideas.join("\n") }));

    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}



});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

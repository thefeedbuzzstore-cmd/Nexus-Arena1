var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_axios = __toESM(require("axios"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  app.use(import_express.default.json());
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const ai = geminiApiKey ? new import_genai.GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  }) : null;
  if (!geminiApiKey) {
    console.warn("[Server] GEMINI_API_KEY not set. AI features (summarization, recommendations) will be unavailable.");
  }
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const response = await import_axios.default.get("https://www.freetogame.com/api/games");
      const games = response.data || [];
      const host = req.headers.host || "nexusarena.com";
      const baseUrl = `https://${host}`;
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
      const staticPaths = ["", "/search", "/trending", "/top-rated", "/upcoming", "/deals", "/login"];
      staticPaths.forEach((p) => {
        xml += `  <url>
`;
        xml += `    <loc>${baseUrl}${p}</loc>
`;
        xml += `    <changefreq>daily</changefreq>
`;
        xml += `    <priority>${p === "" ? "1.0" : "0.8"}</priority>
`;
        xml += `  </url>
`;
      });
      const getSlug = (title) => {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      };
      games.slice(0, 150).forEach((game) => {
        xml += `  <url>
`;
        xml += `    <loc>${baseUrl}/games/${getSlug(game.title)}</loc>
`;
        xml += `    <changefreq>weekly</changefreq>
`;
        xml += `    <priority>0.6</priority>
`;
        xml += `  </url>
`;
      });
      xml += `</urlset>`;
      res.header("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("Sitemap creation failed", error);
      res.header("Content-Type", "application/xml");
      res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://nexusarena.com/</loc></url></urlset>`);
    }
  });
  app.get("/robots.txt", (req, res) => {
    const host = req.headers.host || "nexusarena.com";
    const baseUrl = `https://${host}`;
    res.header("Content-Type", "text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /admin-dashboard
Disallow: /admin-login

Sitemap: ${baseUrl}/sitemap.xml`);
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/api/games/list", async (req, res) => {
    try {
      const response = await import_axios.default.get("https://www.freetogame.com/api/games", {
        params: req.query
      });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });
  app.get("/api/games/details", async (req, res) => {
    try {
      const response = await import_axios.default.get("https://www.freetogame.com/api/game", {
        params: req.query
      });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game details" });
    }
  });
  app.get("/api/deals", async (req, res) => {
    try {
      const response = await import_axios.default.get("https://www.cheapshark.com/api/1.0/deals", {
        params: req.query
      });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });
  app.post("/api/ai/summarize", async (req, res) => {
    const { gameTitle, description } = req.body;
    if (!gameTitle || !description) {
      return res.status(400).json({ error: "Game title and description are required" });
    }
    if (!ai) {
      console.warn("[API] Gemini API not available, returning original description");
      return res.json({ summary: description });
    }
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a concise, high-energy summary of the game "${gameTitle}" for a professional gaming platform. Key points to highlight: target audience, vibe, and why someone should play it. Original description: ${description}`,
        config: {
          systemInstruction: "You are a professional gaming journalist for a premium platform like IGN or Steam. Your tone is energetic, insightful, and persuasive."
        }
      });
      res.json({ summary: response.text });
    } catch (error) {
      console.error("[API] Gemini Error:", error);
      res.json({ summary: description || "Game description unavailable" });
    }
  });
  app.post("/api/ai/recommend", async (req, res) => {
    const { favoriteGames, allGames } = req.body;
    if (!ai) {
      console.warn("[API] Gemini API not available, unable to generate recommendations");
      return res.json({ recommendation: "AI recommendations are currently unavailable. Please try again later." });
    }
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on these favorite games: [${favoriteGames.join(", ")}], pick 3 games from this list that the user might enjoy and explain why: [${allGames.join(", ")}]. Return the response in a professional, gamer-friendly tone.`,
        config: {
          systemInstruction: "You are an AI game discovery assistant. You help users find their next favorite game."
        }
      });
      res.json({ recommendation: response.text });
    } catch (error) {
      console.error("[API] AI Recommendation Error:", error);
      res.json({ recommendation: "Unable to generate recommendations at this time. Try again later." });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

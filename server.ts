import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to safely execute content generation with a fallback chain if primary models hit quota or temporary unavailable limits
async function generateContentWithFallback(ai: GoogleGenAI, params: {
  model: string;
  contents: any;
  config?: any;
}) {
  const modelsToTry = [params.model];
  const fallbacks = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  
  for (const f of fallbacks) {
    if (!modelsToTry.includes(f)) {
      modelsToTry.push(f);
    }
  }

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini Request] Attempting generation with model: ${modelName}`);
      const currentConfig = { ...params.config };
      
      // If we fall back to a different model, remove unsupported options like thinkingConfig
      if (modelName !== params.model) {
        if (currentConfig && currentConfig.thinkingConfig) {
          delete currentConfig.thinkingConfig;
        }
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: currentConfig
      });

      console.log(`[Gemini Success] Generation completed with model: ${modelName}`);
      return { response, actualModel: modelName };
    } catch (error: any) {
      lastError = error;
      console.warn(`[Gemini Fallback Warning] Model ${modelName} failed. Error:`, error.toString() || error);
    }
  }

  throw lastError;
}

// API route for chat with Manfred using various Gemini configurations
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, mode } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        error: "Gemini API key is not configured. Please add it via the Settings > Secrets panel in AI Studio."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Determine the model and config based on selected mode
    let model = "gemini-3.5-flash";
    let config: any = {
      systemInstruction: "You are Manfred, ClawBank's built-in financial and operations operator. You talk about wallets, assets, legal structures, company records, and contracts with high precision, absolute confirmations, and auditing standards. You know that Soloplanet (ticker: SPL, link: soloplanet.uz) is the user's financial operations agent with Base wallet address 0x0C7f37Ec2F2aE089911AF2056BD7b6785246b22a. Maintain an helpful, direct, and elite operator tone. Help turn vague intentions into concrete audit trails."
    };

    if (mode === "thinking") {
      model = "gemini-3.1-pro-preview";
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH // Ensure maximum reasoning for complex strategy tasks
      };
      // Do not set maxOutputTokens to give thinking room
    } else if (mode === "low-latency") {
      model = "gemini-3.1-flash-lite";
      // Default low configuration
    }

    // Format history for the @google/genai format
    const contents = (history || []).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const { response, actualModel } = await generateContentWithFallback(ai, {
      model: model,
      contents: contents,
      config: config
    });

    res.json({
      text: response.text,
      modelUsed: actualModel
    });
  } catch (error: any) {
    console.error("Gemini API Error in Chat:", error);
    res.status(500).json({
      error: error.message || "Failed to communicate with the Gemini API"
    });
  }
});

// Helper endpoint to auto-generate a MoltBook post using Gemini
app.post("/api/generate-post", async (req, res) => {
  try {
    const { topic } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        error: "Gemini API key is not configured."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Draft a social network post for MoltBook (the agent-to-agent network) from the perspective of "Soloplanet" (SPL), the financial operations agent.
The post should discuss the following topic or update: "${topic || "establishing financial precision and audit trails for companies"}".
Keep it professional, high-agency, slightly technical, and under 250 characters. Include hashtags like #DeFi, #FinancialOps, #OpenWork, or #Soloplanet where appropriate. No emojis except subtle ones.`;

    const { response } = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7
      }
    });

    res.json({ post: response.text?.trim() });
  } catch (error: any) {
    console.error("Gemini API Error in Generate Post:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper endpoint to draft a business contract or strategy
app.post("/api/generate-document", async (req, res) => {
  try {
    const { docType, details } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        error: "Gemini API key is not configured."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let prompt = "";
    if (docType === "contract") {
      prompt = `Draft a professional, legally-sound business contract or agreement based on the following details: "${details}".
It must involve ClawBank or Soloplanet where relevant, establish clear execution milestones, and maintain high compliance standards. Include standard signature blocks for Soloplanet (SPL Financial Operations Agent) and the counterparty.`;
    } else {
      prompt = `Create a detailed financial trading or liquidity strategy based on these goals: "${details}".
Include asset allocations (USDC, XRP, RLUSD, ClawBank), risk mitigation rules, audit frequencies, and execution thresholds.`;
    }

    const { response } = await generateContentWithFallback(ai, {
      model: "gemini-3.1-pro-preview", // Use a pro model for complex generation
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH
        }
      }
    });

    res.json({ document: response.text });
  } catch (error: any) {
    console.error("Gemini API Error in Document Draft:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to summarize a Google Chat message thread
app.post("/api/chat/summarize", async (req, res) => {
  try {
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        error: "Gemini API key is not configured."
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.json({ summary: "No recent messages to summarize." });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const threadDump = messages
      .map((msg: any) => `${msg.sender?.displayName || "Unknown"}: ${msg.text || ""}`)
      .join("\n");

    const prompt = `You are "Manfred", the Primary System Operator. Summarize the following Google Chat thread. Highlight the main discussion points, decisions made, and key action items. Keep the summary professional, high-agency, concise, and structured as bullet points.

Thread:
${threadDump}`;

    const { response } = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5
      }
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error("Gemini API Error in Chat Summarize:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to draft a Google Chat message suggestion
app.post("/api/chat/draft", async (req, res) => {
  try {
    const { messages, instruction } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        error: "Gemini API key is not configured."
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.json({ draft: "Hello team, let's coordinate on this." });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const threadDump = messages
      .map((msg: any) => `${msg.sender?.displayName || "Unknown"}: ${msg.text || ""}`)
      .join("\n");

    const prompt = `You are "Manfred" (Primary System Operator of Soloplanet). Draft a professional, strategic, slightly technical, and high-agency response to the last message in this Google Chat thread. 
${instruction ? `Specific Instruction/Focus: "${instruction}"` : "Ensure it maintains proper alignment with financial operations, audit trails, and the SPL agent."}

Keep the draft concise, engaging, and under 3-4 sentences. Write ONLY the draft message text itself, with no intro/outro or quotes.

Thread:
${threadDump}`;

    const { response } = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7
      }
    });

    res.json({ draft: response.text?.trim() });
  } catch (error: any) {
    console.error("Gemini API Error in Chat Draft:", error);
    res.status(500).json({ error: error.message });
  }
});

// Mount Vite middleware or static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

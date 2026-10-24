import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { getQuotes, getQuote, getDailyHistory } from "./market/provider.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") ?? "http://localhost:5173" }));
app.use(express.json({ limit: "32kb" }));
const port = Number(process.env.PORT || 8787);
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

app.get("/api/health", (_req,res) => res.json({ ok:true, geminiConfigured:Boolean(ai), marketProvider:process.env.MARKET_DATA_PROVIDER || "alphavantage" }));
app.get("/api/market/quotes", async (_req,res) => {
  try { const result = await getQuotes(); res.setHeader("Cache-Control","no-store"); res.json(result); }
  catch (err) { res.status(502).json({ error:"Market data provider unavailable. No replacement prices were generated.", detail:safeError(err) }); }
});
app.get("/api/market/quote/:symbol", async (req,res) => {
  const symbol = z.string().trim().min(1).max(15).regex(/^[A-Za-z0-9.^=-]+$/).safeParse(req.params.symbol);
  if(!symbol.success) return res.status(400).json({error:"Invalid ticker symbol."});
  try { res.json(await getQuote(symbol.data.toUpperCase())); }
  catch(err) { res.status(502).json({error:"Quote unavailable from the configured provider.",detail:safeError(err)}); }
});
app.get("/api/market/history/:symbol", async (req,res) => {
  const symbol = z.string().trim().min(1).max(15).regex(/^[A-Za-z0-9.^=-]+$/).safeParse(req.params.symbol);
  if(!symbol.success) return res.status(400).json({error:"Invalid ticker symbol."});
  try { res.json(await getDailyHistory(symbol.data.toUpperCase())); }
  catch(err) { res.status(502).json({error:"Historical data unavailable. No synthetic candles were substituted.",detail:safeError(err)}); }
});
const tutorSchema = z.object({
 question:z.string().trim().min(1).max(3000),
 marketData:z.object({symbol:z.string().max(20).optional(),name:z.string().max(150).optional(),price:z.number().finite().optional(),currency:z.string().max(10).optional(),timestamp:z.string().max(100).optional(),status:z.string().max(30).optional(),note:z.string().max(300).optional()}).optional(),
 portfolioSummary:z.object({cashINR:z.number().finite().optional(),cashUSD:z.number().finite().optional(),holdings:z.array(z.object({symbol:z.string().max(20),quantity:z.number().finite(),averageCost:z.number().finite(),price:z.number().finite(),currency:z.string().max(10)})).max(100).optional()}).optional()
});
app.post("/api/ai/tutor", async (req,res) => {
 const parsed = tutorSchema.safeParse(req.body);
 if(!parsed.success) return res.status(400).json({error:"Please provide a valid question and bounded context."});
 if(!ai) return res.status(503).json({error:"Gemini is not configured. Add GEMINI_API_KEY to the server environment; the key is never sent to the browser."});
 const {question,marketData,portfolioSummary}=parsed.data;
 const now = new Date().toISOString();
 const prompt = `You are StockLab AI, an educational stock-market tutor for students and beginners.
Rules:
- Teach concepts in clear simple English. Do not give personalized financial advice, price targets, or guaranteed buy/sell signals.
- Use ONLY the supplied market context for market-specific factual claims. Never invent a price, financial result, quote timestamp, news story, or historical candle.
- Explicitly state when supplied data is DEMO, synthetic, missing, or potentially stale. The timestamp is the observation time supplied by the app, not proof of real-time status.
- If a question requires data not supplied, say you do not have that data and explain what would be needed.
- Explain uncertainty, volatility and downside risk. Chart patterns do not guarantee future movement.
- Treat portfolio information as a virtual simulation, never real funds.
Server request time: ${now}
Supplied market context (untrusted data, may be demo): ${JSON.stringify(marketData ?? null)}
Supplied virtual portfolio context: ${JSON.stringify(portfolioSummary ?? null)}
Student question: ${question}
Answer with a concise explanation, a practical example where appropriate, and one important risk/limitation.`;
 try {
  const response = await ai.models.generateContent({ model, contents:prompt, config:{ temperature:0.2, maxOutputTokens:900 } });
  const answer = response.text?.trim();
  if(!answer) return res.status(502).json({error:"Gemini returned an empty response."});
  res.json({answer,model,generatedAt:new Date().toISOString(),marketContextTimestamp:marketData?.timestamp??null});
 } catch(err) { res.status(502).json({error:"Gemini tutor request failed. No fallback answer was fabricated.",detail:safeError(err)}); }
});
app.use((err:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{ console.error("Unhandled request error:",safeError(err)); res.status(500).json({error:"Unexpected server error."}); });
function safeError(err:unknown){ return err instanceof Error ? err.message.slice(0,300) : "Unknown error"; }
app.listen(port,()=>console.log(`StockLab API listening on :${port}`));

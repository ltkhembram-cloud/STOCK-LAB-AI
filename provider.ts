import { z } from "zod";
const AV_BASE = "https://www.alphavantage.co/query";
const QuoteSchema = z.object({
 "Global Quote": z.object({
  "01. symbol":z.string(), "02. open":z.string().optional(), "03. high":z.string().optional(),
  "04. low":z.string().optional(), "05. price":z.string(), "06. volume":z.string().optional(),
  "07. latest trading day":z.string(), "08. previous close":z.string().optional(),
  "09. change":z.string().optional(), "10. change percent":z.string().optional()
 }).optional(),
 Note:z.string().optional(), Information:z.string().optional(), "Error Message":z.string().optional()
});
const symbols = ["AAPL","MSFT","NVDA"];
const names:Record<string,string>={AAPL:"Apple Inc.",MSFT:"Microsoft Corporation",NVDA:"NVIDIA Corporation"};
function key(){ const k=process.env.ALPHA_VANTAGE_API_KEY; if(!k) throw new Error("ALPHA_VANTAGE_API_KEY is not configured."); return k; }
async function fetchJson(url:string){ const r=await fetch(url,{signal:AbortSignal.timeout(12000)}); if(!r.ok) throw new Error(`Market provider HTTP ${r.status}`); return r.json(); }
export async function getQuote(symbol:string){
 const raw=await fetchJson(`${AV_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key())}`);
 const parsed=QuoteSchema.parse(raw);
 if(parsed.Note||parsed.Information) throw new Error("Provider rate limit or information message: "+(parsed.Note||parsed.Information));
 if(parsed["Error Message"]||!parsed["Global Quote"]?.["05. price"]) throw new Error(parsed["Error Message"]||"Provider returned no quote for this symbol.");
 const q=parsed["Global Quote"]; const price=Number(q["05. price"]); const change=Number(q["09. change"]);
 const changePercent=Number((q["10. change percent"]||"").replace("%",""));
 if(!Number.isFinite(price)||price<=0) throw new Error("Provider returned an invalid price.");
 const latestDay=q["07. latest trading day"];
 const timestamp=new Date(`${latestDay}T21:00:00Z`).toISOString();
 const today=new Date().toISOString().slice(0,10);
 // Alpha Vantage Global Quote is not assumed real-time: label historical/delayed because plan and exchange entitlements vary.
 const status = latestDay===today ? "DELAYED" : "HISTORICAL";
 return {symbol:q["01. symbol"],name:names[symbol]||symbol,exchange:"US listing (provider metadata limited)",currency:"USD",price,change:Number.isFinite(change)?change:null,changePercent:Number.isFinite(changePercent)?changePercent:null,timestamp,status,note:"Alpha Vantage Global Quote; not represented as guaranteed real-time data."};
}
export async function getQuotes(){
 if(!process.env.ALPHA_VANTAGE_API_KEY) return {mode:"DEMO",quotes:[] as unknown[],note:"Provider key not configured. UI may show explicitly labelled demo data."};
 // Free-tier quotas are small; fetch sequentially and avoid pretending a partial result is complete.
 const quotes=[]; for(const s of symbols){ try{quotes.push(await getQuote(s));}catch(e){if(quotes.length===0) throw e;}}
 if(!quotes.length) throw new Error("No quotes available.");
 return {mode:"PROVIDER",quotes,note:"Quotes may be delayed or historical depending on provider entitlement."};
}
export async function getDailyHistory(symbol:string){
 const raw:any=await fetchJson(`${AV_BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${encodeURIComponent(key())}`);
 if(raw.Note||raw.Information) throw new Error("Provider rate limit or information message: "+(raw.Note||raw.Information));
 if(raw["Error Message"]||!raw["Time Series (Daily)"]) throw new Error(raw["Error Message"]||"Historical series unavailable.");
 const series=raw["Time Series (Daily)"] as Record<string,Record<string,string>>;
 const candles=Object.entries(series).map(([date,v])=>({date,open:Number(v["1. open"]),high:Number(v["2. high"]),low:Number(v["3. low"]),close:Number(v["4. close"]),volume:Number(v["5. volume"])})).filter(c=>[c.open,c.high,c.low,c.close,c.volume].every(Number.isFinite)).sort((a,b)=>a.date.localeCompare(b.date));
 if(!candles.length) throw new Error("No valid OHLCV records returned.");
 return {symbol,status:"HISTORICAL",provider:"Alpha Vantage",timestamp:new Date().toISOString(),candles};
}

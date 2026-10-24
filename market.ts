export type MarketQuote = { symbol:string; name:string; exchange:string; currency:"USD"|"INR"; price:number; change:number|null; changePercent:number|null; timestamp:string; status:"DEMO"|"REAL"|"DELAYED"|"HISTORICAL"; note:string };
export type Candle = { date:string; open:number; high:number; low:number; close:number; volume:number };
export const demoQuotes: MarketQuote[] = [
 {symbol:"AAPL",name:"Apple Inc.",exchange:"NASDAQ",currency:"USD",price:228.50,change:1.12,changePercent:0.49,timestamp:new Date().toISOString(),status:"DEMO",note:"Illustrative demo quote — not market data"},
 {symbol:"MSFT",name:"Microsoft Corporation",exchange:"NASDAQ",currency:"USD",price:512.40,change:-2.35,changePercent:-0.46,timestamp:new Date().toISOString(),status:"DEMO",note:"Illustrative demo quote — not market data"},
 {symbol:"NVDA",name:"NVIDIA Corporation",exchange:"NASDAQ",currency:"USD",price:184.20,change:3.76,changePercent:2.08,timestamp:new Date().toISOString(),status:"DEMO",note:"Illustrative demo quote — not market data"},
 {symbol:"RELIANCE",name:"Reliance Industries (demo)",exchange:"NSE",currency:"INR",price:1450,change:null,changePercent:null,timestamp:new Date().toISOString(),status:"DEMO",note:"Illustrative demo quote — not market data"}
];
export function demoCandles(symbol:string): Candle[] {
  // Explicitly synthetic series for chart-school UI only. Never presented as historical market data.
  const base = demoQuotes.find(q=>q.symbol===symbol)?.price ?? 100;
  return Array.from({length:30},(_,i)=> {
    const drift = Math.sin(i*0.8)*base*0.018 + Math.cos(i*0.31)*base*0.012;
    const close = Math.max(0.01, base*0.92 + drift + i*base*0.002);
    const open = close * (1 + Math.sin(i*1.7)*0.008);
    return {date:new Date(Date.now()-(29-i)*86400000).toISOString().slice(0,10),open,high:Math.max(open,close)*1.012,low:Math.min(open,close)*0.988,close,volume:Math.round(500000+Math.abs(Math.sin(i))*1500000)};
  });
}

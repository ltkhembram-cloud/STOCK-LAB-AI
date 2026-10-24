export type Holding = { symbol: string; name: string; quantity: number; averageCost: number; price: number; currency: "INR" | "USD" };
export type Trade = { id: string; symbol: string; side: "BUY" | "SELL"; quantity: number; price: number; fee: number; timestamp: string; currency: "INR" | "USD" };
export type Portfolio = { cashINR: number; cashUSD: number; holdings: Holding[]; trades: Trade[] };
export type Quote = { symbol: string; name: string; price: number; currency: "INR" | "USD"; timestamp: string; mode: "DEMO" | "PROVIDER"; exchange: string };
export const initialPortfolio = (): Portfolio => ({ cashINR: 100000, cashUSD: Number(import.meta.env.VITE_VIRTUAL_USD_STARTING_CASH || 10000), holdings: [], trades: [] });
export function trade(p: Portfolio, q: Quote, side: "BUY" | "SELL", quantity: number, feeRate = 0.001): Portfolio {
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) throw new Error("Enter a positive whole-share quantity.");
  if (!Number.isFinite(q.price) || q.price <= 0) throw new Error("A valid quote is required before trading.");
  const cashKey = q.currency === "INR" ? "cashINR" : "cashUSD";
  const cash = p[cashKey];
  const idx = p.holdings.findIndex(h => h.symbol === q.symbol && h.currency === q.currency);
  const holding = idx >= 0 ? p.holdings[idx] : undefined;
  const gross = q.price * quantity;
  const fee = gross * feeRate;
  const next = { ...p, holdings: p.holdings.map(h => ({...h})), trades: [...p.trades] };
  if (side === "BUY") {
    if (cash + 1e-8 < gross + fee) throw new Error("Insufficient virtual cash, including estimated fees.");
    next[cashKey] = cash - gross - fee;
    if (holding) {
      const h = next.holdings[idx];
      h.averageCost = (h.averageCost * h.quantity + gross + fee) / (h.quantity + quantity);
      h.quantity += quantity; h.price = q.price;
    } else next.holdings.push({ symbol:q.symbol, name:q.name, quantity, averageCost:(gross+fee)/quantity, price:q.price, currency:q.currency });
  } else {
    if (!holding || holding.quantity < quantity) throw new Error("You cannot sell more virtual shares than you own.");
    const h = next.holdings[idx];
    const costBasis = h.averageCost * quantity;
    next[cashKey] = cash + gross - fee;
    h.quantity -= quantity; h.price = q.price;
    if (h.quantity === 0) next.holdings.splice(idx, 1);
    // Realized P/L is derived from SELL trade proceeds less average-cost basis in the UI.
    void costBasis;
  }
  next.trades.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, symbol:q.symbol, side, quantity, price:q.price, fee, timestamp:new Date().toISOString(), currency:q.currency });
  return next;
}
export function positionValue(h: Holding) { return h.quantity * h.price; }
export function unrealizedPnL(h: Holding) { return h.quantity * (h.price - h.averageCost); }
export function totalValue(p: Portfolio) { return p.cashINR + p.holdings.filter(h=>h.currency==="INR").reduce((s,h)=>s+positionValue(h),0); }
export function totalValueUSD(p: Portfolio) { return p.cashUSD + p.holdings.filter(h=>h.currency==="USD").reduce((s,h)=>s+positionValue(h),0); }

import { describe,it,expect } from "vitest";
import { initialPortfolio, trade, unrealizedPnL, totalValue } from "../src/lib/trading";
import type { Quote } from "../src/lib/trading";
const q:Quote={symbol:"TEST",name:"Test Co.",price:100,currency:"INR",timestamp:"2026-01-01T00:00:00.000Z",mode:"DEMO",exchange:"DEMO"};
describe("virtual trading engine",()=>{
 it("starts with ₹100,000 virtual cash",()=>expect(initialPortfolio().cashINR).toBe(100000));
 it("buys whole shares and charges a fee",()=>{const p=trade(initialPortfolio(),q,"BUY",2);expect(p.holdings[0].quantity).toBe(2);expect(p.cashINR).toBeCloseTo(99799.8);});
 it("rejects insufficient cash",()=>expect(()=>trade(initialPortfolio(),{...q,price:100000},"BUY",2)).toThrow(/Insufficient/));
 it("rejects fractional and non-positive quantities",()=>{expect(()=>trade(initialPortfolio(),q,"BUY",0)).toThrow();expect(()=>trade(initialPortfolio(),q,"BUY",1.5)).toThrow();});
 it("prevents overselling",()=>expect(()=>trade(initialPortfolio(),q,"SELL",1)).toThrow(/cannot sell/));
 it("calculates unrealized profit/loss",()=>{const p=trade(initialPortfolio(),q,"BUY",2);expect(unrealizedPnL({...p.holdings[0],price:110})).toBeCloseTo(19.8);});
 it("tracks total INR value as cash plus holdings",()=>{const p=trade(initialPortfolio(),q,"BUY",2);expect(totalValue(p)).toBeCloseTo(99999.8);});
});

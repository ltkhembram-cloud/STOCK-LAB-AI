# StockLab AI — Learn, Explore, Practice

A mobile-first educational stock-market simulator. It is **not a brokerage**: there are no real-money orders, deposits, withdrawals, or broker integrations.

## Included in this starter

- React + TypeScript + Tailwind + Recharts UI.
- Learning path with lessons, quizzes and in-session completion tracking.
- Virtual INR portfolio starting at ₹100,000 and a separate USD ledger.
- Buy/sell simulation, whole-share validation, estimated 0.10% fee, cash checks, oversell prevention, holdings, average cost, unrealized P/L and trade history.
- Express backend with server-side official Google GenAI SDK (`@google/genai`) and `GEMINI_API_KEY`.
- Market-data adapter for Alpha Vantage quote and daily OHLCV endpoints; API keys remain server-side.
- Vitest tests for core virtual trading calculations.
- Explicit demo-mode labels and failure responses that do not fabricate replacement provider data.

## Important known limitations

This ZIP is a starter implementation, not a production-ready financial application.

1. **Demo charts:** the current Charts screen intentionally displays a synthetic series and labels it `SYNTHETIC DEMO SERIES`. It is not real historical OHLCV, even if provider quotes are connected. The backend `/api/market/history/:symbol` endpoint returns provider-backed daily candles, but wiring those candles into the chart UI and adding OHLC bars/candlesticks/RSI/moving averages is a next implementation stage.
2. **Provider quote metadata:** Alpha Vantage Global Quote does not guarantee real-time access. Entitlements, market coverage, rate limits and usage terms depend on your API plan. The adapter labels quote data delayed or historical rather than promising live prices. US symbols are configured initially; Indian exchange symbols may not be supported by your plan/provider.
3. **Demo quote list:** if no market API key is configured, the UI's labelled demo quote list remains available. Demo values are illustrative only.
4. **Persistence/authentication:** portfolio and lesson progress currently live in browser memory and reset on refresh. There is no account system or cross-device persistence.
5. **P/L:** unrealized P/L and average cost are included. The UI does not yet provide a fully reconciled realized-P/L ledger across every sell/fee edge case, or portfolio performance snapshots.
6. **Deployment:** this is not pre-deployed. Install dependencies and run the checks locally before deployment. Hosting must support both the Vite frontend and Express API or use separate services with a configured API base URL.
7. **Build verification:** dependencies must be installed in your environment. This ZIP was generated as source files; no claim is made that npm install, tests or production build were executed in this environment.

## Requirements

- Node.js 20+ recommended
- npm
- Google Gemini API key for the tutor
- Optional Alpha Vantage API key for provider-backed market data

## Local setup

```bash
unzip stocklab-ai.zip
cd stocklab-ai
npm install
cp .env.example .env
```

Edit `.env`:

```dotenv
GEMINI_API_KEY=your_server_side_gemini_key
GEMINI_MODEL=gemini-2.5-flash
MARKET_DATA_PROVIDER=alphavantage
ALPHA_VANTAGE_API_KEY=your_market_data_key
PORT=8787
CLIENT_ORIGIN=http://localhost:5173
```

Start both services:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API health: `http://localhost:8787/api/health`

Run tests:

```bash
npm test
```

Build frontend:

```bash
npm run build
```

The current `build` script checks/builds the frontend. Compile the server separately with:

```bash
npx tsc -p tsconfig.server.json
```

## Gemini architecture

The backend creates `GoogleGenAI` from `@google/genai` using `process.env.GEMINI_API_KEY`. The browser calls `/api/ai/tutor`; it never receives the API key. The tutor prompt requires it to disclose missing/stale/demo context and forbids invented market facts or guaranteed signals.

Never put Gemini secrets in `VITE_*` variables or commit `.env`.

## Market data setup

The Alpha Vantage adapter currently queries `GLOBAL_QUOTE` and `TIME_SERIES_DAILY`. Check Alpha Vantage's current documentation, coverage, quotas and plan terms before use. Free API limits can make sequential multi-symbol refreshes fail or return partial data. An API failure is surfaced; the server does not invent a quote or candles. Historical data is returned by `/api/market/history/:symbol`, but the current chart screen still uses clearly labelled synthetic demo candles until chart integration is completed.

## Virtual trading rules

- Virtual INR cash starts at ₹100,000; USD cash starts at the configured client-side default of $10,000.
- Whole shares only.
- Simulated fills use the latest displayed quote; they are not guaranteed executable prices.
- Default illustrative fee: 0.10% of gross trade value.
- No real order execution, payments, deposits, withdrawals or brokerage connections.

## Deployment notes

For a first deployment, use a Node-compatible host for the Express API and a static host for the Vite frontend. Configure `GEMINI_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `GEMINI_MODEL`, `PORT`, and `CLIENT_ORIGIN` as server environment variables. If hosting frontend and backend separately, configure the frontend API base URL and CORS origin before deployment. Do not publish `.env` or paste keys into client-side code.

## Roadmap

- Connect `/api/market/history/:symbol` to the chart component and add actual OHLC/candlestick rendering.
- Implement date-range filtering, moving averages and RSI from real candles.
- Add market-provider caching, retry/backoff and request-level rate limiting.
- Add server-backed portfolio persistence and authentication.
- Add realised P/L ledger, fees reconciliation and performance snapshots.
- Expand Indian-market symbols after provider coverage and licensing are verified.
- Add accessibility audit and end-to-end tests.

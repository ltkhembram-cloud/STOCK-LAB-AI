# Architecture

```text
React + TypeScript + Tailwind
  ├── Learn / quizzes
  ├── Chart School / market watch
  ├── Virtual portfolio + trade history
  └── AI Tutor UI
          │ same-origin /api calls in local Vite proxy setup
          ▼
Express + Zod validation
  ├── /api/ai/tutor ── @google/genai ── Gemini API (server secret)
  └── /api/market/* ── provider adapter ── Alpha Vantage
```

## Security and truthfulness boundaries

- Gemini and market-data keys are read only from server environment variables.
- Input schemas limit payload size and accepted data shapes.
- Provider errors do not trigger fabricated replacement market data.
- Synthetic chart data is explicitly labelled and must not be interpreted as historical candles.
- AI receives only the current displayed quote and summary supplied by the UI; it is instructed not to infer missing market facts.
- This starter has no authentication. Do not use it for sensitive data or public multi-user portfolios until authentication, authorization, persistence, abuse protection, rate limits and security review are implemented.

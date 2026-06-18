# Project: Claude AI Chat App

## Name & Purpose
Personal/team AI chat interface built on Next.js, connecting to Anthropic's Claude models via the Vercel AI SDK. Provides a clean, Japanese-localized UI for conversational AI with extended thinking support.

## Deployment
- Platform: Vercel (serverless, Node.js runtime)
- URL pattern: https://<project-name>.vercel.app
- Each deploy resets in-memory state (rate limiter, no session data)

## Auth Model
Single shared 4-digit ACCESS_CODE. No user accounts. One code grants full access to all models and features. The code lives in Vercel environment variables only — never in source.

## User Base
Single user or very small team sharing one access code. Not designed for multi-user isolation or per-user history.

## Current Status
Production-ready. Running in production on Vercel. No known blocking bugs.

## Tech Stack Summary
- Next.js 16.2.9 (App Router) + React 19.2.7 + TypeScript 6.0.3 strict
- Tailwind CSS 4.3.1 for styling
- Vercel AI SDK (ai 6.0.206, @ai-sdk/anthropic 3.0.84, @ai-sdk/react 3.0.208)
- jose 6.2.3 for JWT auth cookies
- react-markdown 10.1.0 + react-syntax-highlighter 16.1.1 for message rendering

## Known Limitations
- **In-memory rate limiter**: Each Vercel function instance has its own Map. Rate limit state is not shared across instances and resets on redeploy.
- **No test suite**: Zero automated tests. All validation is manual.
- **No CI/CD**: Deployments triggered manually via Vercel dashboard or CLI.
- **No chat history persistence**: Conversations exist only in React state. Page refresh clears all history.
- **No multi-user isolation**: Single shared access code; no per-user history or settings.

## Local Development Setup
Node.js is managed via fnm. Before starting development:
```
fnm use 22.13.1   # or let fnm pick from .nvmrc if present
npm install       # node_modules must exist before next dev
npm run dev
```
Node binary location: `C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation`

## Environment Variables Required
- `ANTHROPIC_API_KEY` — Anthropic API key
- `ACCESS_CODE` — 4-digit login code
- `COOKIE_SECRET` — 32+ character string for JWT HMAC-SHA256 signing

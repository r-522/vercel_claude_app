# Claude AI Chat App

A Next.js 16 + React 19 streaming chat application powered by the Anthropic API, with GitHub integration for code editing and management.

![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black)
![React](https://img.shields.io/badge/React-19.2.7-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### Chat Mode
- **Multi-model support**: Opus 4.6, Sonnet 4.6, Haiku 4.5
- **Extended thinking**: Enable reasoning blocks for complex problems
- **Effort levels**: 5 configurable effort levels (Low → Max) with dynamic budget tokens
- **Image attachments**: Paste or upload images for visual analysis
- **Dark mode**: System-aware dark/light theme toggle
- **Markdown rendering**: Full Markdown support with syntax highlighting

### Code Mode (GitHub Integration)
- **GitHub OAuth**: Secure authentication and authorization
- **Repository browser**: Browse your repositories and select branches
- **File explorer**: Navigate and select context files
- **Code chat**: Interact with Claude using repo context
- **Change tracking**: Review and stage file modifications
- **Direct push**: Create branches and push changes back to GitHub

### Core Architecture
- **Authentication**: 4-digit access code + JWT cookies (HTTP-only, session-limited)
- **Rate limiting**: IP-based rate limiting with timing-attack mitigation
- **Streaming**: Real-time streaming responses from the Anthropic API
- **Type safety**: Full TypeScript strict mode
- **Deployment**: Vercel serverless (Node.js runtime)

## Quick Start

### Prerequisites
- Node.js 22.13.1+ (managed via fnm)
- Anthropic API key
- (Optional) GitHub OAuth credentials for Code mode

### Installation

```bash
# Clone the repository
git clone https://github.com/r-522/vercel_claude_app.git
cd vercel_claude_app

# Copy environment template
cp .env.local.example .env.local

# Fill in your credentials
# - ANTHROPIC_API_KEY: from console.anthropic.com
# - ACCESS_CODE: 4-digit code for login
# - COOKIE_SECRET: 32+ character random string
# - GITHUB_CLIENT_ID/SECRET: (optional, for Code mode)
```

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# http://localhost:3000
```

### Type Checking & Linting

```bash
npm run type-check  # TypeScript validation
npm run lint        # ESLint validation
npm run build       # Production build
```

## Configuration

### Models

| Model | Display | Family | Thinking |
|-------|---------|--------|----------|
| `claude-opus-4-6` | Opus 4.6 | opus | ✅ Yes |
| `claude-sonnet-4-6` | Sonnet 4.6 | sonnet | ✅ Yes |
| `claude-haiku-4-5-20251001` | Haiku 4.5 | haiku | ❌ No |

### Effort Levels

| Level | Label | Budget Tokens | Temperature |
|-------|-------|---------------|-------------|
| `low` | 低 | 1,024 | 1.0 |
| `medium` | 中 | 3,000 | 0.85 |
| `high` | 高 | 6,000 | 0.7 |
| `xhigh` | 超高 | 12,000 | 0.4 |
| `max` | 最大 | 24,000 | 0.1 |

## Architecture

### Directory Structure

```
src/
  app/
    api/
      chat/              # Chat streaming endpoint
      code/              # Code chat with repo context
      auth/              # Authentication (verify, logout)
      github/            # GitHub OAuth & API routes
    auth/                # Login page
    page.tsx             # Protected chat/code interface
    layout.tsx           # Root layout
  components/
    chat/                # Chat UI components
    code/                # Code/GitHub UI components
    layout/              # Navigation
  hooks/
    useDarkMode.ts       # Dark mode state management
    useImageAttachments.ts # Image upload lifecycle
    useGitHub.ts         # GitHub API wrapper
  lib/
    constants.ts         # Models, effort levels, prompts
    auth/                # JWT & rate limiting
    github/              # GitHub client & types
```

### Key Technologies

- **Framework**: Next.js 16 with App Router
- **UI**: React 19 with Tailwind CSS
- **API**: Anthropic SDK with streaming support
- **Auth**: José (JWT HS256)
- **GitHub**: Official GitHub API + OAuth 2.0
- **Markdown**: react-markdown + remark-gfm + Prism

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API key from console.anthropic.com |
| `ACCESS_CODE` | ✅ | 4-digit numeric code for login |
| `COOKIE_SECRET` | ✅ | 32+ character random string for JWT signing |
| `GITHUB_CLIENT_ID` | ❌ | GitHub OAuth App client ID (for Code mode) |
| `GITHUB_CLIENT_SECRET` | ❌ | GitHub OAuth App client secret (for Code mode) |

## Security

- **Rate limiting**: IP-based limiting (10 attempts per 15 minutes)
- **JWT authentication**: HTTP-only cookies with SameSite=Lax
- **Session-only tokens**: GitHub tokens cleared on browser close
- **Server-side validation**: Model IDs & effort levels validated server-side
- **HTTPS enforcement**: Secure cookies in production
- **No persistence**: No database, no localStorage — sessions are ephemeral

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

```bash
# Manual deploy
vercel deploy --prod
```

### Development Mode

```bash
npm run dev
# Server runs on http://localhost:3000
```

## Usage

### Chat Mode
1. Login with 4-digit access code
2. Select a model (Opus, Sonnet, or Haiku)
3. Choose effort level (Low → Max)
4. (Optional) Attach images
5. Chat naturally with Claude
6. Toggle extended thinking for complex problems

### Code Mode
1. Connect GitHub account via OAuth
2. Select a repository and branch
3. Browse files and add context
4. Chat with Claude about your code
5. Review proposed changes
6. Push changes to a new branch

## Development Workflow

See [CLAUDE.md](./CLAUDE.md) for detailed:
- Architecture & patterns
- Coding standards
- Development workflow
- Debugging guide
- Security rules
- Release checklist

## License

MIT

## Support

For issues, feature requests, or feedback:
- GitHub: https://github.com/r-522/vercel_claude_app
- Anthropic API docs: https://docs.anthropic.com
- Claude Code guide: https://claude.com/claude-code

---

Built with [Claude Code](https://claude.com/claude-code) 🚀

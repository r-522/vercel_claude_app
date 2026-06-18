# Claude AI Chat App

Next.js 16 + React 19 チャットアプリ。Anthropic API を使用。Vercel にデプロイ。日本語 UI。

## Node.js セットアップ

このプロジェクトは **fnm** で Node.js バージョンを管理している。デフォルトシェルの PATH に node が入っていないため、PowerShell でコマンドを実行する際は以下のプレフィックスを付ける：

```powershell
$nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
$env:Path = "$nodePath;$env:Path"
Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
```

その後 `& "$nodePath\npm.cmd" run <script>` で npm スクリプトを実行する。

## npm スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | Next.js 開発サーバー起動 (http://localhost:3000) |
| `npm run build` | 本番ビルド |
| `npm run type-check` | TypeScript チェック (`tsc --noEmit`) |
| `npm run lint` | ESLint (`src/` 対象) |

## 環境変数

`.env.local.example` を `.env.local` にコピーして設定する：

- `ANTHROPIC_API_KEY` — Anthropic API キー
- `ACCESS_CODE` — ログインフォームの4桁アクセスコード
- `COOKIE_SECRET` — 32文字以上、JWT 署名に使用

## ディレクトリ構成

```
src/
  app/
    api/chat/route.ts        # ストリーミングチャット API (Node.js runtime)
    api/auth/verify/route.ts # ログイン検証
    api/auth/logout/route.ts # ログアウト
    auth/page.tsx            # ログインページ
    page.tsx                 # ホーム（認証必須）
  components/
    chat/                    # チャット UI コンポーネント群
    ui/LoadingDots.tsx       # 共通 UI プリミティブ
  hooks/
    useDarkMode.ts           # ダークモード状態 + MutationObserver
    useImageAttachments.ts   # 画像添付の状態管理 + Blob URL 管理
  lib/
    constants.ts             # MODELS / EFFORT_LEVELS / SYSTEM_PROMPT / 認証定数
    auth/cookies.ts          # JWT 署名・検証・Cookie ヘッダー生成
    auth/rate-limiter.ts     # インメモリレート制限
  proxy.ts                   # Next.js Middleware — 全非認証ルートに JWT ゲート
```

## 重要なパターン・制約

### ダークモード
`useDarkMode()` フックを使うこと。ローカルの `isDark` state を直接書かない。フックは MutationObserver で DOM クラスの変更を監視し、複数コンポーネント間の同期を担保する。

### チャットトランスポート
`ChatInterface` の `useMemo` で一度だけ生成する。`modelRef` / `effortRef` / `thinkingRef` を使って送信時に最新状態を読む設計。`// eslint-disable-next-line react-hooks/exhaustive-deps` は意図的なもの（トランスポートを再生成すると `useChat` がリセットされるため）。

### 画像添付
`useImageAttachments()` フックを使うこと。Blob URL はフック内でアンマウント時に自動解放される。

### MarkdownRenderer
`REMARK_PLUGINS` と `MD_COMPONENTS` はモジュールスコープの定数として定義されている。コンポーネント内に移動しないこと（毎レンダリングで再生成されてしまう）。

### モデル追加手順
1. `src/lib/constants.ts` の `MODELS` 配列にエントリを追加する
2. `ALLOWED_MODEL_IDS` は自動生成されるため変更不要
3. デフォルトにする場合は `DEFAULT_MODEL_ID` も更新する

### エフォートレベルの仕様
- `budgetTokens` — 拡張思考 (extended thinking) 有効時に使用
- `temperature` — 思考無効時に使用
- Haiku はサポート外のため思考機能は無効化される

## セキュリティ注意事項

- レート制限はインメモリ — Vercel の関数インスタンスをまたいで持続しない
- `ACCESS_CODE` は `process.env` からのみ読む — クライアントには絶対に露出させない
- JWT は HS256 + `COOKIE_SECRET`。Cookie は HttpOnly + SameSite=Lax、本番は Secure 付き
- サーバー側でモデル ID とエフォート ID を検証済み — クライアントの入力を信用しない

## コーディング規約

- コメントは WHY が自明でない場合のみ書く
- `'use client'` はファイル先頭に明示する
- 型は `import type` で分離する
- インライン化できる一行ラッパー関数は作らない
- コンポーネント外に定義できる安定値はコンポーネント外に置く

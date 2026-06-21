# Claude AI チャットアプリ

Anthropic APIを使用したNext.js 16 + React 19ストリーミングチャットアプリケーション。GitHub統合でコード編集・管理も可能。

![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black)
![React](https://img.shields.io/badge/React-19.2.7-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-blue)
![ライセンス](https://img.shields.io/badge/License-MIT-green)

## 🎯 主な機能

### チャットモード
- **マルチモデル対応**: Opus 4.6、Sonnet 4.6、Haiku 4.5
- **拡張思考**: 複雑な問題に対するリーズニングブロック
- **努力レベル**: 5段階調整可能（低 → 最大）でダイナミックなトークン割当
- **画像添付**: 画像をペースト・アップロードして視覚分析
- **ダークモード**: システム連動の明暗テーマ切り替え
- **Markdown対応**: 完全なMarkdown + シンタックスハイライト

### コードモード（GitHub統合）
- **GitHub OAuth認証**: セキュアな認証と権限管理
- **リポジトリブラウザ**: リポジトリとブランチを選択
- **ファイルエクスプローラー**: ファイルを参照してコンテキスト追加
- **コードチャット**: リポジトリコンテキストを使用してClaudeと対話
- **変更追跡**: ファイル修正をレビュー・ステージング
- **直接プッシュ**: ブランチを作成してGitHubに変更を反映

### タスクモード（スケジュール実行）
- **スケジュールタスク**: AIプロンプトを毎日 3:00 AM (JST) に自動実行
- **GitHub連携**: タスク定義と実行結果を選択したリポジトリに保存
- **UIでタスク管理**: 追加・編集・削除・即時実行をアプリから操作
- **Vercel Cron**: `vercel.json` でスケジュール設定済み
- **レート制限クリーンアップ**: 毎時の Cron でメモリリークを防止

### コア機能
- **認証**: 4桁アクセスコード + JWTクッキー（HTTP-only、セッション限定）
- **レート制限**: IP単位のレート制限（タイミング攻撃対策）
- **ストリーミング**: Anthropic APIからのリアルタイムストリーミング応答
- **型安全性**: TypeScript strict mode完全対応
- **デプロイ**: Vercelサーバーレス（Node.js runtime）

## 🚀 クイックスタート

### 前提条件
- Node.js 22.13.1+ (fnmで管理)
- Anthropic APIキー
- （オプション）GitHub OAuthクレデンシャル（コードモード用）

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/r-522/vercel_claude_app.git
cd vercel_claude_app

# 環境テンプレートをコピー
cp .env.local.example .env.local

# クレデンシャルを設定
# - ANTHROPIC_API_KEY: console.anthropic.comから取得
# - ACCESS_CODE: 4桁のログインコード
# - COOKIE_SECRET: 32文字以上のランダム文字列
# - GITHUB_CLIENT_ID/SECRET: (オプション、コードモード用)
```

### 開発

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev

# ブラウザで開く
# http://localhost:3000
```

### 型チェック・リント

```bash
npm run type-check  # TypeScript検証
npm run lint        # ESLint検証
npm run build       # 本番ビルド
```

## ⚙️ 設定

### 利用可能なモデル

| モデル | 表示名 | ファミリー | 思考 |
|--------|--------|-----------|------|
| `claude-opus-4-6` | Opus 4.6 | opus | ✅ 対応 |
| `claude-sonnet-4-6` | Sonnet 4.6 | sonnet | ✅ 対応 |
| `claude-haiku-4-5-20251001` | Haiku 4.5 | haiku | ❌ 非対応 |

### 努力レベル

| レベル | 表示 | 思考トークン | 温度 |
|--------|------|-------------|------|
| `low` | 低 | 1,024 | 1.0 |
| `medium` | 中 | 3,000 | 0.85 |
| `high` | 高 | 6,000 | 0.7 |
| `xhigh` | 超高 | 12,000 | 0.4 |
| `max` | 最大 | 24,000 | 0.1 |

## 📁 アーキテクチャ

### ディレクトリ構成

```
src/
  app/
    api/
      chat/              # チャットストリーミングエンドポイント
      code/              # コンテキスト付きコードチャット
      auth/              # 認証（検証、ログアウト）
      github/            # GitHub OAuth & APIルート
    auth/                # ログインページ
    page.tsx             # 保護されたチャット/コードインターフェース
    layout.tsx           # ルートレイアウト
  components/
    chat/                # チャットUIコンポーネント
    code/                # コード/GitHub UIコンポーネント
    layout/              # ナビゲーション
  hooks/
    useDarkMode.ts       # ダークモード状態管理
    useImageAttachments.ts # 画像アップロードライフサイクル
    useGitHub.ts         # GitHub APIラッパー
  lib/
    constants.ts         # モデル、努力レベル、プロンプト
    auth/                # JWT & レート制限
    github/              # GitHubクライアント & 型定義
```

### 主要技術

- **フレームワーク**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS
- **AI SDK**: Anthropic SDK (ストリーミング対応)
- **認証**: José (JWT HS256)
- **GitHub**: 公式GitHub API + OAuth 2.0
- **Markdown**: react-markdown + remark-gfm + Prism

## 🔐 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `ANTHROPIC_API_KEY` | ✅ | console.anthropic.comから取得するAPIキー |
| `ACCESS_CODE` | ✅ | 4桁の数値ログインコード |
| `COOKIE_SECRET` | ✅ | JWT署名用の32文字以上のランダム文字列 |
| `GITHUB_CLIENT_ID` | ❌ | GitHub OAuthアプリクライアントID（コードモード用） |
| `GITHUB_CLIENT_SECRET` | ❌ | GitHub OAuthアプリクライアントシークレット（コードモード用） |
| `CRON_SECRET` | ❌ | Cron エンドポイント保護用のランダム文字列（タスクモード用） |
| `GITHUB_PAT` | ❌ | GitHub Personal Access Token（タスクモード Cron 用） |
| `TASKS_REPO` | ❌ | タスクを保存するリポジトリ `owner/repo`（タスクモード用） |
| `TASKS_BRANCH` | ❌ | タスクリポジトリのブランチ（デフォルト: `main`） |

## 🔒 セキュリティ

- **レート制限**: IP単位のレート制限（15分間10試行まで）
- **JWT認証**: HTTP-onlyクッキー + SameSite=Lax
- **セッション限定**: ブラウザを閉じるとGitHubトークンは削除
- **サーバーサイド検証**: モデルIDと努力レベルをサーバーで検証
- **HTTPS強制**: 本番環境ではSecureフラグを設定
- **永続化なし**: データベースなし、localStorage未使用 — セッションのみ

## 📦 デプロイ

### Vercel（推奨）

1. GitHubにプッシュ
2. Vercelでリポジトリを接続
3. Vercelダッシュボードで環境変数を設定
4. プッシュ時に自動デプロイ

```bash
# 手動デプロイ
vercel deploy --prod
```

### ローカル開発

```bash
npm run dev
# サーバーが http://localhost:3000 で起動
```

## 💬 使用方法

### チャットモード
1. 4桁のアクセスコードでログイン
2. モデルを選択（Opus、Sonnet、Haiku）
3. 努力レベルを選択（低 → 最大）
4. （オプション）画像を添付
5. Claudeと自然に会話
6. 複雑な問題は拡張思考を有効化

### コードモード
1. GitHubアカウントでOAuth接続
2. リポジトリとブランチを選択
3. ファイルを参照してコンテキスト追加
4. Claudeとコードについて対話
5. 提案された変更をレビュー
6. 新しいブランチにプッシュ

### タスクモード
1. **Tasks** タブをクリック
2. GitHubに接続（未接続の場合）
3. タスクを保存するリポジトリとブランチを選択
4. **「+ タスクを追加」** でプロンプトを登録
5. トグルで有効/無効を切り替え
6. ▶ ボタンで即時テスト実行
7. 毎日 3:00 AM (JST) に Cron が自動実行 → 結果が GitHub に push される

詳細は [docs/tasks-feature.md](./docs/tasks-feature.md) を参照。

## 📚 開発ガイド

詳細は [CLAUDE.md](./CLAUDE.md) を参照：
- アーキテクチャ & パターン
- コーディング規約
- 開発ワークフロー
- デバッグガイド
- セキュリティルール
- リリースチェックリスト

## 📄 ライセンス

MIT

## 💬 サポート

問題報告、機能リクエスト、フィードバック：
- GitHub: https://github.com/r-522/vercel_claude_app
- Anthropic APIドキュメント: https://docs.anthropic.com
- Claude Code ガイド: https://claude.com/claude-code

---

[Claude Code](https://claude.com/claude-code) で構築 🚀

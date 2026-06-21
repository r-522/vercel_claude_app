# タスク機能 — 実装仕様書

スケジュールタスク機能の設計・実装ドキュメント。

---

## 概要

**タスクモード** は、AIプロンプトを定期的に自動実行し、結果を指定した GitHub リポジトリに保存する機能です。

- **UI からタスクを管理**: 追加・編集・削除・即時実行
- **Vercel Cron で自動実行**: 毎日 3:00 AM JST（18:00 UTC）
- **結果を GitHub に保存**: 指定リポジトリに Markdown ファイルとして push
- **レート制限クリーンアップ**: 毎時 Cron でメモリクリーンアップ

---

## アーキテクチャ

### 新規ファイル一覧

```
src/
  lib/
    tasks/
      types.ts                    # 型定義 (ScheduledTask, TasksFile, TasksSettings)

  app/
    api/
      tasks/
        route.ts                  # GET（タスク一覧取得） / POST（タスク追加）
        [id]/
          route.ts                # PUT（タスク更新） / DELETE（タスク削除）
        config/
          route.ts                # GET/POST タスク設定（リポジトリ選択）クッキー管理
        run/
          [id]/
            route.ts              # POST タスクを即時実行（UIから呼び出し）
      cron/
        run-tasks/
          route.ts                # POST Vercel Cron エンドポイント（全タスク実行）
        cleanup/
          route.ts                # POST Vercel Cron エンドポイント（レート制限クリーンアップ）

  components/
    tasks/
      TasksInterface.tsx          # メインコンテナ（状態管理・データフロー）
      TaskSetup.tsx               # 初回設定画面（リポジトリ選択）
      TaskList.tsx                # タスク一覧（トグル・編集・削除・即時実行）
      TaskForm.tsx                # タスク追加・編集フォーム（ダイアログ）

vercel.json                       # Vercel Cron スケジュール設定
```

### 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/lib/constants.ts` | `TASKS_COOKIE_NAME`, `TASKS_FILE_PATH` 定数追加 |
| `src/lib/github/client.ts` | `getFileWithSha()`, `upsertFile()` 関数追加 |
| `src/proxy.ts` | `/api/cron` を JWT 認証除外パスに追加 |
| `src/components/layout/TabNavigation.tsx` | `'tasks'` タブ追加 |
| `src/app/page.tsx` | `TasksInterface` のレンダリング追加 |
| `.env.local.example` | Cron 関連環境変数を追記 |

---

## データモデル

タスクは選択した GitHub リポジトリの `.claude-tasks/tasks.json` に保存されます。

```typescript
// 1タスクの定義
interface ScheduledTask {
  id: string          // "task_<timestamp>"
  name: string        // タスク名（例: "毎日の天気レポート"）
  prompt: string      // AI に渡すプロンプト
  enabled: boolean    // true = 自動実行対象
  outputPath: string  // 結果の保存先ディレクトリ（例: "results"）
  createdAt: string   // ISO 8601 日時文字列
  lastRunAt?: string  // 最終実行日時（optional）
}

// tasks.json の全体構造
interface TasksFile {
  tasks: ScheduledTask[]
  updatedAt: string
}
```

**結果ファイルのパス**: `<outputPath>/<YYYY-MM-DD>/<task-id>.md`

例: `results/2026-06-22/task_1719043200000.md`

---

## セットアップ

### 1. 環境変数

Vercel ダッシュボードまたは `.env.local` に以下を設定します。

| 変数 | 必須 | 説明 |
|---|---|---|
| `CRON_SECRET` | Cron 使用時 | Cron エンドポイントを保護するランダム文字列 |
| `GITHUB_PAT` | Cron 使用時 | リポジトリ read/write 権限付き Personal Access Token |
| `TASKS_REPO` | Cron 使用時 | タスクを保存するリポジトリ（例: `username/my-notes`） |
| `TASKS_BRANCH` | 任意 | 使用するブランチ（デフォルト: `main`） |

> **注意**: Vercel Cron はユーザーセッションを持たないため、`GITHUB_PAT` が必須です。UI からの操作はOAuth トークンを使用するため PAT 不要です。

### 2. GitHub Personal Access Token の作成

1. https://github.com/settings/tokens にアクセス
2. **Generate new token (classic)** をクリック
3. スコープ: `repo`（フルアクセス）を選択
4. 生成されたトークンを `GITHUB_PAT` に設定

### 3. Vercel Cron の確認

`vercel.json` が以下の設定でデプロイされます：

```json
{
  "crons": [
    {
      "path": "/api/cron/run-tasks",
      "schedule": "0 18 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 * * * *"
    }
  ]
}
```

| エンドポイント | スケジュール | 目的 |
|---|---|---|
| `/api/cron/run-tasks` | 毎日 18:00 UTC (3:00 AM JST) | 有効なタスクを全実行 |
| `/api/cron/cleanup` | 毎時 0分 | レート制限の期限切れエントリを削除 |

---

## 使い方

### 初回設定

1. アプリにログイン
2. **Tasks** タブをクリック
3. GitHub 未接続の場合 → 「GitHubに接続」ボタンで OAuth 認証
4. **設定画面**でタスクを保存するリポジトリとブランチを選択
5. 「設定を保存」をクリック（ブラウザの Cookie に保存）

### タスクの追加

1. **「+ タスクを追加」** ボタンをクリック
2. フォームに入力：
   - **タスク名**: 識別用の名前（例: `毎日の天気レポート`）
   - **プロンプト**: Claude に渡す指示（例: `東京の今日の天気を教えてください。`）
   - **結果の保存先パス**: GitHub リポジトリ内のディレクトリ（デフォルト: `results`）
3. 「保存」をクリック → `.claude-tasks/tasks.json` が自動更新されます

### タスクの操作

| 操作 | 説明 |
|---|---|
| トグルスイッチ | 有効/無効を切り替え（無効タスクは Cron でスキップ） |
| ▶ ボタン | 即時実行（OAuth トークンを使用、スケジュール外でも実行可能） |
| ✏ ボタン | 名前・プロンプト・保存先を編集 |
| 🗑 ボタン | タスクを削除 |

---

## API ルート仕様

### タスク管理（認証必須: JWT Cookie + GitHub OAuth + タスク設定 Cookie）

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/tasks` | タスク一覧を取得（GitHub から読み込み） |
| `POST` | `/api/tasks` | 新しいタスクを追加 |
| `PUT` | `/api/tasks/:id` | タスクを更新（部分更新可） |
| `DELETE` | `/api/tasks/:id` | タスクを削除 |
| `GET` | `/api/tasks/config` | タスク設定（リポジトリ情報）を取得 |
| `POST` | `/api/tasks/config` | タスク設定を保存（Cookie に書き込み） |
| `POST` | `/api/tasks/run/:id` | タスクを即時実行 |

### Cron（認証: `Authorization: Bearer <CRON_SECRET>` ヘッダー）

| メソッド | パス | 説明 |
|---|---|---|
| `POST` | `/api/cron/run-tasks` | 有効なタスクを全実行し結果を GitHub に push |
| `POST` | `/api/cron/cleanup` | レート制限の期限切れエントリを削除 |

---

## GitHub クライアントの拡張

`src/lib/github/client.ts` に以下の関数を追加しました。

### `getFileWithSha(token, repo, filePath, ref)`

ファイルの内容と SHA を取得します（更新時に SHA が必要なため）。

```typescript
// ファイルが存在しない場合は null を返す（404 は例外にしない）
const result = await getFileWithSha(token, 'owner/repo', '.claude-tasks/tasks.json', 'main')
// => { content: "{ ... }", sha: "abc123..." } | null
```

### `upsertFile(token, repo, filePath, content, message, branch, sha?)`

ファイルを作成または更新します。GitHub Contents API の PUT を使用します。

```typescript
// SHA なし → 新規作成
await upsertFile(token, 'owner/repo', 'path/file.md', content, 'chore: update', 'main')

// SHA あり → 既存ファイルを上書き
await upsertFile(token, 'owner/repo', 'path/file.md', content, 'chore: update', 'main', existingSha)
```

---

## セキュリティ設計

### Cron エンドポイントの保護

Vercel Cron は JWT Cookie を持たないため、JWT ミドルウェア (`proxy.ts`) から除外し、代わりに各ハンドラー内で `CRON_SECRET` を検証します。

```typescript
// proxy.ts の PUBLIC_PATHS
const PUBLIC_PATHS = ['/auth', '/api/auth/verify', '/api/auth/logout', '/api/cron']
```

```typescript
// cron ハンドラー内の検証
const cronSecret = process.env.CRON_SECRET
if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
  return new Response('Unauthorized', { status: 401 })
}
```

### タスク設定 Cookie

タスクのリポジトリ設定は HTTP-Only Cookie (`tasks_config`) に Base64 エンコードした JSON で保存します。機密情報（トークン等）は含まないため暗号化不要です。

```
Cookie: tasks_config=eyJyZXBvIjoib3duZXIvcmVwbyIsImJyYW5jaCI6Im1haW4ifQ==
```

### Cron の GitHub 認証

Cron ジョブはユーザーの OAuth トークンにアクセスできないため、別途 `GITHUB_PAT`（環境変数）を使用します。UI 操作では引き続きユーザーの OAuth トークンを使用します。

---

## トラブルシューティング

| 症状 | 原因 | 解決策 |
|---|---|---|
| Tasks タブで「GitHub接続が必要」と表示 | GitHub OAuth 未設定 | `GITHUB_CLIENT_ID/SECRET` を設定してOAuth接続 |
| タスク設定画面が繰り返し表示される | `tasks_config` Cookie が設定されていない | ブラウザで設定を保存し直す |
| Cron が 401 を返す | `CRON_SECRET` が一致しない | Vercel の環境変数を確認 |
| Cron が 503 を返す | `GITHUB_PAT` または `TASKS_REPO` が未設定 | Vercel の環境変数を設定 |
| タスク実行が失敗する | GitHub への push 権限不足 | `GITHUB_PAT` に `repo` スコープを付与 |
| 結果ファイルが作成されない | `outputPath` の typo またはリポジトリが存在しない | タスクの設定を確認 |

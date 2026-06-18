コード変更をレビューする。$ARGUMENTS にレビュー対象ファイルまたは変更内容を指定する。

## 手順

1. **変更ファイルの読み込み**
   対象ファイルをすべて読む。$ARGUMENTS が未指定の場合は最近変更されたファイルを特定して読む。

2. **セキュリティ事前チェック（自動 grep）**
   以下を実行して環境変数がクライアントコードに漏れていないか確認する：

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   Select-String -Path "src\components\*","src\hooks\*" -Pattern "ACCESS_CODE|COOKIE_SECRET|ANTHROPIC_API_KEY" -Recurse 2>&1
   ```

   ヒットがあれば即座に **CRITICAL** として報告し、修正を求める。

3. **コードレビュースキルの適用**
   code-review スキルを適用し、以下の観点でレビューする：
   - TypeScript 正確性（strict モード、型アサーション、import type）
   - React パターン準拠（`useDarkMode`、`useImageAttachments`、transport useMemo）
   - セキュリティ（secrets、auth、cookie 属性）
   - パフォーマンス（安定参照、Blob URL リーク、MutationObserver 解除）

4. **レビューチェックリストの適用**
   checklists/review.md を読み、各項目を確認する。

5. **結果出力**
   以下の形式で報告する：
   - **CRITICAL** — 即時修正必須（セキュリティ、データ破壊リスク）
   - **ERROR** — 修正必須（型エラー、バグ）
   - **WARNING** — 推奨修正（規約違反、パフォーマンス）
   - **INFO** — 任意改善（可読性、一貫性）

   各指摘は `ファイルパス:行番号 — 説明` の形式で示す。

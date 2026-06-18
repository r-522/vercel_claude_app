新機能を実装する。$ARGUMENTS に実装内容を指定する。

## 手順

1. **コンテキスト読み込み**
   CLAUDE.md と context/architecture.md を読み、プロジェクト全体の構造・制約を把握する。

2. **計画立案**
   Planner スキルを適用し、実装アプローチを決定する。不明点があれば先に確認する。

3. **影響ファイルの特定**
   実装に関係するファイルを列挙する。新規ファイルが必要な場合はパスを決定する。

4. **実装**
   以下のルールを参照しながら実装する：
   - rules/react.md — React パターン（`useDarkMode` 必須、`useImageAttachments` Blob URL、transport useMemo）
   - rules/typescript.md — TypeScript 規約（strict、import type、型アサーション禁止）
   - rules/security.md — セキュリティ（ACCESS_CODE/COOKIE_SECRET/ANTHROPIC_API_KEY をクライアントコードに絶対含めない）

   **必須制約（コーディング規約より）：**
   - `'use client'` はクライアントコンポーネントに明示
   - `REMARK_PLUGINS` / `MD_COMPONENTS` はモジュールレベルで定義（コンポーネント内に置かない）
   - transport の `useMemo` は deps ESLint disable が意図的
   - ダークモード状態は `useDarkMode` フックのみで管理（ローカル state 禁止）
   - 環境変数 `ACCESS_CODE` は `process.env` のみ、`constants.ts` や クライアントコードに含めない

5. **型チェック**
   以下を実行する：

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   & "$nodePath\npm.cmd" run type-check 2>&1
   ```

   エラーがあれば修正してから次へ進む。

6. **Lint チェック**
   以下を実行する：

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   & "$nodePath\npm.cmd" run lint 2>&1
   ```

   エラーがあれば修正する（transport useMemo の ESLint disable は例外）。

7. **完了報告**
   実装したファイル一覧（絶対パス）、変更の概要、型・lint の結果を報告する。

型チェック（現在のスモークテスト）を実行し、テスト計画を作成する。$ARGUMENTS にフォーカスする領域を指定する（省略時は全体）。

## 手順

1. **型チェックの実行**

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   & "$nodePath\npm.cmd" run type-check 2>&1
   ```

   エラーがあれば `ファイル:行番号 — エラー内容` の形式で列挙する。

2. **Lint の実行**

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   & "$nodePath\npm.cmd" run lint 2>&1
   ```

3. **未テストパスの特定**
   以下の領域でテストが不足しているパスを特定する：
   - `src/app/api/chat/route.ts` — streaming、エラーハンドリング、モデル ID バリデーション
   - `src/app/api/auth/verify/route.ts` — レートリミット、コード比較、JWT 発行
   - `src/lib/auth/rate-limiter.ts` — IP ごとのカウント、リセット
   - `src/lib/auth/cookies.ts` — JWT 署名・検証、cookie ヘッダー生成
   - `src/proxy.ts` — 認証済みルートの保護、/auth へのリダイレクト
   - hooks: `useDarkMode`、`useImageAttachments` — ライフサイクル
   - `src/components/chat/MarkdownRenderer.tsx` — XSS、GFM レンダリング

4. **テスト計画の出力**
   templates/test-plan.md を読み、そのテンプレートに従ってテスト計画を作成する。
   テストフレームワークは Vitest + React Testing Library を推奨する（現在未導入のため導入手順も示す）。

   テスト計画には以下を含める：
   - テスト対象とテストの種別（unit / integration / e2e）
   - 各テストの入力・期待出力
   - モックが必要な依存（`jose`、`@ai-sdk/anthropic`、`process.env`）
   - 優先度（HIGH / MEDIUM / LOW）

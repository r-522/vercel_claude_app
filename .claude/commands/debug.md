問題をデバッグする。$ARGUMENTS に症状・エラーメッセージ・再現条件を指定する。

## 手順

1. **既知の問題を確認**
   context/common-errors.md を読み、$ARGUMENTS の症状と一致する既知の問題を確認する。
   一致があれば既知の回避策を最初に試みる。

2. **デバッグスキルの適用**
   以下の観点で問題を絞り込む：
   - ブラウザ側エラー vs サーバー側エラーの切り分け
   - クライアントコンポーネント (`'use client'`) vs サーバーコンポーネントの境界
   - Next.js App Router のルーティング / Middleware (`src/proxy.ts`) の影響
   - Vercel Edge/Node.js ランタイムの差異（`api/chat/route.ts` は Node.js ランタイム）

3. **診断ログの追加**
   根本原因が不明な場合は、最小限の診断ログを追加する：
   - サーバーサイド: `console.error` / `console.log`
   - クライアントサイド: ブラウザコンソールへの `console.debug`
   - ログはデバッグ完了後に削除すること（コミット前に確認）

   **禁止事項:** `ACCESS_CODE` / `COOKIE_SECRET` / `ANTHROPIC_API_KEY` の値をログに出力しない。

4. **根本原因の特定**
   `ファイルパス:行番号` 形式で根本原因を示す。以下のよくある原因も確認する：
   - transport が再作成されている（`useMemo` deps の誤り）
   - `useDarkMode` を使わず `isDark` state をローカル管理している
   - `REMARK_PLUGINS` / `MD_COMPONENTS` がコンポーネント内で定義されている（毎レンダー再作成）
   - JWT cookie が Secure フラグなしで本番にデプロイされている
   - レートリミッターが Vercel の複数インスタンス間で状態を共有していない（in-memory の仕様）

5. **調査結果の報告**
   以下を含むレポートを出力する：
   - 症状の再現条件
   - 根本原因（`ファイルパス:行番号`）
   - 推奨される修正方針
   - 修正を適用する場合は `/fix` コマンドを使用する旨を示す

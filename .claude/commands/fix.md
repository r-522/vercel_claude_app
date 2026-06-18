バグを修正する。$ARGUMENTS にバグの内容・症状・再現手順を指定する。

## 手順

1. **既知エラーの確認**
   context/common-errors.md を読み、$ARGUMENTS の症状と一致する既知のバグがないか確認する。
   一致する既知バグがあれば、その解決策を優先的に適用する。

2. **バグ修正スキルの適用**
   根本原因の特定に以下のアプローチを取る：
   - 症状から影響コンポーネント/ファイルを絞り込む
   - 関連ファイルを読んで実際のコードを確認する
   - プロジェクト固有の制約（transport パターン、useDarkMode 必須、Blob URL 管理）を考慮する

3. **根本原因の特定**
   `ファイルパス:行番号` 形式で根本原因を特定し、なぜその原因でバグが起きるかを説明する。

4. **修正の実装**
   修正時に以下を必ず確認する：
   - `useDarkMode` を使わずローカルの `isDark` state に変えていないか
   - transport の `useMemo` を再作成する変更を加えていないか
   - `REMARK_PLUGINS` / `MD_COMPONENTS` をコンポーネント内に移動していないか
   - `ACCESS_CODE` / `COOKIE_SECRET` / `ANTHROPIC_API_KEY` をクライアントコードに漏らしていないか

5. **型チェック + Lint**

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   & "$nodePath\npm.cmd" run type-check 2>&1
   & "$nodePath\npm.cmd" run lint 2>&1
   ```

6. **影響範囲の確認**
   修正によって他の機能が壊れていないか確認する。特に以下を確認する：
   - 認証フロー（`src/proxy.ts`、`src/app/api/auth/`）
   - チャット送信フロー（`ChatInterface.tsx` → `api/chat/route.ts`）
   - ダークモード切り替え（`useDarkMode` フック）

7. **完了報告**
   根本原因、修正内容（`ファイルパス:行番号`）、型・lint の結果を報告する。

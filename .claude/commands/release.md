リリースを準備・実行する。

## 手順

1. **リリースチェックリストの実行**
   checklists/release.md を読み、各項目を順番に確認する。

2. **本番ビルドの実行**

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   & "$nodePath\npm.cmd" run build 2>&1
   ```

   ビルドエラーがあれば停止して報告する。

3. **型チェックの実行**

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   & "$nodePath\npm.cmd" run type-check 2>&1
   ```

   型エラーがあれば停止して報告する。

4. **Vercel 環境変数の確認**
   以下の環境変数が Vercel プロジェクト設定で設定されているか確認するよう促す（自動確認不可）：
   - `ANTHROPIC_API_KEY` — Anthropic API キー
   - `ACCESS_CODE` — 4 桁のアクセスコード
   - `COOKIE_SECRET` — 32 文字以上の JWT 署名シークレット

   未設定の場合は Vercel ダッシュボード → Settings → Environment Variables で設定する。

5. **デプロイの実行**
   Vercel CLI またはダッシュボード経由でデプロイを実行する。
   Vercel CLI が利用可能な場合：

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   & "$nodePath\npx.cmd" vercel --prod 2>&1
   ```

6. **スモークテストの実施**
   デプロイ後に以下を手動で確認するよう促す：
   - `/auth` ページが表示される
   - 正しいアクセスコードでログインできる
   - チャット画面が表示され、メッセージを送信できる
   - ダークモード切り替えが機能する
   - ログアウトが機能する

7. **完了報告**
   ビルド結果、型チェック結果、デプロイ URL、スモークテスト確認項目を報告する。

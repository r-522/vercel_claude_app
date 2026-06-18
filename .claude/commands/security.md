セキュリティレビューを実施する。$ARGUMENTS に対象範囲を指定する（省略時は全体）。

## 手順

1. **セキュリティスキルの適用**
   security-review スキルを適用し、包括的なセキュリティ評価を開始する。

2. **環境変数のリーク検査（CRITICAL）**
   以下を実行する：

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   Select-String -Path "src\components\*","src\hooks\*" -Pattern "ACCESS_CODE|COOKIE_SECRET|ANTHROPIC_API_KEY" -Recurse 2>&1
   ```

   **ヒットがあれば即座に CRITICAL として報告する。** クライアントバンドルに含まれるため、デプロイ済みの場合はシークレットのローテーションが必要。

   `NEXT_PUBLIC_` プレフィックス付き変数のセンシティブな値も同様に確認する：

   ```powershell
   Select-String -Path "src\" -Pattern "NEXT_PUBLIC_" -Recurse 2>&1
   ```

3. **API ルートの認証検査**
   以下の各 API ルートに認証チェックが実装されているか確認する：
   - `src/app/api/chat/route.ts` — `src/proxy.ts` の Middleware で保護されているか
   - `src/app/api/auth/verify/route.ts` — レートリミット → コード比較の順序が正しいか（逆順は timing attack）
   - `src/app/api/auth/logout/route.ts` — cookie クリアが正しく行われているか

4. **レートリミットの確認**
   `src/lib/auth/rate-limiter.ts` を読み、以下を確認する：
   - `checkRateLimit(ip)` がコード比較より先に呼ばれているか（`src/app/api/auth/verify/route.ts`）
   - IP アドレスの取得方法が適切か（`X-Forwarded-For` の扱い）
   - in-memory であるため Vercel 複数インスタンス間で共有されないことを把握しているか（仕様として許容）

5. **cookie 属性の確認**
   `src/lib/auth/cookies.ts` を読み、以下を確認する：
   - `HttpOnly: true` — JavaScript からアクセス不可
   - `SameSite: Lax` — CSRF 対策
   - `Secure: true`（本番環境のみ）— HTTPS 強制
   - `Path: /` — 全ルートに適用
   - JWT アルゴリズムが `HS256` であるか
   - `COOKIE_SECRET` が 32 文字以上であることを実行時に検証しているか

6. **セキュリティチェックリストの実行**
   checklists/security.md を読み、各項目を確認する。

7. **結果報告**
   以下の形式で報告する：
   - **CRITICAL** — 即時修正必須（シークレットリーク、認証バイパス）
   - **HIGH** — 早急に修正（セキュリティ設定ミス）
   - **MEDIUM** — 計画的に修正（ベストプラクティス違反）
   - **LOW** — 改善推奨（防御的プログラミング）
   - **PASS** — 問題なし

   各指摘は `ファイルパス:行番号 — 説明` の形式で示す。

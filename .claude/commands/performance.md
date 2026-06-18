パフォーマンス監査を実施する。$ARGUMENTS に対象範囲を指定する（省略時は全体）。

## 手順

1. **パフォーマンススキルの適用**
   パフォーマンス観点での静的分析を開始する。

2. **安定参照の検査（レンダーごとの再作成）**
   以下を確認する：

   `src/components/chat/MarkdownRenderer.tsx` を読み、`REMARK_PLUGINS` と `MD_COMPONENTS` がモジュールレベル（コンポーネント外）で定義されているか確認する。
   コンポーネント内・フック内に定義されている場合は毎レンダーで新しいオブジェクトが生成され、`ReactMarkdown` が不要に再レンダーされる。

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   Select-String -Path "src\components\chat\MarkdownRenderer.tsx" -Pattern "REMARK_PLUGINS|MD_COMPONENTS" 2>&1
   ```

3. **Blob URL リーク検査**
   `src/hooks/useImageAttachments.ts` を読み、以下を確認する：
   - `URL.createObjectURL` で生成した URL が `useEffect` の cleanup または明示的な `remove`/`clear` で `URL.revokeObjectURL` されているか
   - コンポーネントのアンマウント時に全 Blob URL が解放されるか

4. **MutationObserver の解除確認**
   `src/hooks/useDarkMode.ts` を読み、以下を確認する：
   - `MutationObserver` が `useEffect` の cleanup 関数内で `disconnect()` されているか
   - cleanup がないとコンポーネントのアンマウント後もオブザーバーが動き続けメモリリークになる

5. **バンドルサイズの確認**

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   & "$nodePath\npm.cmd" run build 2>&1
   ```

   ビルド出力のバンドルサイズを記録する。First Load JS が著しく大きい場合（目安: 200 KB 超）は原因を調査する。

6. **パフォーマンスチェックリストの実行**
   checklists/performance.md を読み、各項目を確認する。

7. **結果報告**
   以下の形式で報告する：
   - **CRITICAL** — メモリリークまたはレンダリングクラッシュ（即時修正）
   - **HIGH** — 顕著なパフォーマンス劣化（毎レンダー再作成、リーク）
   - **MEDIUM** — 改善余地あり（不要な再レンダー、大きいバンドル）
   - **LOW** — 微小な改善提案
   - **PASS** — 問題なし

   バンドルサイズのサマリーも合わせて報告する。

コードをリファクタリングする。$ARGUMENTS にリファクタリング対象と目的を指定する。

## 手順

1. **対象ファイルの読み込み**
   $ARGUMENTS で指定されたファイルをすべて読む。依存ファイルがあれば合わせて読む。

2. **型チェックのベースライン確認**
   リファクタリング前に型エラーがないことを確認する：

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   & "$nodePath\npm.cmd" run type-check 2>&1
   ```

   既存の型エラーがある場合は、リファクタリング前にその旨を報告する。

3. **リファクタリングスキルの適用**
   simplify スキルを適用し、以下を維持しながらリファクタリングする：
   - `REMARK_PLUGINS` / `MD_COMPONENTS` はモジュールレベル固定（移動禁止）
   - transport の `useMemo` は deps コメントを保持
   - `useDarkMode` フックは置き換えない
   - Blob URL ライフサイクルは `useImageAttachments` フックで管理

4. **型チェックの再確認**
   リファクタリング後に型エラーが増えていないことを確認する：

   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   & "$nodePath\npm.cmd" run type-check 2>&1
   ```

5. **Lint の確認**
   ```powershell
   $nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
   $env:Path = "$nodePath;$env:Path"
   Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
   & "$nodePath\npm.cmd" run lint 2>&1
   ```

6. **パターン変更の記録**
   新しいパターンを導入した場合は context/patterns.md を更新する。既存パターンを廃止した場合も同様に記録する。

7. **完了報告**
   変更ファイル一覧（絶対パス）、何をどう変えたか、型・lint の結果を報告する。

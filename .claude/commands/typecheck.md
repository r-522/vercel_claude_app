TypeScript の型チェックを実行する。

以下の PowerShell コマンドを実行する（fnm 経由で node を起動）：

```powershell
$nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
$env:Path = "$nodePath;$env:Path"
Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
& "$nodePath\npm.cmd" run type-check 2>&1
```

型エラーがあれば、ファイル名・行番号・エラー内容を列挙して原因と修正方法を提示する。エラーなしなら「型エラーなし」と報告する。

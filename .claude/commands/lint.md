ESLint を実行して `src/` のコードをチェックする。

以下の PowerShell コマンドを実行する（fnm 経由で node を起動）：

```powershell
$nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
$env:Path = "$nodePath;$env:Path"
Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
& "$nodePath\npm.cmd" run lint 2>&1
```

lint エラー・警告があればファイルごとに列挙し、修正が必要なものは対応方法を提示する。

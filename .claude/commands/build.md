Next.js の本番ビルドを実行する。

以下の PowerShell コマンドを実行する（fnm 経由で node を起動）：

```powershell
$nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
$env:Path = "$nodePath;$env:Path"
Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
& "$nodePath\npm.cmd" run build 2>&1
```

ビルド結果（成功/失敗）、エラーがあれば内容、成功した場合はバンドルサイズのサマリーを報告する。

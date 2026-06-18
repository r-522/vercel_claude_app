Next.js 開発サーバーをバックグラウンドで起動する。

以下の PowerShell コマンドをバックグラウンドで実行する（fnm 経由で node を起動）：

```powershell
$nodePath = "C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation"
$env:Path = "$nodePath;$env:Path"
Set-Location "C:\Users\ikere\OneDrive\デスクトップ\プログラミング\vercel app"
& "$nodePath\npm.cmd" run dev
```

起動後に http://localhost:3000 で動作していることをユーザーに伝える。
環境変数 `.env.local` が存在しない場合はその旨を警告する。

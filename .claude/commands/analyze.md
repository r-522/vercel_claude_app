ファイル・コンポーネント・システムの側面を分析する。$ARGUMENTS に分析対象を指定する。

## 手順

1. **対象ファイルの読み込み**
   $ARGUMENTS で指定されたファイルをすべて読む。コンポーネントの場合は依存フック・ユーティリティも合わせて読む。

2. **分析実施**
   以下の観点を順番に確認する：

   ### TypeScript 正確性
   - strict モード違反（`any`、型アサーション `as`、non-null assertion `!`）
   - `import type` が使われるべき箇所で `import` になっていないか
   - 型推論に頼りすぎていないか（戻り値型の明示）

   ### パターン準拠
   - **ダークモードフック:** `isDark` をローカル state で管理していないか。`useDarkMode` フックのみ使用しているか
   - **transport パターン:** `useChat` の transport が `useMemo` で一度だけ生成されているか。再作成されていないか。refs（`modelRef` / `effortRef` / `thinkingRef`）で最新値を参照しているか
   - **Blob URL ライフサイクル:** `useImageAttachments` フックを使用しているか。`URL.createObjectURL` を直接コンポーネント内で呼んでいないか
   - **安定参照:** `REMARK_PLUGINS` / `MD_COMPONENTS` がモジュールレベルで定義されているか（コンポーネント内やフック内にないか）

   ### パフォーマンス
   - レンダーごとにオブジェクト・配列が再作成されていないか
   - `useCallback` / `useMemo` が適切に使われているか
   - 不要な再レンダーを引き起こす state 構造になっていないか

   ### セキュリティ
   - `ACCESS_CODE` / `COOKIE_SECRET` / `ANTHROPIC_API_KEY` がクライアントコード（`src/components/`、`src/hooks/`）に含まれていないか
   - `NEXT_PUBLIC_` プレフィックスが付いた環境変数にセンシティブな値がないか
   - API ルートに認証チェックが実装されているか

3. **結果の報告**
   各指摘を以下の重大度で分類して報告する：
   - **CRITICAL** — セキュリティリスク（即時修正必須）
   - **ERROR** — 動作バグまたは規約違反（修正必須）
   - **WARNING** — パフォーマンス劣化または推奨パターン違反
   - **INFO** — 改善提案（任意）

   各指摘は `ファイルパス:行番号 — 説明` の形式で示す。問題がなければ「問題なし」と報告する。

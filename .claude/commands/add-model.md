新しい Claude モデルを `src/lib/constants.ts` の `MODELS` 配列に追加する。

引数: $ARGUMENTS
例: `/add-model claude-opus-4-8 Opus 4.8 opus true`
フォーマット: `<model-id> <display-name> <family> <supportsThinking>`

手順:
1. `src/lib/constants.ts` を読む
2. `MODELS` 配列に新エントリを追加する（既存の書式・インデントに揃える）
3. `supportsThinking: true` の場合は思考機能対応モデルとして追加
4. 引数が不足している場合はユーザーに確認する
5. 追加後に変更内容を示す

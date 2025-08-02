---
title: コントリビューションガイド
type: guide
project: phyllotaxis-planner
status: active
created: 2025-02-08
tags: [contributing, collaboration, workflow]
related:
  - "[[development]]"
  - "[[coding-standards]]"
---

# コントリビューションガイド

Phyllotaxis Plannerプロジェクトへのコントリビューションを歓迎します！このガイドでは、効果的にプロジェクトに貢献する方法を説明します。

## 🌱 コントリビューションの種類

### コード貢献
- 新機能の実装
- バグ修正
- パフォーマンス改善
- リファクタリング

### ドキュメント貢献
- ドキュメントの改善・更新
- チュートリアルの作成
- APIドキュメントの充実
- 翻訳

### その他の貢献
- バグレポート
- 機能提案
- デザイン改善
- テストケースの追加

## 🚀 始める前に

### 1. 開発環境のセットアップ

[[development|開発環境セットアップガイド]]に従って環境を構築してください。

### 2. プロジェクト理解

以下のドキュメントを読んで、プロジェクトの理解を深めてください：

- [[../specs/requirements|要件定義書]]
- [[../specs/design|設計書]]
- [[coding-standards|コーディング規約]]

### 3. 既存のIssueを確認

[GitHub Issues](https://github.com/your-username/phyllotaxis-planner/issues)で既存の課題や提案を確認してください。

## 📋 コントリビューションプロセス

### 1. Issue作成（新機能・バグ報告）

#### バグレポート

```markdown
## バグの概要
簡潔にバグの内容を説明してください。

## 再現手順
1. '...'をクリック
2. '...'にスクロール
3. '...'を確認
4. エラーが発生

## 期待される動作
何が起こるべきだったかを説明してください。

## 実際の動作
実際に何が起こったかを説明してください。

## 環境情報
- OS: [e.g. Windows 11, macOS 13.0]
- ブラウザ: [e.g. Chrome 120, Firefox 121]
- Node.js: [e.g. 18.17.0]

## 追加情報
スクリーンショット、ログ、その他の関連情報があれば追加してください。
```

#### 機能提案

```markdown
## 機能の概要
提案する機能の概要を説明してください。

## 動機・背景
なぜこの機能が必要なのかを説明してください。

## 詳細な説明
機能の詳細な動作を説明してください。

## 代替案
検討した他の解決策があれば説明してください。

## 追加情報
モックアップ、参考資料などがあれば追加してください。
```

### 2. フォークとブランチ作成

```bash
# 1. リポジトリをフォーク（GitHub UI）

# 2. フォークしたリポジトリをクローン
git clone https://github.com/your-username/phyllotaxis-planner.git
cd phyllotaxis-planner

# 3. 上流リポジトリを追加
git remote add upstream https://github.com/original-owner/phyllotaxis-planner.git

# 4. 新しいブランチを作成
git checkout -b feature/your-feature-name
```

### 3. ブランチ命名規約

```bash
# 新機能
feature/add-phyllotaxis-animation
feature/implement-ecs-system

# バグ修正
fix/svg-rendering-mobile
fix/memory-leak-in-animation

# ドキュメント
docs/update-api-documentation
docs/add-contributing-guide

# リファクタリング
refactor/simplify-component-structure
refactor/optimize-phyllotaxis-calculation

# テスト
test/add-unit-tests-for-utils
test/improve-e2e-coverage
```

### 4. 開発とテスト

#### コーディング規約の遵守

[[coding-standards|コーディング規約]]に従って開発してください。

#### テストの実行

```bash
# 単体テスト
npm run test

# E2Eテスト
npm run test:e2e

# リント
npm run lint

# 型チェック
npm run type-check
```

#### コミット規約

[Conventional Commits](https://www.conventionalcommits.org/)に従ってください：

```bash
# 基本形式
<type>[optional scope]: <description>

# 例
feat: add phyllotaxis position calculation
fix(animation): resolve SVG rendering issue on mobile
docs: update API documentation for ECS components
style: improve button hover states
test: add unit tests for phyllotaxis utils
refactor: simplify component prop interfaces
perf: optimize rendering performance for large datasets
```

### 5. プルリクエスト作成

#### プルリクエストテンプレート

```markdown
## 変更の概要
この変更の概要を説明してください。

## 変更の種類
- [ ] バグ修正（既存機能を壊さない変更）
- [ ] 新機能（既存機能を壊さない変更）
- [ ] 破壊的変更（既存機能に影響する修正や機能）
- [ ] ドキュメント更新

## テスト
- [ ] 新しいテストを追加した
- [ ] 既存のテストが通ることを確認した
- [ ] テストは不要（理由: ）

## チェックリスト
- [ ] コードが[[coding-standards|コーディング規約]]に従っている
- [ ] 自己レビューを実施した
- [ ] 必要に応じてドキュメントを更新した
- [ ] 変更がアクセシビリティに配慮している
- [ ] パフォーマンスへの影響を考慮した

## 関連Issue
Closes #(issue番号)

## スクリーンショット（該当する場合）
変更の視覚的な確認ができるスクリーンショットを追加してください。

## 追加情報
レビュアーが知っておくべき追加情報があれば記載してください。
```

### 6. コードレビュープロセス

#### レビュー観点

- **機能性**: 要件を満たしているか
- **品質**: コーディング規約に従っているか
- **テスト**: 適切なテストが書かれているか
- **パフォーマンス**: パフォーマンスへの影響はないか
- **セキュリティ**: セキュリティ上の問題はないか
- **アクセシビリティ**: アクセシビリティに配慮されているか

#### レビューコメントへの対応

```bash
# フィードバックを受けて修正
git add .
git commit -m "fix: address review feedback"
git push origin feature/your-feature-name
```

### 7. マージ後の作業

```bash
# メインブランチに戻る
git checkout main

# 最新の変更を取得
git pull upstream main

# 作業ブランチを削除
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## 🎯 特別な貢献領域

### フィロタキシス数学の改善

植物学や数学の専門知識をお持ちの方は、以下の領域での貢献を歓迎します：

- より正確なフィロタキシス計算アルゴリズム
- 異なる植物パターンの実装
- 数学的可視化の改善

### アクセシビリティ

アクセシビリティの専門知識をお持ちの方は：

- WCAG 2.1 AA準拠の改善
- スクリーンリーダー対応
- キーボードナビゲーション改善

### パフォーマンス最適化

パフォーマンス最適化の経験をお持ちの方は：

- 大量データでの描画最適化
- メモリ使用量の削減
- バンドルサイズの最適化

## 🏆 コントリビューター認定

### レベル制度

#### 🌱 Seedling Contributor
- 初回のプルリクエストがマージされた方
- ドキュメント改善やバグ修正

#### 🌿 Growing Contributor  
- 複数の機能実装やバグ修正に貢献
- コードレビューに参加

#### 🌳 Core Contributor
- 重要な機能の設計・実装
- 他のコントリビューターのメンタリング
- プロジェクトの方向性に関する議論に参加

### 認定特典

- READMEのコントリビューターセクションに掲載
- 特別なGitHubバッジ
- プロジェクトの重要な決定への参加権

## 📞 サポート・質問

### コミュニケーションチャンネル

- **GitHub Issues**: バグ報告・機能提案
- **GitHub Discussions**: 一般的な質問・議論
- **Pull Request**: コードレビュー・技術的議論

### よくある質問

#### Q: 初心者でも貢献できますか？
A: はい！ドキュメント改善、バグ報告、小さなバグ修正から始めることをお勧めします。

#### Q: どの程度の変更からプルリクエストを作成すべきですか？
A: 小さな変更でも歓迎します。typo修正や一行の改善でも価値のある貢献です。

#### Q: 機能提案はどこで議論すべきですか？
A: まずGitHub Issuesで提案し、必要に応じてGitHub Discussionsで詳細を議論してください。

## 🙏 謝辞

すべてのコントリビューターの皆様に感謝いたします。あなたの貢献がPhyllotaxis Plannerをより良いツールにしています。

---

**Happy Contributing! 🌱**
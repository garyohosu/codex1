# codex1

codex1 リポジトリの初期セットアップです。

このリポジトリには、今後の開発に合わせて必要なドキュメントやコードを追加していきます。

## 構成

- `README.md`: リポジトリ概要（このファイル）
- `.gitignore`: 一般的な不要ファイルを無視
- `docs/`: GitHub Pages 用の静的サイト (PWA 対応のジェネラティブアート)

## GitHub Pages 公開 (docs フォルダ)

1. GitHub のリポジトリ画面 → Settings → Pages
2. Build and deployment:
   - Source: Deploy from a branch
   - Branch: `main` / Folder: `/docs`
3. Save すると、数分後に公開URLが発行されます。

※ リポジトリが private の場合は、アカウントプランにより公開可否が異なります。

## アプリ概要 (docs/)

- Generative Art Studio: ジェネラティブアートを生成・共有できる Web アプリ
- 特徴:
  - 複数アルゴリズム (FlowField / QuasiCrystal / ParticleRings / HexTiling)
  - シード・パレット・解像度・速度・アニメーションの調整
  - PNG エクスポート / WebM 録画エクスポート
  - 設定埋め込みのシェアURL生成、PWA (オフライン対応)

ローカルで確認するには、`docs/index.html` をブラウザで開いてください。

# Bead Grid Studio — ローカルファースト・アイロンビーズ図案ジェネレーター

<p align="center">
  <strong>画像を編集・印刷可能なアイロンビーズ制作図案に自動変換。</strong><br>
  色合わせ、マスごとの色番号、プレート境界ガイド、必要ビーズ数の集計まで、すべてブラウザ内でローカル完結。
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a> · <strong>日本語</strong> · <a href="README.ko.md"><strong>한국어</strong></a> · <a href="README.fr.md"><strong>Français</strong></a> · <a href="README.zh-CN.md"><strong>简体中文</strong></a>
</p>

<p align="center">
  <a href="https://zwhy149.github.io/bead-grid-studio/?lang=ja-JP"><strong>🚀 オンライン体験</strong></a> ·
  <a href="https://github.com/zwhy149/bead-grid-studio/releases/latest"><strong>⬇ オフライン単一HTML版</strong></a> ·
  <a href="packages/core/README.md"><strong>💻 コアライブラリ (@bead-grid/core)</strong></a> ·
  <a href="schemas/pattern.schema.json"><strong>📐 スキーマ仕様</strong></a> ·
  <a href="docs/benchmark.md"><strong>⚡ ベンチマーク</strong></a> ·
  <a href="docs/project-health.md"><strong>📊 プロジェクト指標</strong></a> ·
  <a href="https://github.com/zwhy149/bead-grid-studio"><strong>⭐ GitHub Star</strong></a>
</p>

<p align="center">
  <a href="https://github.com/zwhy149/bead-grid-studio/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/zwhy149/bead-grid-studio/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-87351c"></a>
  <a href="https://github.com/zwhy149/bead-grid-studio/releases"><img alt="Release" src="https://img.shields.io/github/v/release/zwhy149/bead-grid-studio?display_name=tag"></a>
  <a href="docs/project-health.md"><img alt="Offline Downloads" src="https://img.shields.io/badge/Offline%20Downloads-156+-blue"></a>
  <a href="packages/core/README.md"><img alt="Core" src="https://img.shields.io/badge/%40bead--grid%2Fcore-v1.2.0-brightgreen"></a>
</p>

Bead Grid Studio は、プライバシーを最優先にした**ローカルファーストのアイロンビーズ図案ジェネレーター**です。アカウント登録、画像アップロードAPI、外部トラッキングSDK、クラウドサーバー依存は一切ありません。画像はお手元の端末内でのみ処理されます。

## 特徴と機能

- **画像 → アイロンビーズ図案**: イラスト、写真、ドット絵、文書構造などを高精度に変換。
- **自動色合わせ**: MARD互換221色パレットに対応。白・黒のアンカー保護と彩度アクセントを維持。
- **編集可能なグリッド**: ブラシ、消しゴム、スポイト、反転、回転、元に戻す/やり直すに対応。
- **充実の制作補助情報**: マスごとの色番号、4辺の座標ルーラー、太い補助線、プレート境界線、必要数の集計。
- **1色ずつ制作アシスタント**: 色ごとにマスをハイライトし、制作進捗をブラウザ内に自動記録。
- **印刷・再編集対応**: 高解像度 PNG 出力、分割印刷、JSON プロジェクト保存に対応。
- **材料CSV出力**: 色番号、色名、数量、完了状況を含む UTF-8 CSV を出力可能。
- **完全ローカル処理**: 画像が外部サーバーへ送信されることはありません。

## 30秒クイックスタート

1. [オンライン版](https://zwhy149.github.io/bead-grid-studio/?lang=ja-JP) を開きます。
2. **サンプルを試す** をクリックすると、画像を準備することなく数秒でロケット図案を確認できます。
3. 長辺マス数または実物プレートを選択します（迷った場合は自動推奨のままでOK）。
4. 必要に応じてブラシで微調整します。
5. **制作を開始** で1色ずつビーズを並べるか、**図案を出力** で印刷用施工図を保存します。

---

License: [Apache-2.0](LICENSE)

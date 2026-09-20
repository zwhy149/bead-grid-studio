# Bead Grid Studio — 로컬 우선 펄러비즈 도안 생성기

<p align="center">
  <strong>이미지를 편집 및 인쇄 가능한 펄러비즈 제작 도안으로 변환합니다.</strong><br>
  색상 매칭, 칸별 색상 번호, 비즈판 가이드선, 재료 수량 집계까지 모두 브라우저에서 로컬로 실행됩니다.
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a> · <a href="README.ja.md"><strong>日本語</strong></a> · <strong>한국어</strong> · <a href="README.fr.md"><strong>Français</strong></a> · <a href="README.zh-CN.md"><strong>简体中文</strong></a>
</p>

<p align="center">
  <a href="https://zwhy149.github.io/bead-grid-studio/?lang=ko-KR"><strong>🚀 온라인 체험</strong></a> ·
  <a href="https://github.com/zwhy149/bead-grid-studio/releases/latest"><strong>⬇ 오프라인 단일 HTML</strong></a> ·
  <a href="packages/core/README.md"><strong>💻 코어 엔진 (@bead-grid/core)</strong></a> ·
  <a href="schemas/pattern.schema.json"><strong>📐 스키마 규격</strong></a> ·
  <a href="docs/benchmark.md"><strong>⚡ 벤치마크</strong></a> ·
  <a href="docs/project-health.md"><strong>📊 프로젝트 지표</strong></a> ·
  <a href="https://github.com/zwhy149/bead-grid-studio"><strong>⭐ GitHub Star</strong></a>
</p>

<p align="center">
  <a href="https://github.com/zwhy149/bead-grid-studio/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/zwhy149/bead-grid-studio/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-87351c"></a>
  <a href="https://github.com/zwhy149/bead-grid-studio/releases"><img alt="Release" src="https://img.shields.io/github/v/release/zwhy149/bead-grid-studio?display_name=tag"></a>
  <a href="docs/project-health.md"><img alt="Offline Downloads" src="https://img.shields.io/badge/Offline%20Downloads-156+-blue"></a>
  <a href="packages/core/README.md"><img alt="Core" src="https://img.shields.io/badge/%40bead--grid%2Fcore-v1.2.0-brightgreen"></a>
</p>

Bead Grid Studio는 개인정보 보호를 최우선으로 하는 **로컬 우선 펄러비즈 도안 생성기**입니다. 회원가입, 이미지 업로드 API, 분석 SDK 또는 클라우드 서버 의존성이 전혀 없습니다. 원본 이미지는 사용자의 기기 내에서만 처리됩니다.

## 주요 기능

- **이미지 → 펄러비즈 도안**: 캐릭터, 일러스트, 사진, 픽셀 아트 등을 정밀 변환.
- **자동 색상 매칭**: MARD 호환 221 색상 팔레트 매칭, 흑백 앵커 및 핵심 포인트 색상 보호.
- **편집 가능한 격자 캔버스**: 브러시, 지우개, 스포이트, 반전, 회전, 실행 취소/다시 실행 지원.
- **완벽한 제작 정보**: 칸별 색상 코드, 4변 좌표 눈금자, 굵은 보조선, 판 이음새, 재료 수량 통계.
- **색상별 순차 제작 도우미**: 한 번에 한 가지 색상을 강조 표시하고 제작 진척도를 로컬에 저장.
- **인쇄 및 재편집 지원**: 고해상도 시공 도안 PNG 내보내기, 분할 인쇄, JSON 프로젝트 저장/불러오기.
- **자재 목록 CSV 내보내기**: 색상 번호, 색상명, 수량, 완료 여부가 포함된 UTF-8 CSV 출력.
- **100% 로컬 처리**: 이미지가 외부 서버로 전송되지 않습니다.

## 30초 빠른 시작

1. [온라인 데모](https://zwhy149.github.io/bead-grid-studio/?lang=ko-KR)를 엽니다.
2. **샘플 체험하기**를 누르면 이미지 준비 없이 몇 초 만에 실제 로켓 도안을 확인할 수 있습니다.
3. 긴 변 칸 수 또는 실물 비즈판 규격을 선택합니다.
4. 필요한 경우 브러시로 디테일을 수정합니다.
5. **제작 시작**을 눌러 색상별로 비즈를 놓거나, **도안 내보내기**로 인쇄용 도안을 저장합니다.

---

License: [Apache-2.0](LICENSE)

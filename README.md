# 이해준 포트폴리오

GitHub Pages: https://haejyn.github.io/

정적 HTML/CSS/JavaScript 사이트입니다. `python -m http.server 8080`으로 로컬에서 확인할 수 있습니다.

TVING AI Product Builder 지원용으로 구성한 한 단짜리 문서형 포트폴리오입니다. 크림색 배경에 검정 글자와 빨간 포인트를 쓰며, 프로젝트마다 결과 · 기술 · 코드 표와 배경 · 구현 · 검증 · 성과를 개조식으로 적었습니다. 웨이퍼 판독 데모는 기존 도크 UI를 유지합니다.

- `/`, `/tving/` — 같은 TVING 포트폴리오 (임시)
- `/choose/` — 회사 선택 화면 (임시, 검색 노출 없음)
- `/satreci/`, `/skhynix/`, `/autoever/` — 회사별 포트폴리오 틀 (준비 중)

## 데모

- 영상은 `media/`에서 직접 제공합니다. 위성 프로젝트 3개는 글로만 소개하며, 해당 미디어 파일은 저장소에 남겨 둡니다. MP4는 H.264 / yuv420p, 빠른 시작용 moov 인덱스를 사용합니다.
- 방문자가 재생을 시작하며, 다른 영상 또는 화면 밖 영상은 일시정지합니다. 기본 컨트롤에서 탐색과 전체 화면을 사용할 수 있습니다.
- willnew 데모는 데모 모드(`/?demo`)의 새 화면(달 모양 진행 표시 · 내 차례 첫 화면 · 결정 바)을 playwright로 직접 녹화하고 단계 자막 5개를 화면에 넣은 해설판입니다. 실행 구간은 2배속, 나머지는 실시간입니다. 각 영상에 포스터와 재생 오류 안내가 있습니다.
- `demos/wafer/`는 wafer-defect-agent의 기록된 판독 8건과 UMAP 표본을 보여줍니다. 모델을 실행하거나 새 웨이퍼를 업로드하는 서비스가 아닙니다. 지도에는 Plotly CDN 연결이 필요합니다.

## 미디어 출처

원본 프로젝트의 실제 기록과 렌더링을 사용합니다. 성과 수치는 각 저장소의 README와 평가 기록에 기반하며, 평가 조건을 함께 표시합니다.

| 파일 | 출처 |
|---|---|
| wafer-demo.mp4, wafer-poster.png, demos/wafer | [wafer-defect-agent](https://github.com/Haejyn/wafer-defect-agent) · 기록된 판독 결과를 에이전트 실행 단계(분류 → 처음 보는 패턴 확인 → 위치 → 히트맵 → 유사 사례 → 판독 카드 → 코드 검사)로 재생하는 화면을 녹화 |
| willnew-demo.mp4, willnew-poster.jpg | [willnew](https://github.com/Haejyn/willnew) · 새 화면 데모 모드를 playwright로 녹화(1440×900, 33.6초)하고 단계 자막 5개를 DOM 오버레이로 입힌 해설판. 실행 구간(원본 약 31초)은 2배속 |
| willnew-flow-*.mp4/jpg | 위 데모 영상에서 구간(맡기기 · 계획 2.3–9.5초 · 실행 · 검증 9.5–25.2초 · 내 차례 · 결정 25.2–33.6초)을 잘라 냄(1280×800) |
| biw-demo.mp4, biw-ai.gif, biw-poster.png | [biw-weld-twin](https://github.com/Haejyn/biw-weld-twin) · demo_weld.mp4, demo_ai.gif, hero.png |
| downlink-demo.mp4 | [ccsds-downlink-reliability](https://github.com/Haejyn/ccsds-downlink-reliability) · downlink.mp4 |
| orbit-demo.mp4 | [orbit-pass-sim](https://github.com/Haejyn/orbit-pass-sim) · passes.mp4 |
| ground-station.png | [ground-station-rx](https://github.com/Haejyn/ground-station-rx) · doppler_pass.png |

다운링크와 궤도 영상의 포스터는 해당 영상의 2초 시점 프레임입니다.

# 이해준 포트폴리오

GitHub Pages: https://haejyn.github.io/

정적 HTML/CSS/JavaScript 사이트입니다. `python -m http.server 8080`으로 로컬에서 확인할 수 있습니다.

BIW Weld Twin의 차콜 배경(`#1b1c1e`), 패널(`#232427`), 민트 선택 표시(`#5ee1d4`), 얇은 경계선과 작은 모서리를 기준으로 디자인했습니다. 판독 데모에는 좌측 사례 목록·중앙 맵·우측 속성 도크와 하단 판정 영역을 적용했습니다.

## 데모

- 영상 5개는 `media/`에서 직접 제공합니다. MP4는 H.264 / yuv420p, 빠른 시작용 moov 인덱스를 사용합니다.
- 방문자가 재생을 시작하며, 다른 영상 또는 화면 밖 영상은 일시정지합니다. 기본 컨트롤에서 탐색과 전체 화면을 사용할 수 있습니다.
- willnew는 MP4와 기존 WebM을 함께 제공합니다. 각 영상에 직접 열기 링크, 포스터, 재생 오류 안내가 있습니다.
- `demos/wafer/`는 wafer-defect-agent의 기록된 판독 8건과 UMAP 표본을 보여줍니다. 모델을 실행하거나 새 웨이퍼를 업로드하는 서비스가 아닙니다. 지도에는 Plotly CDN 연결이 필요합니다.

## 미디어 출처

원본 프로젝트의 실제 기록과 렌더링을 사용합니다. 성과 수치는 각 저장소의 README와 평가 기록에 기반하며, 평가 조건을 함께 표시합니다.

| 파일 | 출처 |
|---|---|
| wafer-demo.mp4, wafer-poster.png, demos/wafer | [wafer-defect-agent](https://github.com/Haejyn/wafer-defect-agent) · 개선한 UI로 기록된 결과를 재생 |
| willnew-demo.mp4, willnew-demo.webm, willnew-poster.jpg | [willnew](https://github.com/Haejyn/willnew) · 기존 WebM에서 호환용 MP4 생성 |
| biw-demo.mp4, biw-ai.gif, biw-poster.png | [biw-weld-twin](https://github.com/Haejyn/biw-weld-twin) · demo_weld.mp4, demo_ai.gif, hero.png |
| downlink-demo.mp4 | [ccsds-downlink-reliability](https://github.com/Haejyn/ccsds-downlink-reliability) · downlink.mp4 |
| orbit-demo.mp4 | [orbit-pass-sim](https://github.com/Haejyn/orbit-pass-sim) · passes.mp4 |
| ground-station.png | [ground-station-rx](https://github.com/Haejyn/ground-station-rx) · doppler_pass.png |

다운링크와 궤도 영상의 포스터는 해당 영상의 2초 시점 프레임입니다.

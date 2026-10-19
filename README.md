# 이해준 포트폴리오

GitHub Pages: https://haejyn.github.io/

정적 HTML/CSS/JavaScript 사이트입니다. `python -m http.server 8080`으로 로컬에서 확인할 수 있습니다.

TVING AI Product Builder 지원용으로 구성한 한 단짜리 문서형 포트폴리오입니다. 크림색 배경에 검정 글자와 빨간 포인트를 쓰며, 프로젝트마다 결과 · 기술 · 코드 표와 배경 · 구현 · 검증 · 성과를 개조식으로 적었습니다. 웨이퍼 판독 데모는 기존 도크 UI를 유지합니다.

- `/`, `/tving/` — 같은 TVING 포트폴리오 (임시)
- `/choose/` — 회사 선택 화면 (임시, 검색 노출 없음)
- `/autoever/`: 현대오토에버 포트폴리오 틀 (준비 중)

## 데모

- 영상은 `media/`에서 직접 제공합니다. 위성 프로젝트 3개는 TVING 페이지에서 뺐고, 해당 미디어 파일은 저장소에 남겨 둡니다. MP4는 H.264 / yuv420p, 빠른 시작용 moov 인덱스를 사용합니다.
- 방문자가 재생을 시작하며, 다른 영상 또는 화면 밖 영상은 일시정지합니다. 기본 컨트롤에서 탐색과 전체 화면을 사용할 수 있습니다.
- willnew 소개 영상은 HTML 페이지를 프레임마다 그려 만든 모션 그래픽입니다. 앱 장면은 데모 모드(`/?demo`)의 실제 화면을 캡처해 넣었고, 기능 영상 7개는 데모 모드를 playwright로 녹화했습니다. 각 영상에 포스터와 재생 오류 안내가 있습니다.
- `demos/wafer/`는 wafer-defect-agent의 기록된 판독 8건과 UMAP 표본을 보여줍니다. 모델을 실행하거나 새 웨이퍼를 업로드하는 서비스가 아닙니다. 지도에는 Plotly CDN 연결이 필요합니다.

## 미디어 출처

원본 프로젝트의 실제 기록과 렌더링을 사용합니다. 성과 수치는 각 저장소의 README와 평가 기록에 기반하며, 평가 조건을 함께 표시합니다.

| 파일 | 출처 |
|---|---|
| wafer-demo.mp4, wafer-poster.png, demos/wafer | [wafer-defect-agent](https://github.com/Haejyn/wafer-defect-agent) · 기록된 판독 결과를 에이전트 실행 단계(분류 → 처음 보는 패턴 확인 → 위치 → 히트맵 → 유사 사례 → 판독 카드 → 코드 검사)로 재생하는 화면을 녹화 |
| wasnew-demo.mp4, wasnew-poster.png | [wasnew](https://github.com/Haejyn/wasnew) · Claude Code 헤드리스 세션 실제 실행 기록(Downloads 199개 정리, rm 훅 차단, 전체 롤백) 터미널 리플레이 |
| willnew-promo.mp4, willnew-promo.jpg | [willnew](https://github.com/Haejyn/willnew) · 프레임마다 그린 HTML 모션 그래픽(1920×1080, 33.8초). 앱 장면은 데모 모드의 실제 화면 캡처 |
| willnew-c-*.mp4/jpg | willnew 데모 모드를 playwright로 녹화한 기능 영상 7개(채널에 맡기기, 재작업, 테스트 수정 차단, 줄 댓글, 휴대폰 승인, PR → CI → 배포, 요청자 답장) |
| willnew-threads.png, willnew-pair-compare.png, willnew-annotation.png | willnew 스레드 기반 협업 화면, Playwright 전후 화면 나란히 비교, 화면 상자 그리기 주석 피드백 실제 캡처 |
| biw-demo.mp4, biw-ai.gif, biw-poster.png | [biw-weld-twin](https://github.com/Haejyn/biw-weld-twin) · demo_weld.mp4, demo_ai.gif, hero.png |
| downlink-demo.mp4 | [ccsds-downlink-reliability](https://github.com/Haejyn/ccsds-downlink-reliability) · downlink.mp4 |
| orbit-demo.mp4 | [orbit-pass-sim](https://github.com/Haejyn/orbit-pass-sim) · passes.mp4 |
| ground-station.png | [ground-station-rx](https://github.com/Haejyn/ground-station-rx) · doppler_pass.png |

다운링크와 궤도 영상의 포스터는 해당 영상의 2초 시점 프레임입니다.

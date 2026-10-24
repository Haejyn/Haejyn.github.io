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

## 숫자와 변경 기록

페이지의 테스트 수와 MCP 도구 수는 손으로 쓰지 않습니다. `<!-- fact:willnew.tests.passed -->94<!-- /fact -->` 처럼 표시 자리로 감싸 두고, `data/facts/willnew.json`, `data/facts/wasnew.json` 값으로 채웁니다. 두 파일은 willnew, wasnew CI 가 `facts-latest` 릴리스에 올린 `facts.json` 을 받은 것입니다. 릴리스가 생기기 전에는 페이지 값을 옮겨 적어 두었고 `"commit": "manual"` 로 표시했습니다.

숫자 갱신 흐름 (`.github/workflows/facts.yml`, `repository_dispatch: facts-updated`, 수동 실행, 매일 한 번)

facts 받기 → `node scripts/apply-facts.mjs` → `node scripts/check.mjs` → `facts/<날짜시각>` 브랜치로 PR → `node scripts/only-facts-changed.mjs origin/main` 통과 시 squash 병합 → `node scripts/live-has-sha.mjs <병합 커밋>` 로 Pages 배포 확인

숫자가 실제로 바뀌면 apply 가 `data/changelog.json` 에 `facts` 항목을 붙이고, 페이지 아래 변경 기록 칸과 `/tving/history/` 표를 다시 그립니다. 바뀐 게 없으면 파일을 건드리지 않습니다.

문장을 바꿀 때

1. 페이지를 고치고 `data/changelog.json` 끝에 `{ "date": "YYYY-MM-DD", "commit": "", "kind": "content", "scope": "tving", "summary": "…" }` 를 넣습니다. 커밋은 병합 전에는 모르니 비워 둡니다. `scope` 는 `tving/index.html` 이나 그 사본인 `/index.html` 을 바꿨으면 `tving`, 선택 화면이나 다른 회사 페이지만 바꿨으면 `site` 입니다. 페이지 아래 변경 기록 칸과 `/tving/history/` 에는 `tving` 항목만 보이고, 둘 다 바꾼 커밋은 같은 커밋으로 항목을 두 개 넣습니다.
2. `node scripts/apply-facts.mjs` 로 변경 기록 칸을 다시 그리고 `node scripts/check.mjs --base origin/main` 을 돌립니다. TVING 페이지가 표시 자리 밖에서 바뀌었는데 새 `tving` content 항목이 없거나, 다른 페이지가 바뀌었는데 새 `site` 항목이 없으면 실패합니다.
3. PR 본문의 "변경 기록:" 줄에 같은 문장을 적고, 사람이 승인한 뒤 병합합니다. 이런 PR 은 자동 병합하지 않습니다.
4. 병합 뒤 `node scripts/snapshot-history.mjs` 를 돌려 커밋하면 빈 `commit` 을 병합 커밋으로 채우고 그 시점 페이지를 `tving/history/<sha>/` 에 저장합니다.

검사 (`node scripts/check.mjs`, PR 과 main push 마다 `.github/workflows/check.yml`)

- 표시 자리가 비었거나 data/facts 와 다름, meta facts 와 변경 기록 칸이 오래됨
- 외부 링크가 200 이 아님. Haejyn 저장소 링크가 404 면 비공개 저장소 링크로 표시. `--offline` 으로 끔
- wasnew 벤치마크 표 셀의 숫자에 단위(ms, s, MB 등)가 없음
- 휴대폰 번호, 주민등록번호 꼴, 허용 목록(ssungiven@gmail.com) 밖의 이메일
- TVING 변경 기록 칸과 `/tving/history/` 목록에 다른 회사 이름이나 "회사 선택" 이 보임

이전 버전 (`/tving/history/`)

069ecea 이후 TVING 페이지를 바꾼 content 커밋마다 그 커밋의 `tving/index.html`, `styles.css`, `site.js` 를 저장합니다. 미디어는 `raw.githubusercontent.com/Haejyn/Haejyn.github.io/<sha>/media/` 에서 불러오므로 지금 지워진 파일도 열립니다. 스냅샷은 검색에 노출하지 않습니다(`noindex`).

저장소 설정에서 할 일

- 이 저장소 Settings → Actions → General → Workflow permissions 에서 "Allow GitHub Actions to create and approve pull requests" 를 켭니다. 꺼져 있으면 facts.yml 의 `gh pr create` 가 실패합니다.
- willnew, wasnew 저장소에 `PORTFOLIO_DISPATCH_TOKEN` 시크릿을 둡니다. 이 저장소(Haejyn.github.io)에 Contents 쓰기 권한만 준 fine-grained PAT 로, `facts.json` 을 릴리스에 올린 뒤 `POST /repos/Haejyn/Haejyn.github.io/dispatches` (`event_type: facts-updated`) 를 부를 때 씁니다.
- Pages 는 main 브랜치 루트에서 바로 배포합니다(Actions 배포 아님). `live-has-sha.mjs` 는 `gh api repos/Haejyn/Haejyn.github.io/pages/builds/latest` 의 커밋과 상태를 봅니다.

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

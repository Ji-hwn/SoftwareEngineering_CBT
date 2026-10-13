# jihwanlee | Software Engineering CBT

소프트웨어공학 A+을 위한 개념 학습부터 CBT 모의고사까지.

- GitHub 계정: **Ji-hwn**
- 저장소: [Ji-hwn/SoftwareEngineering_CBT](https://github.com/Ji-hwn/SoftwareEngineering_CBT)
- 목표 배포 주소: [https://Ji-hwn.github.io/SoftwareEngineering_CBT/](https://Ji-hwn.github.io/SoftwareEngineering_CBT/)
- 화면 브랜드: **jihwanlee | Software Engineering CBT**

제공된 Lecture 01·03·06·08·09·09(추가)·10의 187페이지 중 학습 페이지 173개를 페이지별로 재구성했습니다. 기존 132개 개념에 1,115개 세부 체크리스트 항목을 연결하고, 172개 입력 카드와 1,115개 항목 회상 카드를 제공합니다. 기존 개념 카드도 유지합니다. 문제는 출제용 202개, 과거 기록 호환용 134개를 구분합니다.

페이지 대응은 173/173, 편집 체크리스트의 요약 대조는 1,109/1,115입니다. **이는 원본 전체 세부 내용의 완전성 100% 인증이 아닙니다.** 작은 그림 라벨·코드 세부의 독립 검수와 원본 표기 충돌이 남아 있습니다. 출제 보류 개념은 Latency·유스케이스 일반화·답신 화살촉입니다.

## 로컬 실행

Node.js 22 이상과 pnpm 11.25.0을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

개발 서버 주소: `http://127.0.0.1:5173/SoftwareEngineering_CBT/`.

```sh
pnpm test
python scripts/verify_calculations.py
pnpm run audit
pnpm build
pnpm preview
```

Windows 브라우저 테스트는 설치된 Edge를 사용합니다. Linux/macOS에서는 `pnpm exec playwright install --with-deps chromium` 후 `pnpm test:e2e`를 실행하세요. 테스트는 별도의 브라우저 컨텍스트를 사용합니다.

## 기능

- 실제 기록 기반 대시보드·Lecture별 진도·학습 통계.
- 페이지별 강의·목차·출처·검색·글자 크기·북마크·학습 완료 체크.
- 현재 PDF 페이지의 고유 제목·세부 항목·자체 설명을 먼저 표시하고 공통 개념은 접어서 제공합니다. 페이지 완료와 기존 개념 완료를 별도로 저장합니다.
- 원본 기반 정리와 구분한 쉬운 설명·배경·예시·비교·암기·확인 문제.
- 용어/정의/빈칸/순서/공식/비교/UML 암기카드와 오늘·1일·3일·7일 복습.
- 저작자가 지정한 키워드를 빈칸으로 만들고 실제 입력을 채점합니다. 틀린 빈칸별 정답·원본 페이지를 제공하며 전체 항목 순환 모드도 제공합니다.
- 객관식·OX·빈칸·단답·다중 선택·비교·계산·UML 판별 문제.
- CBT 범위·10/20/30/50문항·시간·유형·난이도·강조 비율·오답 전용 설정.
- 시험 중 정답 숨김·문항 탐색·표시·건너뛰기·제출 확인·절대 마감 시각 기반 자동 제출.
- 시험마다 선지 순서를 섞고 원본 답안 ID로 채점. 새로고침 후 답안·시간·순서 유지.
- 결과·취약 개념·오답·반복 횟수·개인 메모·재도전.
- localStorage·JSON 백업/복원·모바일·다크 모드.

기존 v1 저장 키·ID·답안 선택지 번호를 유지하는 추가형 마이그레이션을 사용합니다. 기존 229개 문항의 문제문·선택지·정답은 그대로 보관하여 진행 중이던 시험과 과거 결과를 읽습니다. 새 시험은 문항 스냅샷도 저장합니다. 이름 회상형 129개와 PDF 밖 연습 수치 5개는 새 시험 후보에서 제외합니다. 오답의 기존 메모는 유지합니다.

기존 강조 우선 분류 44개 중 본문 직접 강조는 31개로 재분리했습니다. 반복 제목은 Important로 표시하며 출제 70%는 직접 강조와 관련 핵심 문항을 합한 비율입니다. 기본 20문항의 14/6 비율을 검사하고 후보가 부족하면 실제 수와 조정 이유를 표시합니다.

학습 기록은 현재 브라우저에 저장됩니다. 다른 기기로 이동할 때 JSON 백업·복원을 사용하세요. 백엔드나 로그인 서버는 없습니다.

## 기술 및 데이터

React / TypeScript / Vite / React Router HashRouter / CSS / Lucide / Vitest / Playwright.

`src/data/course.json`은 UI와 분리한 공개 학습 데이터입니다. 고정 concept_id/question_id를 유지하면 콘텐츠 갱신 후에도 기존 학습 기록을 보존할 수 있습니다. 출처 번호는 PDF 파일의 실제 1부터 세는 페이지 순서입니다.

## 원본과 내부 자료 제외

**공개 저장소와 Pages에 교수님 원본 PDF, 원본 페이지 이미지, 내부 검수 보고서·CSV·JSON·작업 상태 파일을 올리지 않습니다.** 공개 저장소에는 웹사이트 코드·재구성 학습 데이터·자동 테스트 및 배포 코드만 포함합니다.

설정의 ‘내 원본 PDF 연결’은 사용자가 가진 PDF를 현재 브라우저 세션에서만 열며 서버로 업로드하지 않습니다. PDF 파일명은 학습 출처를 표시하는 메타데이터이며 원본 파일 자체가 아닙니다.

내부 분석 원본·작성 파일·추출 도구와 갱신 파이프라인은 관리자의 로컬 작업 폴더에 보관합니다. 추가 Lecture는 로컬에서 전수 분석·원본 대조·정답 검증을 마친 후 공개 학습 JSON만 갱신하세요. 검수 전 콘텐츠를 빈 강의나 정식 문제은행으로 게시하지 않습니다.

로컬 저작 원본은 `content/concepts.psv`, `questions.psv`, `pages.psv`, `keywords.psv`, `questions-v2.psv`, `recall-v2.psv`, `baseline-v1.json`입니다. `scripts/build_content.py`와 `refine_v2.py`가 이를 컴파일합니다. JSON만 수정하면 재생성 때 사라지므로 원본과 컴파일러를 함께 수정하세요. 관리자 로컬에서 `pnpm content:build`로 재생성하고 `pnpm data:update`로 추출·검증을 실행합니다. 추가 PDF는 먼저 `source_pdfs/`에 놓고 페이지·색상·도식 검수 후 고정 ID로 연결합니다. 자동 추출과 의미 검증은 별도이며 원본·저작 데이터는 공개 저장소에 포함하지 않습니다.

내부 보고서는 `analysis/page-content-audit.json`, `atomic-checklist.csv`, `atomic-coverage-report.md`, `question-quality-report.md`, `repro-validation.json`에 보관합니다. 공개 CI는 재구성 데이터만 사용해 구조·계산·라우팅·저장을 검사하고 내부 보고서를 새로 만들지만 배포에는 넣지 않습니다.

## GitHub Pages

저장소는 `Ji-hwn/SoftwareEngineering_CBT`, Vite base는 `/SoftwareEngineering_CBT/`입니다. HashRouter를 사용해 하위 화면 새로고침의 경로 404를 방지합니다.

저장소 Settings → Pages → Source를 **GitHub Actions**로 설정합니다. `main` 푸시 또는 수동 실행 시 `.github/workflows/pages.yml`이 설치·테스트·계산 검증·콘텐츠 감사·빌드·공개 파일 검사를 수행하고 `dist`만 배포합니다. PR에서는 검사만 실행합니다.

CI가 생성한 검사 결과는 작업 중의 임시 파일이며 저장소나 Pages 배포 산출물에 넣지 않습니다. `scripts/check_public_files.mjs`가 추적된 파일과 빌드에서 원본·내부 검수 파일 포함 여부를 검사합니다.

공식 문서: [GitHub Pages 사용자 지정 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

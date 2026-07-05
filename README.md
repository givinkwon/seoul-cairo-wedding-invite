# Seoul to Cairo Mobile Wedding Invitation

정적 HTML/CSS/JS로 만든 한국식 모바일 청첩장입니다. GitHub Pages에서 바로 배포되며, 참석 확인은 Google Apps Script URL을 연결하기 전까지 미리보기 모드로 동작합니다.

## 포함 기능

- 날짜, 장소, 지도, 참석 확인, 계좌를 빠르게 찾는 한국식 정보 구조
- 한국어 / English / العربية 초대 문구 탭
- 카카오톡 등 공유 미리보기를 위한 Open Graph 메타
- BGM 토글, 일정 `.ics` 저장, 실제 Google 지도 임베드, 지도 앱 링크, URL 공유, QR 코드
- 참석 여부 폼: 이름, 연락처 선택 입력, 신랑측/신부측, 참석 여부, 성인/아동 동행, 식사 여부, 할랄/채식, 전달사항
- 마음 전하실 곳 계좌 복사
- 별도 `admin.html` 참석/방명록 확인 페이지와 CSV 내보내기
- 방명록과 숨은 별 미니 인터랙션

## 수정 포인트

- 기본 예식 정보: `index.html`의 `#details`, `#directions`, `#letter`
- 공유 카드 문구: `index.html`의 `og:*`, `twitter:*` 메타
- 히어로 이미지: `assets/hero-seoul-cairo.png`
- 참석/방명록 저장소: `script.js`의 `ATTENDANCE_ENDPOINT`
- Google Apps Script 샘플: `google-apps-script.gs`

## Google Sheets 연결

1. Google Sheets를 만들고 `Extensions > Apps Script`를 엽니다.
2. `google-apps-script.gs` 내용을 붙여 넣습니다.
3. Web App으로 배포하고, 실행 권한은 본인, 접근 권한은 초대장 제출자가 접근 가능한 범위로 설정합니다.
4. 배포 URL을 `script.js`의 `ATTENDANCE_ENDPOINT`에 넣습니다.
5. 연결 전에는 초대장과 `admin.html` 모두 localStorage 미리보기 데이터만 표시합니다.

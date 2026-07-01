# Seoul to Cairo Mobile Wedding Invitation

정적 HTML/CSS/JS로 만든 모바일 청첩장 MVP입니다. 별도 설치 없이 `index.html`을 브라우저에서 열면 실행됩니다.

## 포함 기능

- 한국식 모바일 청첩장 레이아웃
- 서울에서 카이로까지 이어지는 히어로 이미지와 러브스토리
- 한국어 / English / العربية 초대 문구 탭
- BGM 토글, 일정 `.ics` 저장, 지도 링크, URL 공유, QR 코드
- RSVP 제출 후 피라미드 문 열림 효과
- 숨은 별 미니게임
- 사막 밤하늘 별 방명록
- 로컬 RSVP 요약과 CSV 내보내기

## 수정 포인트

- 기본 예식 정보: `script.js`의 `EVENT`와 `index.html`의 이름, 날짜, 장소 텍스트
- 지도 링크: `index.html`의 `#directions` 섹션
- 히어로 이미지: `assets/hero-seoul-cairo.png`
- RSVP/방명록 저장소: 현재는 브라우저 `localStorage` 기반이며, 실제 서비스에서는 Supabase/Firebase API로 교체하면 됩니다.

# 사사사모 – 사건을 사랑하는 사람들의 모임

GitHub Pages(정적 호스팅) + Firebase(Firestore, Authentication)로 동작하는 사이트입니다. 빌드 도구 없이 파일 그대로 배포돼요.

## 구조
- `index.html`, `style.css`, `app.js`, `assets/` : 화면과 동작
- `firebase-config.js` : Firebase 연결 값, 관리자 이메일(화면 표시용)
- `firestore.rules` : 보안 규칙 (실제 권한은 여기서 결정돼요)

## 데이터 구조 (Firestore)
| 컬렉션 | 내용 | 읽기 | 쓰기 |
|---|---|---|---|
| `meetups` | 모임 글(사진 포함) | 누구나 | 관리자 |
| `entries` | 신청 명단(이름, 또래, 대기/확정) | 누구나 | 누구나 '대기'로 등록, 변경·삭제는 관리자 |
| `entryPrivate` | 연락처, 계좌번호 | 관리자 | 누구나 등록만 |
| `qna` | 자주 묻는 질문 | 누구나 | 관리자 |
| `inbox` | 추가 질문 | 관리자 | 누구나 보내기만 |

연락처와 계좌번호를 `entries`와 분리해서 저장하는 이유는, 명단은 모두에게 보여야 하지만 개인정보는 관리자만 읽을 수 있어야 하기 때문이에요.

## 설정 순서
1. **Firebase 프로젝트 만들기**: https://console.firebase.google.com 에서 프로젝트 생성 (Spark 무료 요금제로 충분해요).
2. **Firestore 만들기**: 빌드 > Firestore Database > 데이터베이스 만들기 > 프로덕션 모드, 위치는 `asia-northeast3`(서울).
3. **로그인 켜기**: 빌드 > Authentication > 시작하기 > Sign-in method > **Google** 사용 설정.
   설정 > 승인된 도메인에 `내아이디.github.io`를 추가해요. (`localhost`는 기본으로 들어 있어요.)
4. **웹 앱 등록**: 프로젝트 설정 > 내 앱 > 웹(`</>`) 등록 후 나온 `firebaseConfig` 값을 `firebase-config.js`에 붙여넣고, `ADMIN_EMAILS`에 관리자 구글 계정을 적어요.
5. **보안 규칙 적용**: `firestore.rules`에서 `your-email@gmail.com`을 관리자 이메일로 바꾼 뒤, Firestore > 규칙 탭에 붙여넣고 게시해요.
6. **GitHub에 올리기**: 새 저장소를 만들고 이 폴더의 파일을 올려요. 저장소 Settings > Pages > Source를 `Deploy from a branch`, 브랜치 `main` / 폴더 `/ (root)`로 지정하면 `https://내아이디.github.io/저장소이름/` 에서 열려요.
7. **첫 실행**: 사이트에서 "관리자"를 눌러 구글 로그인 후, QnA와 모임 글을 등록해요.

로컬에서 확인하려면 이 폴더에서 `python3 -m http.server 8000` 실행 후 http://localhost:8000 으로 접속하세요. (파일을 더블클릭해서 열면 모듈이 동작하지 않아요.)

## 꼭 알아둘 점
- **Firebase 설정 값은 공개돼도 괜찮아요.** 보안은 규칙이 담당해요. 다만 Google Cloud 콘솔 > API 및 서비스 > 사용자 인증 정보에서 API 키의 HTTP 리퍼러를 `내아이디.github.io/*`로 제한해 두면 더 안전해요.
- **사진은 Firestore 문서 안에 저장돼요.** Cloud Storage는 2026년 2월부터 Blaze(종량제) 요금제가 필요해서 쓰지 않았어요. 사진은 자동으로 줄여 저장하고, 모임 하나당 합계 약 850KB를 넘으면 저장되지 않아요(대략 4~6장).
- **스팸 신청**은 규칙만으로 완전히 막기 어려워요. 문제가 생기면 Firebase App Check(reCAPTCHA)를 붙이는 걸 추천해요.
- **확정 인원 상한**은 관리자 화면에서 확인하고 막아요. 확정은 관리자만 바꿀 수 있어서 규칙으로 따로 막지는 않았어요.
- **개인정보**: 연락처와 계좌번호를 받으므로 신청 폼에 수집 목적 안내(환불·연락용)를 한 줄 넣고, 행사 후 삭제하는 걸 권장해요.
- 신청 직후 내가 낸 정보를 다시 수정하는 기능은 없어요. 변경은 모임장에게 요청하는 방식이에요.

# 3차 명세 — 퀴즈 유형 15종 (이어서 구현)

## 이미 끝난 것 (game.html 에 들어가 있음, 다시 하지 말 것)
- `.quiz` `.opts` `.opt` CSS 를 `--cols` / `--tile` 변수 방식으로 교체 (넘침 수정)
- 도우미 함수: `distJung` `distCho` `hasJong` `hasJongContrast` `noJong` `withJong`
  `numDistract` `weightedPick` `sino` + 상수 `CHO_CHAR` `CHO_SAY` `JONG_EASY` `SINO` `FALLBACK_CH`
- 이 함수들은 `makeDistractors` 뒤에 있음. 그대로 활용할 것

## 남은 것

### 유형 15종 (kind / diff / 보기수)
한글 8종:
- H_FIRST_E  ko 1 보기3 — 첫 글자 찾기(초성 고정, 중성만 다름)
- H_PIC      ko 1 보기3 — 머리를 ❓ 로, 포켓몬 그림 3장 중 고르기. 오답은 S.dex 우선
- H_FIRST_M  ko 2 보기3 — 첫 글자 찾기(초·중·종 섞임)
- H_LAST     ko 2 보기3 — 끝 글자 찾기. 조건 n.length>=2
- H_CHO      ko 3 보기3 — "ㅍ 소리로 시작하는 글자" (중성 고정, 초성만 다름)
- H_FILL     ko 3 보기3 — `피 ? 츄` 빠진 글자. 조건 n.length>=3
- H_JONG     ko 4 보기3 — 받침 있는 글자 고르기. judge=받침만 있으면 정답(복수정답 허용)
                          조건 hasJongContrast(wm)
- H_ORDER    ko diff=min(5,글자수+1) 보기=글자수(2~4) — 이름 순서대로 조립. 한 줄 배치

숫자 7종:
- N_COUNT    num 1 보기3 — 몬스터볼 개수 세기 (5개씩 두 줄)
- N_CMP      num 1 보기2 — 어느 쪽이 더 커?
- N_ADD      num 2 보기3 — 한자리 덧셈 (합<=9)
- N_LV       num 2 보기3 — "레벨이 3이야, 2 올라가면?"
- N_SUB      num 3 보기3 — 뺄셈. a=2~9, b=1~a 로 음수 원천 차단. 답 0 허용
- N_MISS     num 5 보기3 — `3 + ? = 7`
- N_ADD10    num 5 보기3 — 합 10 이상 덧셈 (아빠가 넣으라고 결정)

### 출제 알고리즘
```
foeTough(mi) = clamp(0..8, (hp-10)/3 + 진화단계 + (전설?4:0) + (mega?0.5:0))
   진화단계 = max(0, chainOf(mi).indexOf(mi))
skillCap() = dex>=16||lv>=15 ? 5 : dex>=9||lv>=10 ? 4 : dex>=4||lv>=5 ? 3 : 2
comfort()  = 최근 2문제 모두 2회 이상 틀림 → -99 (강제 최저+안심유형)
             직전 문제 2회 이상 틀림 → -1
             그 외 0
wantNumber() = p 기본 0.30, 직전이 숫자면 0.12, 한글 2연속이면 0.45
pickQuizType():
   want = 1 + round(foeTough/2) + comfort + pick([-1,0,0,0,1])
   want = clamp(1, skillCap(), want)
   comfort==-99 → want=1, 유형은 SAFE_IDS=['H_PIC','H_FIRST_E','N_COUNT'] 중에서만
   kind = wantNumber() ? 'num' : 'ko'
   후보 = kind 일치 && ok(wm) && |diff-want|<=1 && 최근3개에 없음
   비면 단계적으로 조건 완화 (직전과만 다르게 → 전체 → H_FIRST_E)
   난이도 가까운 것에 가중치 주고 weightedPick
```

### 상태
`S.qRecent = []` (최근3개 `{id,kind}`, 최신 앞), `S.qHist = []` (최근3개 틀린횟수).
**저장하지 않음** — `save()` 는 화이트리스트라 손대지 말 것. 기존 세이브 100% 호환.
기록: `openQuiz()` 에서 유형 정한 직후 qRecent, 정답 처리 시 qHist.

`S.quiz = {id, kind, head, headData, ask, cols, render, options, answer, judge, seq,
           placed, used, tries, want, speak}`
head: 'art'|'hidden'|'expr'|'balls'|'fill'
judge: 'equal'|'equalNum'|'equalIdx'|'hasJong'|'seq'

### 난이도 별표 (아빠 결정: 표시함)
문제 위에 `q.want` 개수만큼 ⭐. 문구는 **긍정적으로** — "⭐⭐⭐⭐ 도전!" 쪽.
"센 놈이야" 같은 겁주는 표현 금지.

### TTS 읽어주기
세기 → 고유어 `say('하나, 둘, 셋', {rate:0.55})`
연산 → 한자어 `say('삼 더하기 사는?', {rate:0.75})`  ※ `3+4` 를 그대로 넘기면 안 됨

### 레이아웃
`viewQuiz()` 가 `<div class="quiz" style="--cols:${q.cols}">` 로 열 수 전달.
`.opts.four` 클래스는 폐기됨 — 쓰지 말 것.
`.quiz` 는 `justify-content:center` 대신
`.quiz>*:first-child{margin-top:auto}` `.quiz>*:last-child{margin-bottom:auto}` + `overflow-y:auto`
(구형 사파리 호환 — 엄마 아이폰 대응)
신규 CSS 필요: `.quiz-expr` `.quiz-balls` `.qmark` `.opt.num` + 짧은폰 미디어쿼리 축소값

### 고칠 함수
`quizLevel()` 삭제 → 위 알고리즘 함수들로 대체
`openQuiz()` — pickQuizType → type.build(wm) → S.quiz 세팅 → qRecent 기록. 턴 가드 유지
`hearQuiz()` — `S.quiz.speak()` 호출로 축약
`answerFirst`/`answerOrder` → `answerPick(i)` 로 통합 (judge 분기).
   **기존 `lock(3400)`/`lock(3600)` 반드시 유지** (없애면 두 번 탭 버그 재발)
   qHist 기록 추가
`act()` 의 `case 'ans'`/`case 'ord'` → 둘 다 `answerPick(+arg)`

### 완충 (게임 제1원칙: 6살이 울면 안 된다)
오답 시 tries++ 와 흔들림만. HP감소·턴넘김·화면전환 없음.
tries>=2 → 정답에 .nudge + "반짝이는 걸 눌러 봐!"
tries>=3 → 오답 하나를 .used 로 흐리게 (seq 제외)  ※아빠 결정: 넣음
tries>=4 → hearQuiz() 자동 재생
정답이면 무조건 doCatch(). 실패로 놓치는 경로 없음.

## 절대 건드리지 말 것 (2차에서 만든 것)
MOVES moveSet myMove foeMove myPower foePower powClass
S.turn S.acting S.mvI endTurn T_SHOT T_TELE TURN_MS HEAL_MS
shoot boom fxAt centerOf
viewBattle attack foeTurn heal run doMega
.turnbar .statline .pw .shot .boom @keyframes telegraph/shotFly/boomPop
lock busy LOCKED_WHILE_BUSY adultGate
env(safe-area-inset-*) touch-action -webkit-touch-callout
doCatch 와 S.catching 가드

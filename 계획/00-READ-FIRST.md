# 모든 작업자가 먼저 읽을 것 — 공통 규칙

## 프로젝트
`D:\하준\HAJUN\game.html` — 6살 하준이용 한글학습 포켓몬 게임.
아빠가 아들을 위해 만듦. **안드로이드 갤럭시 S25+** 로 플레이 (엄마 아이폰으로도 가끔).
배포: GitHub Pages. 메인 담당자가 검증 후 자동 배포하므로 **작업자는 git/build 를 만지지 않는다.**

## 저장 데이터 — 호환 신경쓰지 말 것 (아빠 결정 2026-08-27)
> "우선 아예새로운 게임느낌이니 기존 데이터 날라가는건 괜찮아!"

- `save()` / `load()` 를 자유롭게 바꿔도 된다. 하위호환 검증에 시간 쓰지 말 것
- 형식이 크게 바뀌면 `SAVE_KEY` 버전을 올려(`pokemon-catch-v2` → `v3` …)
  옛 데이터를 깔끔히 무시하는 쪽이 낫다. 반쯤 깨진 상태로 로드되는 게 최악
- 단, **게임 도중에 진행도가 사라지는 버그는 여전히 안 됨** (세션 안에서는 유지돼야 함)

## 성능 — 걱정하지 말 것 (아빠 결정)
S25+ 는 고성능 게임도 돈다. 이펙트·그래픽을 아끼지 말고 화려하게.
`transform`/`opacity`/`filter` 위주 원칙만 지킬 것(레이아웃 깨짐 방지 목적).

## 절대 지킬 것 (게임 철학 — 아빠가 정함)
- **6살이 울면 안 된다.** 되돌릴 수 없는 손실, 막히는 상황, 벌 금지
- 빗나감 없음. 틀려도 벌 없음. 어떤 경우에도 아이가 갇히지 않게
- 무섭지 않게. 연출은 신나고 귀엽게
- 한 턴 3초 이내 (집중력)
- 정답은 항상 보상받아야 한다 — 맞혔는데 랜덤으로 손해 보는 설계 금지
- 글자보다 그림·색·움직임 위주. 읽을 글자는 크게

## 폰 레이아웃 (필수 검증)
- `360×640` 과 `375×812` 에서 **모든 화면** `scrollHeight <= innerHeight`
- 터치 타겟 44px 이상
- 짧은폰 대응 미디어쿼리 `@media (max-height:780px)` 에 새 요소도 반영
- `env(safe-area-inset-*)` `touch-action` `-webkit-touch-callout` 훼손 금지 (아이폰 대응)

## 작업 방식 (중요 — 사고 이력 있음)
파일이 크고 **한도 도달로 편집 중 중단된 사고가 있었다.**
**작은 단위로 나눠 편집하고 그때마다 JS 문법 검사.** 중간에 멈춰도 파일이 깨지지 않는 상태 유지가 최우선.

```
node -e "const fs=require('fs'),h=fs.readFileSync('D:/하준/HAJUN/game.html','utf8');[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((s,i)=>{try{new Function(s[1])}catch(e){console.log('script#'+i,e.message)}});console.log('done')"
```

## 금지
- `game.html` 외 파일 수정 금지 (`index.html` `build.js` `sprites\` `README.md`)
- `node build.js` 실행 금지, git 명령 금지 — 배포는 메인 담당자가 함
- `D:\하준\HAJUN` 안에 node_modules / package.json 생성 금지

## 완료된 단계 (훼손 금지 대상)
1차 그림67장·폰안전·진행버그 / 2차 턴제배틀·전투력 / 3차 퀴즈15종·숫자문제
4차 기술42종·이펙트12종·메가연출 / 5차 진화선택·보너스별
관련 심볼: `MOVES moveSet myMove foeMove fireMove shoot boom fxAt centerOf fx-*
mega-charge mgring megatag MEGA_MS charge-me charge-foe QUIZ_TYPES QUIZ_BY_ID
pickQuizType foeTough skillCap comfort wantNumber answerPick viewQuiz openQuiz
hearQuiz SAFE_IDS lock busy LOCKED_WHILE_BUSY adultGate doCatch S.catching
endTurn TURN_MS T_SHOT viewBattle attack foeTurn heal run doMega`

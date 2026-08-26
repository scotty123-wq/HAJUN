/* ============================================================
   이미지 넣기 + 게임 파일 만들기
   ------------------------------------------------------------
   sprites 폴더의 이미지를 game.html 안에 통째로 심고,
   PC용 index.html 을 새로 만듭니다.

   실행:  node build.js      (또는 이미지넣기.bat 더블클릭)
   ============================================================ */

const fs = require('fs');
const path = require('path');

const DIR        = __dirname;
const GAME       = path.join(DIR, 'game.html');
const INDEX      = path.join(DIR, 'index.html');
const SPRITE_DIR = path.join(DIR, 'sprites');

const MIME = {'.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
              '.webp':'image/webp', '.gif':'image/gif', '.svg':'image/svg+xml'};
const MAX_ONE   = 500 * 1024;        // 한 장이 이보다 크면 건너뜁니다
const WARN_TOTAL = 8 * 1024 * 1024;  // 전부 합쳐 이보다 크면 경고

/* ---- 1. sprites 폴더 읽기 ---- */

if(!fs.existsSync(SPRITE_DIR)){
  fs.mkdirSync(SPRITE_DIR);
  console.log('sprites 폴더를 새로 만들었습니다.');
}

const sprites = {};
let total = 0, skipped = [];

for(const file of fs.readdirSync(SPRITE_DIR)){
  const ext = path.extname(file).toLowerCase();
  const mime = MIME[ext];
  if(!mime) continue;

  const name = path.basename(file, ext).trim();
  const full = path.join(SPRITE_DIR, file);
  const size = fs.statSync(full).size;

  if(size > MAX_ONE){
    skipped.push(`${file} (${Math.round(size/1024)}KB — 너무 큽니다)`);
    continue;
  }
  sprites[name] = `data:${mime};base64,` + fs.readFileSync(full).toString('base64');
  total += size;
}

/* ---- 2. game.html 에 심기 ---- */

let html = fs.readFileSync(GAME, 'utf8');
const START = '/*SPRITES_START*/', END = '/*SPRITES_END*/';
const a = html.indexOf(START), b = html.indexOf(END);

if(a < 0 || b < 0){
  console.error('game.html 에서 이미지 자리를 찾지 못했습니다. 파일이 손상된 것 같습니다.');
  process.exit(1);
}

const block = START + '\nvar SPRITES = ' + JSON.stringify(sprites) + ';\n';
html = html.slice(0, a) + block + html.slice(b);
fs.writeFileSync(GAME, html, 'utf8');

/* ---- 3. PC용 index.html 만들기 ---- */

const HEAD = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#24713C">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>하준아 포켓몬 잡으러 가자!</title>
</head>
<body>
`;
fs.writeFileSync(INDEX, HEAD + html + '\n</body>\n</html>\n', 'utf8');

/* ---- 4. 결과 알려주기 ---- */

const names = Object.keys(sprites);
console.log('');
console.log('===========================================');
if(names.length === 0){
  console.log('  넣은 이미지: 없음');
  console.log('');
  console.log('  sprites 폴더에 이미지를 넣어 보세요.');
  console.log('  파일 이름을 포켓몬 이름으로 지으면 됩니다.');
  console.log('    예)  sprites/피카츄.png');
  console.log('         sprites/꼬부기.png');
} else {
  console.log(`  넣은 이미지: ${names.length}장  (${Math.round(total/1024)}KB)`);
  console.log('  ' + names.join(', '));
}
if(skipped.length){
  console.log('');
  console.log('  건너뛴 파일:');
  skipped.forEach(s => console.log('    - ' + s));
  console.log('  (그림판 등으로 크기를 줄여서 다시 넣어 주세요)');
}
if(total > WARN_TOTAL){
  console.log('');
  console.log('  ⚠ 이미지가 너무 많아 폰 링크에는 안 올라갈 수 있습니다.');
  console.log('    PC 에서는 그대로 잘 됩니다.');
}
console.log('');
console.log('  index.html 을 새로 만들었습니다. 더블클릭해서 확인해 보세요.');
console.log('===========================================');
console.log('');

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
<meta name="robots" content="noindex, nofollow">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="하준이 포켓몬">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" href="icon-192.png">
<title>하준아 포켓몬 잡으러 가자!</title>
</head>
<body>
`;
/* 인터넷이 끊겨도 돌아가게 하는 부분 — 주소로 열었을 때만 켜집니다 */
const FOOT = `
<script>
if('serviceWorker' in navigator && location.protocol === 'https:'){
  addEventListener('load', function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });
}
</script>
</body>
</html>
`;
fs.writeFileSync(INDEX, HEAD + html + FOOT, 'utf8');

/* ---- 3-2. 앱 아이콘 ---- */

const ICONS = [192,512,180].map(s => `icon-${s}.png`);
if(ICONS.some(f => !fs.existsSync(path.join(DIR, f)))){
  console.log('  앱 아이콘을 만드는 중...');
  require('./make-icons.js');
}

/* ---- 3-3. 홈 화면 추가 정보 ---- */

fs.writeFileSync(path.join(DIR,'manifest.webmanifest'), JSON.stringify({
  name: '하준아 포켓몬 잡으러 가자!',
  short_name: '하준이 포켓몬',
  lang: 'ko',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#24713C',
  theme_color: '#24713C',
  icons: [
    {src:'icon-192.png', sizes:'192x192', type:'image/png', purpose:'any'},
    {src:'icon-512.png', sizes:'512x512', type:'image/png', purpose:'any'},
    {src:'icon-512.png', sizes:'512x512', type:'image/png', purpose:'maskable'}
  ]
}, null, 2), 'utf8');

/* ---- 3-4. 오프라인 캐시 (게임이 바뀌면 자동으로 새 버전을 받습니다) ---- */

const stamp = require('crypto').createHash('sha1')
  .update(fs.readFileSync(INDEX)).digest('hex').slice(0,10);

fs.writeFileSync(path.join(DIR,'sw.js'),
`/* 자동 생성 파일 — 직접 고치지 마세요. build.js 가 다시 만듭니다. */
const CACHE = 'hajun-pokemon-${stamp}';
const ASSETS = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
`, 'utf8');

/* ---- 3-5. 검색엔진 차단 ---- */

fs.writeFileSync(path.join(DIR,'robots.txt'), 'User-agent: *\nDisallow: /\n', 'utf8');

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

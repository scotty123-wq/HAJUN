/* 앱 아이콘(몬스터볼) PNG 만들기 — 외부 라이브러리 없이 직접 그립니다.
   실행: node make-icons.js   (build.js 가 알아서 부르므로 따로 실행할 필요 없음) */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ---- PNG 인코더 ---- */
const CRC = (() => {
  const t = new Int32Array(256);
  for(let n=0;n<256;n++){
    let c = n;
    for(let k=0;k<8;k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf){
  let c = 0xFFFFFFFF;
  for(let i=0;i<buf.length;i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function png(width, height, rgba){
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 6;    // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for(let y=0;y<height;y++){
    raw[y*(width*4+1)] = 0;   // filter: none
    rgba.copy(raw, y*(width*4+1)+1, y*width*4, (y+1)*width*4);
  }
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, {level:9})),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---- 몬스터볼 그리기 ---- */
const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const BG    = hex('#2F8A47');
const RED   = hex('#E8412F');
const WHITE = hex('#FFFFFF');
const INK   = hex('#26331F');
const GREY  = hex('#E9E4D4');

function shade(x, y, S){
  /* 한 점의 색을 정합니다. 좌표는 0..S */
  const c = S/2;
  const R = S*0.355;                 // 공 반지름
  const ring = S*0.030;              // 테두리 굵기
  const band = S*0.036;              // 가운데 검은 띠
  const btnR = S*0.108;              // 가운데 버튼
  const btnRing = S*0.026;
  const dx = x-c, dy = y-c;
  const d = Math.sqrt(dx*dx + dy*dy);

  if(d > R + ring) return BG;                     // 배경
  if(d > R) return INK;                           // 바깥 테두리
  if(d <= btnR + btnRing){                        // 가운데 버튼
    if(d > btnR) return INK;
    return d > btnR*0.55 ? WHITE : GREY;
  }
  if(Math.abs(dy) <= band) return INK;            // 가운데 띠
  return dy < 0 ? RED : WHITE;                    // 위 빨강 / 아래 흰색
}

function makeIcon(S){
  const buf = Buffer.alloc(S*S*4);
  const SS = 3;                                   // 3x3 슈퍼샘플링 (계단 현상 방지)
  for(let y=0;y<S;y++){
    for(let x=0;x<S;x++){
      let r=0,g=0,b=0;
      for(let sy=0;sy<SS;sy++) for(let sx=0;sx<SS;sx++){
        const col = shade(x + (sx+0.5)/SS, y + (sy+0.5)/SS, S);
        r+=col[0]; g+=col[1]; b+=col[2];
      }
      const n = SS*SS, i = (y*S+x)*4;
      buf[i]=Math.round(r/n); buf[i+1]=Math.round(g/n); buf[i+2]=Math.round(b/n); buf[i+3]=255;
    }
  }
  return png(S, S, buf);
}

const OUT = __dirname;
for(const size of [192, 512, 180]){
  const file = path.join(OUT, `icon-${size}.png`);
  fs.writeFileSync(file, makeIcon(size));
  console.log(`  icon-${size}.png (${Math.round(fs.statSync(file).size/1024)}KB)`);
}

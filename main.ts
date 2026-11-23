import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

// World News - 22 November 2026. Deterministic newspaper front page,
// 1024x1024 PNG, drawn from scratch: own 5x7 bitmap font, own PNG encoder.
// Standard library only. No network, no Date, no randomness.

const W = 1024;
const H = 1024;
const OUT = "world-news-22-november-2026.png";

const WHITE: [number, number, number] = [250, 248, 240];
const PAPER: [number, number, number] = [250, 248, 240];
const INK: [number, number, number] = [18, 18, 18];
const GREY: [number, number, number] = [110, 108, 100];
const RED: [number, number, number] = [150, 30, 25];

// ---------------------------------------------------------------- canvas
const px = new Uint8Array(W * H * 3);
function paintAll(c: [number, number, number]): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0];
    px[i * 3 + 1] = c[1];
    px[i * 3 + 2] = c[2];
  }
}
function setPix(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function fillRect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPix(xx, yy, c);
  }
}
function hRule(x: number, y: number, w: number, thick: number, c: [number, number, number]): void {
  fillRect(x, y, w, thick, c);
}
function vRule(x: number, y: number, h: number, thick: number, c: [number, number, number]): void {
  fillRect(x, y, thick, h, c);
}
function boxOutline(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  hRule(x, y, w, 1, c);
  hRule(x, y + h - 1, w, 1, c);
  vRule(x, y, h, 1, c);
  vRule(x + w - 1, y, h, 1, c);
}

// ------------------------------------------------------- 5x7 bitmap font
// Each glyph: 7 rows, each a 5-bit number, bit 4 = leftmost column.
type Glyph = number[];
const FONT: Record<string, Glyph> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  a: [0x00, 0x00, 0x0e, 0x01, 0x0f, 0x11, 0x0f],
  b: [0x10, 0x10, 0x16, 0x19, 0x11, 0x11, 0x1e],
  c: [0x00, 0x00, 0x0e, 0x10, 0x10, 0x10, 0x0e],
  d: [0x01, 0x01, 0x0d, 0x13, 0x11, 0x11, 0x0f],
  e: [0x00, 0x00, 0x0e, 0x11, 0x1f, 0x10, 0x0e],
  f: [0x06, 0x08, 0x1e, 0x08, 0x08, 0x08, 0x08],
  g: [0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  h: [0x10, 0x10, 0x16, 0x19, 0x11, 0x11, 0x11],
  i: [0x04, 0x00, 0x0c, 0x04, 0x04, 0x04, 0x0e],
  j: [0x02, 0x00, 0x06, 0x02, 0x02, 0x12, 0x0c],
  k: [0x10, 0x10, 0x12, 0x14, 0x18, 0x14, 0x11],
  l: [0x0c, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  m: [0x00, 0x00, 0x1a, 0x15, 0x15, 0x15, 0x15],
  n: [0x00, 0x00, 0x16, 0x19, 0x11, 0x11, 0x11],
  o: [0x00, 0x00, 0x0e, 0x11, 0x11, 0x11, 0x0e],
  p: [0x00, 0x00, 0x1e, 0x11, 0x1e, 0x10, 0x10],
  q: [0x00, 0x00, 0x0d, 0x13, 0x0f, 0x01, 0x01],
  r: [0x00, 0x00, 0x16, 0x19, 0x10, 0x10, 0x10],
  s: [0x00, 0x00, 0x0f, 0x10, 0x0e, 0x01, 0x1e],
  t: [0x08, 0x08, 0x1e, 0x08, 0x08, 0x09, 0x06],
  u: [0x00, 0x00, 0x11, 0x11, 0x11, 0x13, 0x0d],
  v: [0x00, 0x00, 0x11, 0x11, 0x11, 0x0a, 0x04],
  w: [0x00, 0x00, 0x11, 0x15, 0x15, 0x15, 0x0a],
  x: [0x00, 0x00, 0x11, 0x0a, 0x04, 0x0a, 0x11],
  y: [0x00, 0x00, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  z: [0x00, 0x00, 0x1f, 0x02, 0x04, 0x08, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ",": [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  '"': [0x0a, 0x0a, 0, 0, 0, 0, 0],
  "-": [0, 0, 0, 0x1f, 0, 0, 0],
  ";": [0, 0, 0x0c, 0, 0x0c, 0x04, 0x08],
  ":": [0, 0, 0x0c, 0, 0x0c, 0x0c, 0],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
  "/": [0x01, 0x02, 0x02, 0x04, 0x08, 0x08, 0x10],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "%": [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "+": [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  "=": [0, 0, 0x1f, 0, 0x1f, 0, 0],
  "*": [0, 0x04, 0x15, 0x0e, 0x15, 0x04, 0],
};

function glyphOf(ch: string): Glyph {
  return FONT[ch] ?? FONT["?"];
}
function textWidth(text: string, scale: number): number {
  return text.length * 6 * scale - scale;
}
function drawChar(x: number, y: number, ch: string, scale: number, c: [number, number, number]): void {
  const g = glyphOf(ch);
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      if ((g[row] >> (4 - col)) & 1) {
        fillRect(x + col * scale, y + row * scale, scale, scale, c);
      }
    }
  }
}
function drawText(x: number, y: number, text: string, scale: number, c: [number, number, number]): number {
  let cx = x;
  for (const ch of text) {
    drawChar(cx, y, ch, scale, c);
    cx += 6 * scale;
  }
  return cx;
}
function drawCentred(y: number, text: string, scale: number, c: [number, number, number]): void {
  const w = textWidth(text, scale);
  drawText(Math.floor((W - w) / 2), y, text, scale, c);
}
function wrapWords(text: string, maxWidth: number, scale: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const test = cur === "" ? word : cur + " " + word;
    if (textWidth(test, scale) <= maxWidth || cur === "") {
      cur = test;
    } else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}
function drawWrapped(x: number, y: number, text: string, maxWidth: number, scale: number, lineGap: number, c: [number, number, number]): number {
  const lines = wrapWords(text, maxWidth, scale);
  let yy = y;
  for (const line of lines) {
    drawText(x, yy, line, scale, c);
    yy += 7 * scale + lineGap;
  }
  return yy;
}

// ------------------------------------------------------------- PNG encoder
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePng(): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, pngChunk("IHDR", ihdr), pngChunk("IDAT", idat), pngChunk("IEND", Buffer.alloc(0))]);
}

// ------------------------------------------------------------------ stories
type Story = { tag: string; head: string; body: string };
const LEAD: Story = {
  tag: "CLIMATE SUMMIT - ANTALYA, TURKEY",
  head: "COP31 ENDS WITHOUT A DEAL",
  body: "The COP31 climate summit in Antalya, Turkey, ended without an agreement after the European Union and about 130 parties rejected a draft text that made no mention of fossil fuels. The talks ran two days over schedule, making it the longest United Nations climate summit ever held. Negotiators left Antalya with no deal on the central question of phasing out fossil fuels. Delegates said the rejected draft failed to reflect the urgency of cutting emissions.",
};
const STORIES: Story[] = [
  {
    tag: "MIDDLE EAST",
    head: "IRAN STRIKES CIVILIAN SITE IN BAHRAIN",
    body: "Iran struck a civilian industrial site on Sitra Island in Bahrain, injuring two people, one of them critically. The Islamic Revolutionary Guard Corps said it had targeted United States air defences. Saudi Arabia, Qatar and the United Arab Emirates condemned the attack. Two supertankers were also hit by mines and caught fire near the Strait of Hormuz.",
  },
  {
    tag: "UKRAINE",
    head: "RUSSIAN DRONE HITS FLAT BLOCK IN DYMER",
    body: "A Russian drone struck a five-storey apartment block in Dymer, near Kyiv, killing at least two people. Fourteen people were feared trapped under the rubble in the early reports. Rescue teams searched the wreckage through the night. The strike hit homes far from the front line.",
  },
  {
    tag: "BALTIC SEA",
    head: "RUSSIAN CARGO SHIP HIT IN GULF OF FINLAND",
    body: "The Russian cargo ship Sparta II was hit by a drone attack in the Gulf of Finland and caught fire. The burning vessel drifted into Finnish waters as the crew fought the blaze. All 16 crew members were evacuated to safety. Finnish authorities monitored the drifting ship.",
  },
  {
    tag: "LIBYA",
    head: "UKRAINIAN SEA DRONES SINK RUSSIAN CORVETTE",
    body: "Ukrainian sea drones sank the Russian corvette Merkuriy in the port of Benghazi, Libya. A second cargo vessel, the MV Angara, was also hit in the attack. The strike showed Ukrainian sea drones reaching far beyond the Black Sea. Russian officials did not immediately confirm the loss.",
  },
  {
    tag: "SUDAN",
    head: "DRONE STRIKES HIT HOMES AND UN SITE IN KHARTOUM",
    body: "Drone strikes hit homes and a United Nations building in Khartoum, Sudan. The strikes hit residential areas of the capital as well as the UN site. The attacks underlined the risks facing civilians and aid operations in the city. Fighting in Sudan has already forced many families to flee their homes.",
  },
  {
    tag: "INDONESIA",
    head: "CANDY FACTORY FIRE KILLS THREE, 36 MISSING",
    body: "A fire at a candy factory in Indonesia killed at least three people. Thirty-six people were reported missing after the blaze. Firefighters and rescue teams searched the damaged factory for the missing workers. The fire left families waiting for news of their loved ones.",
  },
  {
    tag: "GAZA",
    head: "INSULIN SHORTAGE HITS CHILDREN IN GAZA",
    body: "Insulin shortages in Gaza are affecting children. Families struggle to find the medicine that children with diabetes need every day. Health workers warn that gaps in supply put young patients at serious risk. The shortage is one more strain on Gaza's health system.",
  },
  {
    tag: "UKRAINE",
    head: "DOUBLE-TAP STRIKE KILLS CHILD IN KRYVYI RIH",
    body: "A Russian double-tap strike on Kryvyi Rih killed two people, including a seven-year-old child. About 60 people were injured in the attack. The second strike hit as rescuers were responding to the first. Homes and civilian buildings were damaged in the attack.",
  },
  {
    tag: "UNITED STATES",
    head: "TRUMP SEEKS LASTING DEAL WITH IRAN",
    body: "President Trump said he wants a permanent deal with Iran. He suggested he may not decide on next steps until 2027. The remarks left the timing of any further action unclear. The comments signalled no immediate decision on what comes next.",
  },
];

// ------------------------------------------------------------------- layout
function drawFrontPage(): void {
  paintAll(PAPER);
  const M = 36;
  const CW = W - M * 2;

  // Masthead
  drawCentred(22, "THE WORLD HERALD", 5, INK);
  drawCentred(66, "Sunday, 22 November 2026", 2, INK);
  fillRect(200, 70, 14, 14, RED);
  fillRect(W - 214, 70, 14, 14, RED);
  hRule(M, 92, CW, 4, INK);
  hRule(M, 100, CW, 1, INK);
  drawCentred(108, "THE WORLD IN ONE PAGE - ALL STORIES FROM 22 NOVEMBER 2026", 1, GREY);

  // Lead story
  let y = 132;
  drawText(M, y, LEAD.tag, 1, RED);
  y += 14;
  y = drawWrapped(M, y, LEAD.head, CW, 3, 4, INK);
  y += 6;
  hRule(M, y, CW, 1, GREY);
  y += 10;
  y = drawWrapped(M, y, LEAD.body, CW, 2, 4, INK);
  y += 12;
  hRule(M, y, CW, 3, INK);

  // Grid of nine stories: 3 columns x 3 rows
  const gridTop = y + 14;
  const gridBottom = 896;
  const gap = 18;
  const cellW = Math.floor((CW - gap * 2) / 3);
  const cellH = Math.floor((gridBottom - gridTop - gap * 2) / 3);
  for (let idx = 0; idx < STORIES.length; idx++) {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = M + col * (cellW + gap);
    const cy = gridTop + row * (cellH + gap);
    const s = STORIES[idx];
    let sy = cy;
    drawText(x, sy, s.tag, 1, RED);
    sy += 13;
    sy = drawWrapped(x, sy, s.head, cellW, 2, 2, INK);
    sy += 4;
    hRule(x, sy, cellW, 1, GREY);
    sy += 7;
    drawWrapped(x, sy, s.body, cellW, 1, 3, INK);
    if (col < 2) vRule(x + cellW + Math.floor(gap / 2), cy, cellH, 1, GREY);
  }

  // By the numbers: figures drawn only from the stories above
  const stats: [string, string][] = [
    ["130", "parties rejected the COP31 draft text"],
    ["16", "crew evacuated from the Sparta II"],
    ["36", "missing after the Indonesia factory fire"],
    ["60", "injured in the Kryvyi Rih strike"],
  ];
  hRule(M, 908, CW, 3, INK);
  drawText(M, 920, "BY THE NUMBERS", 1, RED);
  const statW = Math.floor(CW / 4);
  for (let i = 0; i < stats.length; i++) {
    const sx = M + i * statW;
    drawText(sx, 936, stats[i][0], 3, INK);
    drawWrapped(sx, 962, stats[i][1], statW - 16, 1, 2, GREY);
  }

  // Footer
  hRule(M, 984, CW, 1, INK);
  drawCentred(992, "THE WORLD HERALD - Sunday, 22 November 2026 - Page 1", 1, GREY);
}

function main(): void {
  drawFrontPage();
  const png = encodePng();
  writeFileSync(OUT, png);
  console.log(`Wrote ${OUT} (${png.length} bytes, ${W}x${H})`);
}

main();

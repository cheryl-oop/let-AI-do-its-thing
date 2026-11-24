import type { MoodBand } from "./types";
export const PET_SIZE = 36;
export const PET_SCALE = 8;

const OX = 5;
const OY = 3;

interface Palette {
  outline: string;
  base: string;
  light: string;
  shade: string;
  brown: string;
  tan: string;
  face: string;
  cream: string;
  blush: string;
  leaf: string;
  leafLight: string;
}

const HAPPY: Palette = {
  outline: "#a70639",
  base: "#e04655",
  light: "#ffa694",
  shade: "#b1294f",
  brown: "#9e2c38",
  tan: "#cdb678",
  face: "#fffffb",
  cream: "#ebe8d0",
  blush: "#ffb1be",
  leaf: "#2da63c",
  leafLight: "#91ef5f",
};

const BORED: Palette = {
  outline: "#c4707e",
  base: "#db919c",
  light: "#e6bec4",
  shade: "#a2b3b7",
  brown: "#8d5c50",
  tan: "#b59f6b",
  face: "#f6f1e8",
  cream: "#e4d9c2",
  blush: "#e4babf",
  leaf: "#7ea55f",
  leafLight: "#a3c586",
};

const MAD: Palette = {
  outline: "#c63a52",
  base: "#e8576f",
  light: "#f27f90",
  shade: "#cf4259",
  brown: "#903943",
  tan: "#d07187",
  face: "#ffdede",
  cream: "#ecbac3",
  blush: "#e06580",
  leaf: "#2f8a2e",
  leafLight: "#83b348",
};

const PALETTES: Record<MoodBand, Palette> = {
  happy: HAPPY,
  bored: BORED,
  mad: MAD,
};

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** [row, column, pixels]. Each character is one pixel; "." is transparent. */
type Stamp = [row: number, col: number, pixels: string];

function stamp(
  ctx: CanvasRenderingContext2D,
  y0: number,
  stamps: Stamp[],
  colors: Record<string, string>,
) {
  for (const [row, col, pixels] of stamps) {
    for (let i = 0; i < pixels.length; i++) {
      const color = colors[pixels[i]];
      if (color) box(ctx, OX + col + i, y0 + row, 1, 1, color);
    }
  }
}

/** [left, right] column of the apple for rows 6..27. */
const SPANS: Array<[number, number]> = [
  [7, 19], // 6  (top edge)
  [5, 21],
  [3, 23],
  [2, 24],
  [1, 25],
  [1, 25],
  [1, 25], // 12
  [0, 26],
  [0, 26],
  [0, 26],
  [0, 26],
  [0, 26],
  [0, 26],
  [0, 26], // 19
  [1, 25],
  [1, 25],
  [2, 24],
  [2, 24],
  [3, 23],
  [4, 22],
  [6, 20],
  [8, 18], // 27 (bottom edge)
];
const BODY_TOP = 6;
const BODY_BOTTOM = 27;

function drawBody(ctx: CanvasRenderingContext2D, y0: number, pal: Palette) {
  SPANS.forEach(([left, right], i) => {
    const row = BODY_TOP + i;
    const y = y0 + row;

    // Top and bottom rows are one solid outline strip.
    if (row === BODY_TOP || row === BODY_BOTTOM) {
      box(ctx, OX + left, y, right - left + 1, 1, pal.outline);
      return;
    }

    // Outline thickness = how far the edge stepped in from the neighbouring row.
    const neighbour = row <= 19 ? SPANS[i - 1] : SPANS[i + 1];
    const w = Math.max(1, Math.abs(neighbour[0] - left));

    box(ctx, OX + left, y, right - left + 1, 1, pal.base);
    box(ctx, OX + left, y, w, 1, pal.outline);
    box(ctx, OX + right - w + 1, y, w, 1, pal.outline);

    // Soft highlight on the left (bigger near the top), shade on the right.
    const lightW = row <= 12 ? 6 : 2;
    box(ctx, OX + left + w, y, lightW, 1, pal.light);
    if (row >= 9) box(ctx, OX + right - w - 2, y, 3, 1, pal.shade);
  });
}

const CLEFT: Stamp[] = [
  [8, 10, "o"],
  [8, 16, "o"],
  [9, 11, "ooooo"],
];

const STEM: Stamp[] = [
  [0, 11, "bb"],
  [1, 10, "bttb"],
  [2, 10, "bttb"],
  [3, 11, "btb"],
  [4, 12, "btb"],
  [5, 12, "btb"],
  [6, 12, "btb"],
  [7, 12, "btb"],
  [8, 12, "btb"],
];

const LEAF: Stamp[] = [
  [0, 16, "gggg"],
  [1, 15, "gLLLLg"],
  [2, 14, "gLLLLLLg"],
  [3, 15, "gLLLLg"],
  [4, 16, "gggg"],
];

/** Cat-face window. Columns 4..20, rows 13..24. b = brown, w = face, c = cream. */
const FACE: Stamp[] = [
  [13, 4, "bbb...........bbb"],
  [14, 4, "bwwbb.bbbbb.bbwwb"],
  [15, 4, "bwwwwbwwwwwbwwwwb"],
  [16, 4, "bwwwwwwwwwwwwwwcb"],
  [17, 4, "bwwwwwwwwwwwwwccb"],
  [18, 4, "bwwwwwwwwwwwwwccb"],
  [19, 4, "bwwwwwwwwwwwwwccb"],
  [20, 4, "bwwwwwwwwwwwwwwcb"],
  [21, 4, "bwwwwwwwwwwwwwwwb"],
  [22, 4, ".bwwwwwwwwwwwwwb."],
  [23, 4, "..bbcccccccccbb.."],
  [24, 4, "....bbbbbbbbb...."],
];

const TAIL: Stamp[] = [
  [24, 24, "cb"],
  [25, 24, "cb"],
  [26, 23, "cb"],
];

const FEET: Stamp[] = [
  [28, 7, "bwwb"],
  [29, 7, ".bb."],
  [28, 16, "bwwb"],
  [29, 16, ".bb."],
];

/**
 * Draws the Tomodoro: a pink apple with a white cat face window, brown stem,
 * green leaf, little feet and a tail. Authored on a 27x31 pixel grid
 * (traced from the reference art) and scaled up with smoothing disabled.
 */
export function drawPet(
  ctx: CanvasRenderingContext2D,
  options: { band: MoodBand; time: number },
) {
  const { band, time } = options;
  const pal = PALETTES[band];

  ctx.clearRect(0, 0, PET_SIZE, PET_SIZE);

  // Hop: body lifts 1px on half the cycle, feet stay planted.
  const lift = Math.sin(time / 600) > 0 ? 0 : -1;
  const shake = band === "mad" ? (Math.floor(time / 140) % 2 === 0 ? 1 : 0) : 0;
  const y0 = OY + lift;
  const ox = OX + shake;

  const colors = {
    o: pal.outline,
    b: pal.brown,
    t: pal.tan,
    w: pal.face,
    c: pal.cream,
    g: pal.leaf,
    L: pal.leafLight,
  };

  // Feet first so the body overlaps them
  ctx.save();
  ctx.translate(shake, 0);
  stamp(ctx, OY, FEET, colors);

  drawBody(ctx, y0, pal);
  stamp(ctx, y0, TAIL, colors);
  stamp(ctx, y0, CLEFT, colors);
  stamp(ctx, y0, STEM, colors);
  stamp(ctx, y0, LEAF, colors);
  stamp(ctx, y0, FACE, colors);

  // Face details (columns/rows are sprite coordinates)
  const px = (c: number, r: number, w = 1, h = 1, color = pal.brown) =>
    box(ctx, OX + c, y0 + r, w, h, color);

  // Blush
  px(6, 21, 2, 2, pal.blush);
  px(17, 21, 2, 2, pal.blush);

  if (band === "happy") {
    px(7, 20, 2, 2); // eyes
    px(16, 20, 2, 2);
    px(10, 21); // zigzag mouth
    px(12, 21);
    px(14, 21);
    px(11, 22);
    px(13, 22);
  } else if (band === "bored") {
    px(7, 21, 2, 1); // half-closed eyes
    px(16, 21, 2, 1);
    px(11, 22, 3, 1); // flat mouth
  } else {
    px(7, 20, 2, 2); // eyes
    px(16, 20, 2, 2);
    px(6, 18, 2, 1); // angry brows
    px(8, 19, 2, 1);
    px(17, 18, 2, 1);
    px(15, 19, 2, 1);
    px(11, 21, 3, 1); // frown
    px(10, 22);
    px(14, 22);
  }
  ctx.restore();

  // Mood effects
  if (band === "happy") {
    const phase = Math.floor(time / 380) % 4;
    const sparkles: Array<[number, number]> = [
      [5, 14],
      [42, 18],
      [4, 28],
      [43, 36],
    ];
    sparkles.forEach(([x, y], index) => {
      if ((phase + index) % 4 !== 0) return;
      box(ctx, x, y, 1, 1, "#fff0a8");
      box(ctx, x - 1, y, 1, 1, "#ffe98a");
      box(ctx, x + 1, y, 1, 1, "#ffe98a");
      box(ctx, x, y - 1, 1, 1, "#fffbe0");
      box(ctx, x, y + 1, 1, 1, "#fffbe0");
    });
  } else if (band === "bored") {
    const drift = Math.floor(time / 900) % 6;
    const zx = ox + 26;
    const zy = 4 + drift;
    box(ctx, zx, zy, 3, 1, "#9f8cff");
    box(ctx, zx + 1, zy + 1, 1, 1, "#9f8cff");
    box(ctx, zx, zy + 2, 3, 1, "#9f8cff");
  } else {
    const rise = Math.floor(time / 260) % 5;
    box(ctx, ox - 4, 18 - rise, 2, 2, "#c7b7ff");
    box(ctx, ox + 30, 20 - ((rise + 2) % 5), 2, 2, "#c7b7ff");
    box(ctx, ox - 2, 14 - ((rise + 3) % 4), 1, 1, "#e2d8ff");
  }
}

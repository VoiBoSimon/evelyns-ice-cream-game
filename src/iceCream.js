// Shared ice-cream data + renderer. Used by CreateScene (live preview) and
// GalleryScene (showing saved creations). Self-contained so it can be reused
// without touching GameScene's matching-game catalogue.

export const CONE_STYLE = {
  Wafer:  { coneCol: 0xfde68a, border: 0xca8a04 },
  Sugar:  { coneCol: 0xfbbf24, border: 0xb45309 },
  Waffle: { coneCol: 0xf59e0b, border: 0x92400e },
}

export const CONE_KEYS = ['Wafer', 'Sugar', 'Waffle']

// Traditional English ice-cream-van flavours kids love.
export const CREATE_FLAVOURS = [
  { name: 'Vanilla',    colour: 0xfffde7, border: 0xf9a825 },
  { name: 'Chocolate',  colour: 0x8d5534, border: 0x3e2723 },
  { name: 'Strawberry', colour: 0xf48fb1, border: 0xc2185b },
  { name: 'Mint Choc',  colour: 0xa5d6a7, border: 0x388e3c },
  { name: 'Raspberry',  colour: 0xfb7185, border: 0xe11d48 },
  { name: 'Banana',     colour: 0xfde047, border: 0xca8a04 },
  { name: 'Bubblegum',  colour: 0x60a5fa, border: 0x2563eb },
  { name: 'Toffee',     colour: 0xd4a574, border: 0x92400e },
]

export const CREATE_TOPPINGS = ['Sprinkles', 'Flake', 'Sauce', 'Cherry']

export const MAX_SCOOPS = 3

const ADJ = [
  'Rainbow', 'Magic', 'Super', 'Wobbly', 'Giant', 'Sparkly', 'Crazy',
  'Dreamy', 'Mega', 'Silly', 'Galaxy', 'Unicorn', 'Bouncy', 'Cosmic',
]
const NOUN = [
  'Swirl', 'Tower', 'Dream', 'Delight', 'Monster', 'Mountain', 'Surprise',
  'Cloud', 'Twist', 'Sundae', 'Wonder', 'Whirl',
]

export function randomName() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)]
  const n = NOUN[Math.floor(Math.random() * NOUN.length)]
  return `${a} ${n}`
}

export function defaultDesign() {
  return { name: randomName(), cone: 'Wafer', scoops: [0xfffde7], toppings: [] }
}

function borderFor(colour) {
  const f = CREATE_FLAVOURS.find((flav) => flav.colour === colour)
  return f ? f.border : 0x9ca3af
}

// Draw a complete ice cream onto a Graphics object `g`, with the cone tip at
// (cx, baseY). `scale` sizes the whole thing. `design` = { cone, scoops[], toppings[] }.
export function drawIceCream(g, cx, baseY, design, scale = 1) {
  const s = scale
  const cone = CONE_STYLE[design.cone] || CONE_STYLE.Wafer
  const scoops = design.scoops && design.scoops.length ? design.scoops : [0xfffde7]
  const toppings = design.toppings || []

  // ── Cone ──
  const coneTopY = baseY - 48 * s
  const halfW = 19 * s
  g.fillStyle(0x000000, 0.10)
  g.fillTriangle(cx - halfW + 2 * s, coneTopY + 3 * s, cx + halfW + 2 * s, coneTopY + 3 * s, cx + 2 * s, baseY + 3 * s)
  g.fillStyle(cone.coneCol)
  g.fillTriangle(cx - halfW, coneTopY, cx + halfW, coneTopY, cx, baseY)
  g.lineStyle(2 * s, cone.border, 0.85)
  g.strokeTriangle(cx - halfW, coneTopY, cx + halfW, coneTopY, cx, baseY)
  if (design.cone === 'Waffle') {
    g.lineStyle(1 * s, cone.border, 0.45)
    g.beginPath(); g.moveTo(cx - halfW, coneTopY); g.lineTo(cx, baseY); g.strokePath()
    g.beginPath(); g.moveTo(cx + halfW, coneTopY); g.lineTo(cx, baseY); g.strokePath()
    g.beginPath(); g.moveTo(cx - halfW * 0.55, coneTopY + 16 * s); g.lineTo(cx + halfW * 0.55, coneTopY + 16 * s); g.strokePath()
  }

  // ── Scoops (bottom → top) ──
  const r = 17 * s
  const step = 24 * s
  let topY = coneTopY
  for (let i = 0; i < scoops.length; i++) {
    const col = scoops[i]
    const sy = coneTopY - 6 * s - i * step
    g.fillStyle(0x000000, 0.08); g.fillCircle(cx + 2 * s, sy + 3 * s, r)
    g.fillStyle(col); g.fillCircle(cx, sy, r)
    g.lineStyle(1.5 * s, borderFor(col), 0.7); g.strokeCircle(cx, sy, r)
    g.fillStyle(0xffffff, 0.35); g.fillCircle(cx - 5 * s, sy - 5 * s, r * 0.32)
    topY = sy
  }

  // ── Toppings (on the top scoop) ──
  drawToppings(g, cx, topY, r, toppings, s)
}

function drawToppings(g, cx, topY, r, toppings, s) {
  if (toppings.indexOf('Sauce') !== -1) {
    g.lineStyle(4 * s, 0xdc2626, 0.9)
    g.beginPath(); g.arc(cx - r * 0.5, topY - r * 0.2, r * 0.6, Math.PI, 0, false); g.strokePath()
    g.beginPath(); g.arc(cx + r * 0.4, topY + r * 0.1, r * 0.5, 0, Math.PI, true); g.strokePath()
  }
  if (toppings.indexOf('Sprinkles') !== -1) {
    const cols = [0xff6b9d, 0x60a5fa, 0xfbbf24, 0x34d399, 0xa78bfa, 0xf87171]
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2
      const dx = Math.cos(ang) * r * 0.6
      const dy = Math.sin(ang) * r * 0.5 - r * 0.2
      g.fillStyle(cols[i % cols.length])
      g.fillRect(cx + dx - 2 * s, topY + dy - 1 * s, 4 * s, 2 * s)
    }
  }
  if (toppings.indexOf('Flake') !== -1) {
    const fx = cx + r * 0.2
    const fy = topY - r
    g.fillStyle(0x6d4c41); g.fillRoundedRect(fx - 4 * s, fy - 14 * s, 8 * s, 24 * s, 2 * s)
    g.lineStyle(1 * s, 0x3e2723, 0.6); g.strokeRoundedRect(fx - 4 * s, fy - 14 * s, 8 * s, 24 * s, 2 * s)
  }
  if (toppings.indexOf('Cherry') !== -1) {
    const cyx = cx
    const cyy = topY - r - 4 * s
    g.lineStyle(1.5 * s, 0x15803d)
    g.beginPath(); g.moveTo(cyx, cyy); g.lineTo(cyx + 4 * s, cyy - 8 * s); g.strokePath()
    g.fillStyle(0xdc2626); g.fillCircle(cyx, cyy, 5 * s)
    g.fillStyle(0xffffff, 0.4); g.fillCircle(cyx - 1.5 * s, cyy - 1.5 * s, 1.5 * s)
  }
}

// ── localStorage helpers for the all-time gallery ──
const GALLERY_KEY = 'evelyn-icecream-gallery'

export function loadGallery() {
  try {
    const raw = localStorage.getItem(GALLERY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (_) {
    return []
  }
}

export function saveToGallery(design) {
  try {
    const all = loadGallery()
    all.push(design)
    localStorage.setItem(GALLERY_KEY, JSON.stringify(all))
  } catch (_) {
    /* storage not available */
  }
}

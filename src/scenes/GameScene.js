import Phaser from 'phaser'

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const FLAVOURS = [
  { name: 'Vanilla',    colour: 0xfffde7, border: 0xf9a825, text: '#f57f17' },
  { name: 'Chocolate',  colour: 0x6d4c41, border: 0x3e2723, text: '#ffffff' },
  { name: 'Strawberry', colour: 0xf48fb1, border: 0xc2185b, text: '#880e4f' },
  { name: 'Mint Choc',  colour: 0xa5d6a7, border: 0x388e3c, text: '#1b5e20' },
]
const CONES = [
  { name: 'Wafer',  colour: 0xfef9e7, border: 0xca8a04, coneCol: 0xfde68a, text: '#713f12' },
  { name: 'Sugar',  colour: 0xfef3c7, border: 0xb45309, coneCol: 0xfbbf24, text: '#78350f' },
  { name: 'Waffle', colour: 0xfde68a, border: 0x92400e, coneCol: 0xf59e0b, text: '#451a03' },
]
const TOPPINGS = [
  { name: 'Sprinkles', colour: 0xfce7f3, border: 0xdb2777, text: '#9d174d' },
  { name: 'Flake',     colour: 0xefebe9, border: 0x4e342e, text: '#3e2723' },
  { name: 'Sauce',     colour: 0xfee2e2, border: 0xb91c1c, text: '#7f1d1d' },
]
const SHIRT_COLOURS = [0x60a5fa, 0xf87171, 0x34d399, 0xfbbf24, 0xa78bfa, 0xfb923c]
const SKIN_TONES    = [0xfddbb4, 0xf5cba7, 0xd4a574, 0xc68642, 0x8d5524, 0xffdbac]

const CUSTOMER_STOP_X     = 310
const CUSTOMERS_PER_LEVEL = 5

const LEVEL_CONFIG = {
  1: { requireCone: false, requireTopping: false, panelHeight: 115, title: 'Level 1', coinPerOrder: 2, timer: null },
  2: { requireCone: true,  requireTopping: false, panelHeight: 170, title: 'Level 2', coinPerOrder: 3, timer: null },
  3: { requireCone: true,  requireTopping: true,  panelHeight: 225, title: 'Level 3', coinPerOrder: 4, timer: null },
  4: { requireCone: true,  requireTopping: true,  panelHeight: 225, title: 'Level 4', coinPerOrder: 5, timer: 15   },
  5: { requireCone: true,  requireTopping: true,  panelHeight: 225, title: 'Level 5', coinPerOrder: 6, timer: 9    },
}

const SCENE_THEMES = {
  1: { label: 'Countryside',    sky1: 0x87ceeb, sky2: 0xbae6fd },
  2: { label: 'Beside the Sea', sky1: 0xbae6fd, sky2: 0xfde68a },
  3: { label: 'City Centre',    sky1: 0x94a3b8, sky2: 0xcbd5e1 },
  4: { label: 'School Run',     sky1: 0x93c5fd, sky2: 0xdbeafe },
  5: { label: 'Play Area',      sky1: 0x67e8f9, sky2: 0xa5f3fc },
}

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }) }

  init(data) {
    this.level              = data?.level || 1
    this.cfg                = LEVEL_CONFIG[this.level]
    this.playerName         = data?.name || 'Unknown'
    this.selectedFlavour    = null
    this.selectedCone       = null
    this.selectedTopping    = null
    this.served             = false
    this.currentCustomer    = null
    this.score              = data?.score || 0
    this.creations          = data?.creations ? data.creations.slice() : []
    this.customersCorrect   = 0
    this.customersAttempted = 0
    this.customerBusy       = false
    this.levelComplete      = false
    this.flavourButtons     = []
    this.coneButtons        = []
    this.toppingButtons     = []
    this.timerValue         = 0
    this.timerActive        = false
    this.timerPulseTween    = null
    this.lastTickSecond     = 0
    this.audioCtx           = null
  }

  create() {
    const { width, height } = this.scale
    const PANEL_Y = height - this.cfg.panelHeight
    const GAME_H  = PANEL_Y
    this.PANEL_Y = PANEL_Y
    this.GAME_H  = GAME_H
    this.width   = width
    this.height  = height
    this.vanX    = 80
    this.vanY    = GAME_H * 0.82

    this.buildBackground(width, GAME_H)
    this.drawVan(this.vanX, this.vanY)
    this.hatchScoop = this.add.graphics()

    // Progress
    this.progressText = this.add.text(14, 14, `${this.cfg.title}   0 / ${CUSTOMERS_PER_LEVEL}`, {
      fontSize: '15px', fontFamily: 'Arial, sans-serif', color: '#1e293b',
      stroke: '#ffffff', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0, 0)

    // Location label
    this.add.text(width / 2, 14, `📍 ${SCENE_THEMES[this.level].label}`, {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#1e293b',
      stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5, 0)

    // Score
    this.scoreText = this.add.text(width - 14, 14, `🪙 £${this.score}`, {
      fontSize: '20px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      color: '#92400e', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(1, 0)

    // Heart timer (levels 4 & 5)
    if (this.cfg.timer) this.buildHeartTimer(width)

    // Status text
    this.statusText = this.add.text(width / 2, PANEL_Y - 20, 'A customer is on their way!', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif',
      color: '#be185d', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 2,
    }).setOrigin(0.5)

    this.buildSelectionPanel(width, PANEL_Y)
    this.time.delayedCall(1200, () => this.spawnCustomer())
    this.cameras.main.fadeIn(300)
  }

  // ─── Backgrounds ──────────────────────────────────────────────────────────

  buildBackground(width, H) {
    const theme = SCENE_THEMES[this.level]
    const sky = this.add.graphics()
    sky.fillGradientStyle(theme.sky1, theme.sky1, theme.sky2, theme.sky2, 1)
    sky.fillRect(0, 0, width, H)
    switch (this.level) {
      case 1: this.drawCountryside(width, H); break
      case 2: this.drawSeaside(width, H);     break
      case 3: this.drawCity(width, H);        break
      case 4: this.drawSchool(width, H);      break
      case 5: this.drawPlayArea(width, H);    break
    }
    this.drawRoad(width, H)
  }

  drawRoad(width, H) {
    const g = this.add.graphics()
    g.fillStyle(0x57534e); g.fillRect(0, H * 0.84, width, H * 0.16)
    g.fillStyle(0xfbbf24)
    for (let x = 0; x < width; x += 80) g.fillRect(x, H * 0.915, 50, 4)
  }

  drawTree(g, x, baseY, scale = 1) {
    g.fillStyle(0x713f12)
    g.fillRect(x - 6 * scale, baseY - 28 * scale, 11 * scale, 28 * scale)
    g.fillStyle(0x16a34a); g.fillCircle(x, baseY - 44 * scale, 22 * scale)
    g.fillStyle(0x15803d)
    g.fillCircle(x - 10 * scale, baseY - 34 * scale, 14 * scale)
    g.fillCircle(x + 10 * scale, baseY - 34 * scale, 14 * scale)
  }

  drawCloud(g, x, y, scale = 1) {
    g.fillStyle(0xffffff, 0.85)
    g.fillCircle(x, y, 22 * scale)
    g.fillCircle(x + 28 * scale, y + 5 * scale, 18 * scale)
    g.fillCircle(x - 22 * scale, y + 5 * scale, 16 * scale)
    g.fillRect(x - 38 * scale, y + 5 * scale, 86 * scale, 16 * scale)
  }

  drawCountryside(width, H) {
    const g = this.add.graphics()
    // Rolling hills
    g.fillStyle(0x4ade80)
    g.fillEllipse(200, H * 0.8, 400, H * 0.4)
    g.fillEllipse(600, H * 0.85, 350, H * 0.35)
    g.fillEllipse(800, H * 0.78, 320, H * 0.35)
    // Grass
    g.fillStyle(0x86efac); g.fillRect(0, H * 0.8, width, H * 0.2)
    // Trees (right side — van is left)
    this.drawTree(g, 550, H * 0.82, 1.1)
    this.drawTree(g, 620, H * 0.78, 1.3)
    this.drawTree(g, 690, H * 0.83, 0.9)
    this.drawTree(g, 750, H * 0.79, 1.2)
    // Flowers
    const flowerPos = [[420,H*0.81],[445,H*0.83],[475,H*0.82],[505,H*0.80]]
    for (let fi = 0; fi < flowerPos.length; fi++) {
      g.fillStyle(pick([0xfbbf24, 0xf9a8d4, 0xfb923c, 0xa78bfa]))
      g.fillCircle(flowerPos[fi][0], flowerPos[fi][1], 4)
    }
    this.drawCloud(g, 480, H * 0.15, 1)
    this.drawCloud(g, 660, H * 0.1, 0.7)
  }

  drawSeaside(width, H) {
    const g = this.add.graphics()
    // Sea
    g.fillStyle(0x1d4ed8); g.fillRect(0, H * 0.45, width, H * 0.25)
    g.fillStyle(0x3b82f6); g.fillRect(0, H * 0.55, width, H * 0.15)
    // Waves
    g.fillStyle(0xffffff, 0.55)
    for (let x = 0; x < width; x += 90) {
      g.beginPath()
      g.arc(x + 20, H * 0.56, 18, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(0), false)
      g.fillPath()
    }
    // Beach
    g.fillStyle(0xfef3c7); g.fillRect(0, H * 0.7, width, H * 0.18)
    g.fillStyle(0xfde68a); g.fillRect(0, H * 0.7, width, H * 0.03)
    // Pebbles
    const pebbles = [[440,H*0.75],[490,H*0.77],[530,H*0.74],[570,H*0.76]]
    for (let pi = 0; pi < pebbles.length; pi++) {
      g.fillStyle(0xe7e5e4); g.fillCircle(pebbles[pi][0], pebbles[pi][1], 3)
    }
    // Seagulls
    g.lineStyle(2, 0x374151)
    g.beginPath(); g.moveTo(490,H*0.18); g.lineTo(502,H*0.21); g.lineTo(514,H*0.18); g.strokePath()
    g.beginPath(); g.moveTo(610,H*0.12); g.lineTo(620,H*0.15); g.lineTo(630,H*0.12); g.strokePath()
    // Sailboat
    g.fillStyle(0xffffff); g.fillTriangle(650, H*0.36, 650, H*0.54, 690, H*0.54)
    g.fillStyle(0xef4444); g.fillRect(648, H*0.52, 60, 6)
    // Ground above sand
    g.fillStyle(0xfef3c7); g.fillRect(0, H*0.78, width, H*0.1)
  }

  drawCity(width, H) {
    const g = this.add.graphics()
    // Buildings
    const bldgs = [
      [0,   90,  H*0.52, 0x64748b],
      [95,  70,  H*0.4,  0x475569],
      [170, 55,  H*0.58, 0x94a3b8],
      [500, 100, H*0.45, 0x64748b],
      [605, 85,  H*0.55, 0x475569],
      [695, 110, H*0.4,  0x94a3b8],
    ]
    for (let bi = 0; bi < bldgs.length; bi++) {
      const bx = bldgs[bi][0], bw = bldgs[bi][1], bh = bldgs[bi][2], bc = bldgs[bi][3]
      g.fillStyle(bc); g.fillRect(bx, H * 0.78 - bh, bw, bh)
      g.fillStyle(0xfde68a, 0.7)
      for (let wy = H*0.78 - bh + 12; wy < H*0.78 - 12; wy += 20)
        for (let wx = bx + 8; wx < bx + bw - 8; wx += 16)
          if ((wx + wy) % 30 !== 0) g.fillRect(wx, wy, 8, 10)
    }
    // Pavement
    g.fillStyle(0x9ca3af); g.fillRect(0, H*0.78, width, H*0.1)
    g.fillStyle(0x6b7280)
    for (let x = 0; x < width; x += 60) g.fillRect(x, H*0.78, 1, H*0.1)
    // Lamppost
    g.fillStyle(0x1e293b); g.fillRect(495, H*0.5, 6, H*0.3)
    g.fillStyle(0xfde68a); g.fillCircle(498, H*0.5, 8)
    g.fillStyle(0xfbbf24, 0.35); g.fillCircle(498, H*0.5, 16)
  }

  drawSchool(width, H) {
    const g = this.add.graphics()
    // Grass
    g.fillStyle(0x86efac); g.fillRect(0, H*0.62, width, H*0.24)
    // Building
    g.fillStyle(0xd97706); g.fillRect(460, H*0.28, 330, H*0.5)
    // Roof
    g.fillStyle(0x92400e); g.fillTriangle(455, H*0.28, 795, H*0.28, 625, H*0.1)
    g.fillStyle(0x78350f); g.fillRect(700, H*0.12, 18, H*0.18)
    // Windows
    const winX = [490, 560, 630, 700]
    for (let wi = 0; wi < winX.length; wi++) {
      const wx = winX[wi]
      g.fillStyle(0x93c5fd); g.fillRect(wx, H*0.38, 34, 40); g.fillCircle(wx+17, H*0.38, 17)
      g.lineStyle(2, 0x78350f); g.strokeRect(wx, H*0.38, 34, 40); g.strokeCircle(wx+17, H*0.38, 17)
    }
    // Door
    g.fillStyle(0x1e293b); g.fillRect(606, H*0.56, 38, H*0.22)
    g.fillStyle(0x92400e); g.fillRect(604, H*0.54, 42, 6)
    // Sign
    g.fillStyle(0xfef3c7); g.fillRect(590, H*0.45, 70, 16)
    g.lineStyle(1, 0x78350f); g.strokeRect(590, H*0.45, 70, 16)
    this.add.text(625, H*0.45 + 8, 'SCHOOL', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#78350f', fontStyle: 'bold',
    }).setOrigin(0.5)
    // Railings
    g.lineStyle(3, 0x374151)
    g.beginPath(); g.moveTo(240, H*0.62); g.lineTo(460, H*0.62); g.strokePath()
    for (let fx = 245; fx < 460; fx += 20) {
      g.beginPath(); g.moveTo(fx, H*0.54); g.lineTo(fx, H*0.62); g.strokePath()
    }
    this.drawTree(g, 420, H*0.82, 0.9)
  }

  drawPlayArea(width, H) {
    const g = this.add.graphics()
    // Rubber ground
    g.fillStyle(0x7c3aed); g.fillRect(0, H*0.72, width, H*0.16)
    g.fillStyle(0x4f46e5); g.fillRect(350, H*0.72, 200, H*0.16)
    g.fillStyle(0xbe185d); g.fillRect(600, H*0.72, 180, H*0.16)
    // Swings A-frame
    g.lineStyle(5, 0x374151)
    g.beginPath(); g.moveTo(460, H*0.72); g.lineTo(500, H*0.35); g.strokePath()
    g.beginPath(); g.moveTo(620, H*0.72); g.lineTo(580, H*0.35); g.strokePath()
    g.beginPath(); g.moveTo(500, H*0.35); g.lineTo(580, H*0.35); g.strokePath()
    g.lineStyle(2, 0x374151)
    g.beginPath(); g.moveTo(518, H*0.35); g.lineTo(518, H*0.62); g.strokePath()
    g.beginPath(); g.moveTo(562, H*0.35); g.lineTo(562, H*0.62); g.strokePath()
    g.fillStyle(0xef4444); g.fillRect(510, H*0.62, 16, 6)
    g.fillStyle(0x3b82f6); g.fillRect(554, H*0.62, 16, 6)
    // Slide
    g.fillStyle(0xfbbf24); g.fillRect(670, H*0.4, 12, H*0.32)
    g.fillStyle(0xfde68a); g.fillRect(670, H*0.4, 80, 8)
    g.fillStyle(0xf59e0b); g.fillTriangle(670, H*0.48, 750, H*0.7, 750, H*0.48)
    // Grass strip
    g.fillStyle(0x86efac); g.fillRect(0, H*0.7, width, H*0.04)
    // Colourful fence
    const fc = [0xef4444, 0xfbbf24, 0x22c55e, 0x3b82f6, 0xa78bfa]
    for (let fx = 240; fx < 460; fx += 18) {
      g.fillStyle(fc[Math.floor((fx-240)/18) % fc.length]); g.fillRect(fx, H*0.68, 12, H*0.06)
    }
  }

  // ─── Heart timer ──────────────────────────────────────────────────────────

  buildHeartTimer(width) {
    this.heartGfx   = this.add.graphics()
    this.heartCx    = width - 110
    this.heartCy    = 68
    this.heartScale = 2.1
    this.timerTxt   = this.add.text(this.heartCx, this.heartCy + 48, '', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif',
      color: '#be185d', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5, 0)
    this.updateHeartTimer()
  }

  heartPoints(cx, cy, scale) {
    const pts = [], n = 80
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2
      pts.push({
        x: cx + scale * 16 * Math.pow(Math.sin(t), 3),
        y: cy - scale * (13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)),
      })
    }
    return pts
  }

  updateHeartTimer() {
    if (!this.heartGfx) return
    this.heartGfx.clear()

    const total  = this.cfg.timer ? this.cfg.timer * 1000 : 1
    const pct    = Math.max(0, Math.min(1, this.timerValue / total))

    // Red (0xef4444) fades to white (0xffffff) as time runs out
    const r = Math.round(0xef + (0xff - 0xef) * (1 - pct))
    const g = Math.round(0x44 + (0xff - 0x44) * (1 - pct))
    const b = Math.round(0x44 + (0xff - 0x44) * (1 - pct))
    const fillCol = (r << 16) | (g << 8) | b

    // Shadow
    this.heartGfx.fillStyle(0x000000, 0.12)
    this.heartGfx.fillPoints(this.heartPoints(this.heartCx+2, this.heartCy+3, this.heartScale), true)
    // Fill
    this.heartGfx.fillStyle(fillCol)
    this.heartGfx.fillPoints(this.heartPoints(this.heartCx, this.heartCy, this.heartScale), true)
    // Border
    this.heartGfx.lineStyle(2.5, 0xbe185d, 0.7)
    this.heartGfx.strokePoints(this.heartPoints(this.heartCx, this.heartCy, this.heartScale), true)

    if (this.timerTxt) {
      const secs = this.timerActive ? Math.ceil(this.timerValue / 1000) : ''
      this.timerTxt.setText(secs ? `${secs}s` : '')
      this.timerTxt.setColor(pct < 0.3 ? '#ef4444' : '#be185d')
    }

    if (pct < 0.3 && this.timerActive && !this.timerPulseTween) {
      this.timerPulseTween = this.tweens.add({
        targets: this.heartGfx, scaleX: 1.12, scaleY: 1.12,
        duration: 280, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      })
    }
  }

  startTimer() {
    if (!this.cfg.timer) return
    this.timerValue     = this.cfg.timer * 1000
    this.timerActive    = true
    this.lastTickSecond = this.cfg.timer
    if (this.timerPulseTween) { this.timerPulseTween.stop(); this.timerPulseTween = null }
    if (this.heartGfx)  this.heartGfx.setScale(1).setAlpha(1)
    this.updateHeartTimer()
  }

  stopTimer() {
    this.timerActive = false
    if (this.timerPulseTween) { this.timerPulseTween.stop(); this.timerPulseTween = null }
    if (this.heartGfx)  this.heartGfx.setScale(1).setAlpha(1)
    if (this.timerTxt)  this.timerTxt.setText('')
  }

  timerExpired() {
    if (!this.currentCustomer || this.customerBusy || this.levelComplete) return
    this.stopTimer()
    this.timerValue = 0
    this.updateHeartTimer()
    this.playSound('timeout')
    this.customersAttempted++
    this.progressText.setText(`${this.cfg.title}   ${this.customersAttempted} / ${CUSTOMERS_PER_LEVEL}`)
    this.statusText.setText("⏰ Time's up! No money earned.")
    this.angryWalkoff()
  }

  // ─── Audio ────────────────────────────────────────────────────────────────

  playSound(type) {
    try {
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume()
      const ctx = this.audioCtx, t = ctx.currentTime

      const note = (freq, start, dur, vol = 0.28, wave = 'sine') => {
        const osc = ctx.createOscillator(), gain = ctx.createGain()
        osc.type = wave; osc.frequency.value = freq
        gain.gain.setValueAtTime(vol, t + start)
        gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur)
        osc.connect(gain); gain.connect(ctx.destination)
        osc.start(t + start); osc.stop(t + start + dur + 0.01)
      }

      if      (type === 'coin')    { note(523,0,0.12); note(659,0.1,0.12); note(784,0.2,0.22) }
      else if (type === 'wrong')   { note(220,0,0.15,0.3,'sawtooth'); note(165,0.12,0.25,0.3,'sawtooth') }
      else if (type === 'timeout') { note(180,0,0.4,0.25,'sawtooth') }
      else if (type === 'complete'){ note(523,0,0.15); note(659,0.14,0.15); note(784,0.28,0.15); note(1047,0.42,0.35) }
      else if (type === 'tick')    { note(880,0,0.06,0.12,'square') }
    } catch (_) { /* audio not available */ }
  }

  // ─── Selection panel ──────────────────────────────────────────────────────

  buildSelectionPanel(width, PANEL_Y) {
    const panel = this.add.graphics()
    panel.fillStyle(0xfce7f3); panel.fillRect(0, PANEL_Y, width, this.cfg.panelHeight)
    panel.lineStyle(2, 0xf9a8d4); panel.strokeRect(0, PANEL_Y, width, this.cfg.panelHeight)
    panel.fillStyle(0xfdf2f8); panel.fillRoundedRect(8, PANEL_Y+5, width-16, this.cfg.panelHeight-10, 8)

    this.serveBtnX = width - 96; this.serveBtnY = PANEL_Y + 10
    this.serveBtnW = 80; this.serveBtnH = this.cfg.panelHeight - 20
    this.serveBtn  = this.add.graphics()
    this.serveBtnLbl = null
    this.drawServeButton(false)

    const hit = this.add.zone(
      this.serveBtnX + this.serveBtnW/2, this.serveBtnY + this.serveBtnH/2,
      this.serveBtnW, this.serveBtnH
    ).setInteractive({ useHandCursor: true })
    hit.on('pointerdown', () => this.onServe())

    const iW = this.serveBtnX - 16
    this.buildFlavourRow(PANEL_Y, iW)
    if (this.cfg.requireCone)    this.buildConeRow(PANEL_Y, iW)
    if (this.cfg.requireTopping) this.buildToppingRow(PANEL_Y, iW)
  }

  buildFlavourRow(PANEL_Y, iW) {
    const rowY = PANEL_Y + 8, btnW = 120, btnH = 58, gap = 8
    const totalW = FLAVOURS.length * btnW + (FLAVOURS.length-1) * gap
    const startX = 12 + (iW - totalW) / 2
    this.add.text(startX, rowY+2, 'Flavour:', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#9d174d', fontStyle: 'bold',
    }).setOrigin(0,0)
    FLAVOURS.forEach((flavour, i) => {
      const bx = startX + i*(btnW+gap), by = rowY+16
      const btn = this.add.graphics()
      this.drawFlavourButton(btn, bx, by, btnW, btnH, flavour, false)
      const zone = this.add.zone(bx+btnW/2, by+btnH/2, btnW, btnH).setInteractive({ useHandCursor: true })
      zone.on('pointerover', () => { if (this.selectedFlavour?.name !== flavour.name) this.drawFlavourButton(btn, bx, by, btnW, btnH, flavour, false, true) })
      zone.on('pointerout',  () => { if (this.selectedFlavour?.name !== flavour.name) this.drawFlavourButton(btn, bx, by, btnW, btnH, flavour, false) })
      zone.on('pointerdown', () => { if (!this.customerBusy && !this.levelComplete) this.selectFlavour(flavour) })
      this.add.text(bx+btnW/2, by+btnH-10, flavour.name, {
        fontSize: '11px', fontFamily: 'Arial, sans-serif', color: flavour.text, fontStyle: 'bold',
      }).setOrigin(0.5,1)
      this.flavourButtons.push({ btn, flavour, bx, by, btnW, btnH })
    })
  }

  buildConeRow(PANEL_Y, iW) {
    const rowY = PANEL_Y + 76, btnW = 130, btnH = 58, gap = 12
    const totalW = CONES.length * btnW + (CONES.length-1) * gap
    const startX = 12 + (iW - totalW) / 2
    this.add.text(startX, rowY+2, 'Cone:', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#9d174d', fontStyle: 'bold',
    }).setOrigin(0,0)
    CONES.forEach((cone, i) => {
      const bx = startX + i*(btnW+gap), by = rowY+16
      const btn = this.add.graphics()
      this.drawConeButton(btn, bx, by, btnW, btnH, cone, false)
      const zone = this.add.zone(bx+btnW/2, by+btnH/2, btnW, btnH).setInteractive({ useHandCursor: true })
      zone.on('pointerover', () => { if (this.selectedCone?.name !== cone.name) this.drawConeButton(btn, bx, by, btnW, btnH, cone, false, true) })
      zone.on('pointerout',  () => { if (this.selectedCone?.name !== cone.name) this.drawConeButton(btn, bx, by, btnW, btnH, cone, false) })
      zone.on('pointerdown', () => { if (!this.customerBusy && !this.levelComplete) this.selectCone(cone) })
      this.add.text(bx+btnW/2, by+btnH-10, cone.name, {
        fontSize: '11px', fontFamily: 'Arial, sans-serif', color: cone.text, fontStyle: 'bold',
      }).setOrigin(0.5,1)
      this.coneButtons.push({ btn, cone, bx, by, btnW, btnH })
    })
  }

  buildToppingRow(PANEL_Y, iW) {
    const rowY = PANEL_Y + 150, btnW = 130, btnH = 52, gap = 12
    const totalW = TOPPINGS.length * btnW + (TOPPINGS.length-1) * gap
    const startX = 12 + (iW - totalW) / 2
    this.add.text(startX, rowY+2, 'Topping:', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#9d174d', fontStyle: 'bold',
    }).setOrigin(0,0)
    TOPPINGS.forEach((topping, i) => {
      const bx = startX + i*(btnW+gap), by = rowY+16
      const btn = this.add.graphics()
      this.drawToppingButton(btn, bx, by, btnW, btnH, topping, false)
      const zone = this.add.zone(bx+btnW/2, by+btnH/2, btnW, btnH).setInteractive({ useHandCursor: true })
      zone.on('pointerover', () => { if (this.selectedTopping?.name !== topping.name) this.drawToppingButton(btn, bx, by, btnW, btnH, topping, false, true) })
      zone.on('pointerout',  () => { if (this.selectedTopping?.name !== topping.name) this.drawToppingButton(btn, bx, by, btnW, btnH, topping, false) })
      zone.on('pointerdown', () => { if (!this.customerBusy && !this.levelComplete) this.selectTopping(topping) })
      this.add.text(bx+btnW/2, by+btnH-8, topping.name, {
        fontSize: '11px', fontFamily: 'Arial, sans-serif', color: topping.text, fontStyle: 'bold',
      }).setOrigin(0.5,1)
      this.toppingButtons.push({ btn, topping, bx, by, btnW, btnH })
    })
  }

  // ─── Button drawing ───────────────────────────────────────────────────────

  drawFlavourButton(gfx, x, y, w, h, flavour, selected, hover=false) {
    gfx.clear()
    gfx.fillStyle(0x000000,0.08); gfx.fillRoundedRect(x+2,y+3,w,h,8)
    gfx.fillStyle(flavour.colour, selected?1:hover?0.85:0.7); gfx.fillRoundedRect(x,y,w,h,8)
    gfx.lineStyle(selected?3:1.5, flavour.border); gfx.strokeRoundedRect(x,y,w,h,8)
    if (selected) { gfx.lineStyle(4,0xfbbf24,0.6); gfx.strokeRoundedRect(x-3,y-3,w+6,h+6,10) }
    const cx=x+w/2, cy=y+h/2-6
    gfx.fillStyle(0xfbbf24,0.9); gfx.fillTriangle(cx-9,cy+3,cx+9,cy+3,cx,cy+22)
    gfx.fillStyle(flavour.colour===0x6d4c41?0x8d5534:flavour.colour); gfx.fillCircle(cx,cy,13)
    gfx.lineStyle(1.5,flavour.border,0.7); gfx.strokeCircle(cx,cy,13)
    gfx.fillStyle(0xffffff,0.35); gfx.fillCircle(cx-4,cy-4,5)
  }

  drawConeButton(gfx, x, y, w, h, cone, selected, hover=false) {
    gfx.clear()
    gfx.fillStyle(0x000000,0.08); gfx.fillRoundedRect(x+2,y+3,w,h,8)
    gfx.fillStyle(cone.colour, selected?1:hover?0.85:0.7); gfx.fillRoundedRect(x,y,w,h,8)
    gfx.lineStyle(selected?3:1.5,cone.border); gfx.strokeRoundedRect(x,y,w,h,8)
    if (selected) { gfx.lineStyle(4,0xfbbf24,0.6); gfx.strokeRoundedRect(x-3,y-3,w+6,h+6,10) }
    const cx=x+w/2, cy=y+h/2-4
    gfx.fillStyle(cone.coneCol); gfx.fillTriangle(cx-14,cy-4,cx+14,cy-4,cx,cy+24)
    gfx.lineStyle(1.5,cone.border,0.8); gfx.strokeTriangle(cx-14,cy-4,cx+14,cy-4,cx,cy+24)
    if (cone.name==='Waffle') {
      gfx.lineStyle(1,cone.border,0.5)
      gfx.beginPath(); gfx.moveTo(cx-8,cy-4); gfx.lineTo(cx-2,cy+14); gfx.strokePath()
      gfx.beginPath(); gfx.moveTo(cx+8,cy-4); gfx.lineTo(cx+2,cy+14); gfx.strokePath()
      gfx.beginPath(); gfx.moveTo(cx-14,cy-4); gfx.lineTo(cx+14,cy-4); gfx.strokePath()
      gfx.beginPath(); gfx.moveTo(cx-10,cy+6); gfx.lineTo(cx+10,cy+6); gfx.strokePath()
    }
    if (cone.name==='Wafer') {
      gfx.lineStyle(2,cone.border,0.6)
      gfx.beginPath(); gfx.moveTo(cx-14,cy-4); gfx.lineTo(cx+14,cy-4); gfx.strokePath()
    }
  }

  drawToppingButton(gfx, x, y, w, h, topping, selected, hover=false) {
    gfx.clear()
    gfx.fillStyle(0x000000,0.08); gfx.fillRoundedRect(x+2,y+3,w,h,8)
    gfx.fillStyle(topping.colour, selected?1:hover?0.85:0.7); gfx.fillRoundedRect(x,y,w,h,8)
    gfx.lineStyle(selected?3:1.5,topping.border); gfx.strokeRoundedRect(x,y,w,h,8)
    if (selected) { gfx.lineStyle(4,0xfbbf24,0.6); gfx.strokeRoundedRect(x-3,y-3,w+6,h+6,10) }
    const cx=x+w/2, cy=y+h/2-6
    if (topping.name==='Sprinkles') {
      const spr = [[cx-12,cy,0xff6b9d],[cx-4,cy-7,0x60a5fa],[cx+6,cy-3,0xfbbf24],[cx+12,cy+4,0x34d399],[cx-8,cy+6,0xa78bfa],[cx+2,cy+7,0xf87171]]
      for (let si = 0; si < spr.length; si++) {
        gfx.fillStyle(spr[si][2]); gfx.fillRect(spr[si][0]-3,spr[si][1]-1,6,3)
      }
    } else if (topping.name==='Flake') {
      gfx.fillStyle(0x6d4c41); gfx.fillRoundedRect(cx-18,cy-4,36,10,3)
      gfx.lineStyle(1,0x3e2723); gfx.strokeRoundedRect(cx-18,cy-4,36,10,3)
      gfx.lineStyle(1,0x3e2723,0.4)
      gfx.beginPath(); gfx.moveTo(cx-8,cy-4); gfx.lineTo(cx-8,cy+6); gfx.strokePath()
      gfx.beginPath(); gfx.moveTo(cx+4,cy-4); gfx.lineTo(cx+4,cy+6); gfx.strokePath()
    } else if (topping.name==='Sauce') {
      gfx.lineStyle(5,0xdc2626,0.9)
      gfx.beginPath(); gfx.arc(cx-5,cy-2,10,Phaser.Math.DegToRad(180),Phaser.Math.DegToRad(0),false); gfx.strokePath()
      gfx.beginPath(); gfx.arc(cx+5,cy+6,8,Phaser.Math.DegToRad(0),Phaser.Math.DegToRad(180),true); gfx.strokePath()
    }
  }

  drawServeButton(active) {
    this.serveBtn.clear()
    const { serveBtnX:x, serveBtnY:y, serveBtnW:w, serveBtnH:h } = this
    this.serveBtn.fillStyle(0x000000,0.08); this.serveBtn.fillRoundedRect(x+2,y+3,w,h,10)
    this.serveBtn.fillStyle(active?0x22c55e:0xd1d5db); this.serveBtn.fillRoundedRect(x,y,w,h,10)
    this.serveBtn.lineStyle(2,active?0x15803d:0x9ca3af); this.serveBtn.strokeRoundedRect(x,y,w,h,10)
    if (this.serveBtnLbl) this.serveBtnLbl.destroy()
    this.serveBtnLbl = this.add.text(x+w/2, y+h/2, active?'✅\nServe!':'Serve', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif',
      color: active?'#ffffff':'#6b7280', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5)
  }

  // ─── Selection logic ──────────────────────────────────────────────────────

  selectFlavour(flavour) {
    this.selectedFlavour = flavour
    this.flavourButtons.forEach(({ btn,bx,by,btnW,btnH,flavour:f }) => this.drawFlavourButton(btn,bx,by,btnW,btnH,f,f.name===flavour.name))
    this.drawHatchScoop(); this.checkServeReady()
    if (this.currentCustomer) this.statusText.setText(this.selectionStatusText())
  }

  selectCone(cone) {
    this.selectedCone = cone
    this.coneButtons.forEach(({ btn,bx,by,btnW,btnH,cone:c }) => this.drawConeButton(btn,bx,by,btnW,btnH,c,c.name===cone.name))
    this.checkServeReady()
    if (this.currentCustomer) this.statusText.setText(this.selectionStatusText())
  }

  selectTopping(topping) {
    this.selectedTopping = topping
    this.toppingButtons.forEach(({ btn,bx,by,btnW,btnH,topping:t }) => this.drawToppingButton(btn,bx,by,btnW,btnH,t,t.name===topping.name))
    this.checkServeReady()
    if (this.currentCustomer) this.statusText.setText(this.selectionStatusText())
  }

  selectionStatusText() {
    const sel=[], miss=[]
    if (this.selectedFlavour) sel.push(this.selectedFlavour.name); else miss.push('flavour')
    if (this.cfg.requireCone)    { if (this.selectedCone)    sel.push(this.selectedCone.name+' cone');   else miss.push('cone') }
    if (this.cfg.requireTopping) { if (this.selectedTopping) sel.push(this.selectedTopping.name);        else miss.push('topping') }
    if (miss.length) return `${sel.join(' + ')}${sel.length?' — pick a ':'Pick a '}${miss.join(' & ')}!`
    return `${sel.join(' + ')} — hit Serve!`
  }

  checkServeReady() {
    const ready = this.selectedFlavour
      && (!this.cfg.requireCone    || this.selectedCone)
      && (!this.cfg.requireTopping || this.selectedTopping)
    this.drawServeButton(!!ready)
  }

  isCorrectOrder() {
    const { order } = this.currentCustomer
    if (this.selectedFlavour?.name  !== order.flavour.name)                         return false
    if (this.cfg.requireCone    && this.selectedCone?.name    !== order.cone?.name)    return false
    if (this.cfg.requireTopping && this.selectedTopping?.name !== order.topping?.name) return false
    return true
  }

  resetSelectionState() {
    this.selectedFlavour=null; this.selectedCone=null; this.selectedTopping=null; this.served=false
    this.hatchScoop.clear(); this.drawServeButton(false)
    this.flavourButtons.forEach(({btn,bx,by,btnW,btnH,flavour}) => this.drawFlavourButton(btn,bx,by,btnW,btnH,flavour,false))
    this.coneButtons.forEach(({btn,bx,by,btnW,btnH,cone}) => this.drawConeButton(btn,bx,by,btnW,btnH,cone,false))
    this.toppingButtons.forEach(({btn,bx,by,btnW,btnH,topping}) => this.drawToppingButton(btn,bx,by,btnW,btnH,topping,false))
  }

  drawHatchScoop() {
    if (!this.selectedFlavour) return
    const { colour, border } = this.selectedFlavour
    const hx=this.vanX+45, hy=this.vanY-48
    this.hatchScoop.clear()
    this.hatchScoop.fillStyle(colour===0x6d4c41?0x8d5534:colour); this.hatchScoop.fillCircle(hx,hy,14)
    this.hatchScoop.lineStyle(2,border); this.hatchScoop.strokeCircle(hx,hy,14)
    this.hatchScoop.fillStyle(0xffffff,0.35); this.hatchScoop.fillCircle(hx-4,hy-4,5)
  }

  // ─── Serve ────────────────────────────────────────────────────────────────

  onServe() {
    if (this.served || !this.currentCustomer || this.customerBusy || this.levelComplete) return
    if (!this.selectedFlavour) return
    if (this.cfg.requireCone    && !this.selectedCone)    return
    if (this.cfg.requireTopping && !this.selectedTopping) return
    this.stopTimer()

    if (this.isCorrectOrder()) {
      this.served=true; this.customerBusy=true
      this.score+=this.cfg.coinPerOrder; this.customersCorrect++; this.customersAttempted++
      this.scoreText.setText(`🪙 £${this.score}`)
      this.progressText.setText(`${this.cfg.title}   ${this.customersAttempted} / ${CUSTOMERS_PER_LEVEL}`)
      this.statusText.setText(`✅ Correct! +£${this.cfg.coinPerOrder}`)
      this.drawServeButton(false)
      this.playSound('coin')
      this.correctServeAnimation()
    } else {
      const wanted = this.orderDescription(this.currentCustomer.order)
      this.customersAttempted++
      this.progressText.setText(`${this.cfg.title}   ${this.customersAttempted} / ${CUSTOMERS_PER_LEVEL}`)
      this.statusText.setText(`❌ Wrong — no money. They wanted: ${wanted}`)
      this.playSound('wrong')
      this.angryWalkoff()
    }
  }

  orderDescription(order) {
    const parts=[order.flavour.name]
    if (order.cone)    parts.push(order.cone.name+' cone')
    if (order.topping) parts.push(order.topping.name)
    return parts.join(', ')
  }

  // ─── Customer lifecycle ───────────────────────────────────────────────────

  generateOrder() {
    const order = { flavour: pick(FLAVOURS) }
    if (this.cfg.requireCone)    order.cone    = pick(CONES)
    if (this.cfg.requireTopping) order.topping = pick(TOPPINGS)
    return order
  }

  spawnCustomer() {
    if (this.levelComplete) return
    const order=this.generateOrder()
    const shirtCol=pick(SHIRT_COLOURS)
    const skinCol=pick(SKIN_TONES)
    const groundY=this.GAME_H*0.84

    const container=this.add.container(this.width+40, groundY)
    const bodyGfx=this.drawCustomer(container, shirtCol, skinCol)
    const bubble=this.buildSpeechBubble(order)
    bubble.setVisible(false); container.add(bubble)

    this.currentCustomer={ order, container, bubble, bodyGfx, shirtCol, skinCol }
    this.customerBusy=true
    this.statusText.setText('Customer incoming!')

    this.tweens.add({
      targets: container, x: CUSTOMER_STOP_X, duration: 1200, ease: 'Cubic.easeOut',
      onComplete: () => {
        bubble.setVisible(true); this.customerBusy=false
        this.statusText.setText(`They want: ${this.orderDescription(order)}!`)
        this.startTimer()
      },
    })
  }

  correctServeAnimation() {
    this.tweens.add({ targets: this.hatchScoop, scaleX:1.6, scaleY:1.6, duration:350, yoyo:true, ease:'Back.easeOut' })
    this.tweens.add({
      targets: this.currentCustomer.container, y: this.currentCustomer.container.y - 20,
      duration:200, yoyo:true, repeat:2, ease:'Sine.easeInOut',
      onComplete: () => this.time.delayedCall(400, () => this.customerWalkOff(false)),
    })
  }

  angryWalkoff() {
    this.customerBusy=true; this.makeCustomerAngry(); this.resetSelectionState()
    this.time.delayedCall(600, () => this.customerWalkOff(true))
  }

  customerWalkOff(angry) {
    this.stopTimer()
    this.tweens.add({
      targets: this.currentCustomer.container, x: this.width+60,
      duration: angry?700:1000, ease:'Cubic.easeIn',
      onComplete: () => {
        this.currentCustomer.container.destroy(); this.currentCustomer=null
        this.resetSelectionState()
        if (this.customersAttempted>=CUSTOMERS_PER_LEVEL) {
          this.showLevelComplete()
        } else {
          this.statusText.setText('Next customer incoming!')
          this.time.delayedCall(1500, () => this.spawnCustomer())
        }
      },
    })
  }

  drawCustomer(container, shirtCol, skinCol) {
    const g=this.add.graphics()
    g.fillStyle(0x000000,0.12); g.fillEllipse(0,2,36,10)
    g.fillStyle(0x374151); g.fillRoundedRect(-10,-28,8,28,3); g.fillRoundedRect(3,-28,8,28,3)
    g.fillStyle(0x1f2937); g.fillEllipse(-6,1,14,7); g.fillEllipse(7,1,14,7)
    g.fillStyle(shirtCol); g.fillRoundedRect(-14,-58,28,32,5)
    g.fillStyle(skinCol)
    g.fillRoundedRect(-20,-56,8,20,3); g.fillRoundedRect(12,-56,8,20,3)
    g.fillStyle(skinCol); g.fillCircle(0,-70,16)
    g.fillStyle(0x1f2937); g.fillCircle(-5,-72,2.5); g.fillCircle(5,-72,2.5)
    g.lineStyle(2,0x1f2937); g.beginPath(); g.arc(0,-68,6,Phaser.Math.DegToRad(20),Phaser.Math.DegToRad(160)); g.strokePath()
    g.fillStyle(0x4b3621); g.fillEllipse(0,-83,28,14)
    container.add(g); return g
  }

  makeCustomerAngry() {
    const { bubble, bodyGfx, shirtCol, skinCol } = this.currentCustomer
    bubble.setVisible(false); bodyGfx.clear()
    bodyGfx.fillStyle(0x000000,0.12); bodyGfx.fillEllipse(0,2,36,10)
    bodyGfx.fillStyle(0x374151); bodyGfx.fillRoundedRect(-10,-28,8,28,3); bodyGfx.fillRoundedRect(3,-28,8,28,3)
    bodyGfx.fillStyle(0x1f2937); bodyGfx.fillEllipse(-6,1,14,7); bodyGfx.fillEllipse(7,1,14,7)
    bodyGfx.fillStyle(shirtCol); bodyGfx.fillRoundedRect(-14,-58,28,32,5)
    bodyGfx.fillStyle(skinCol); bodyGfx.fillRoundedRect(-22,-62,8,18,3); bodyGfx.fillRoundedRect(14,-62,8,18,3)
    bodyGfx.fillStyle(0xe05252); bodyGfx.fillCircle(0,-70,16)
    bodyGfx.fillStyle(0x1f2937)
    bodyGfx.fillRect(-10,-79,8,3); bodyGfx.fillRect(2,-79,8,3)
    bodyGfx.fillRect(-10,-80,4,2); bodyGfx.fillRect(6,-80,4,2)
    bodyGfx.fillRect(-7,-73,5,3); bodyGfx.fillRect(2,-73,5,3)
    bodyGfx.lineStyle(2.5,0x1f2937); bodyGfx.beginPath()
    bodyGfx.arc(0,-60,6,Phaser.Math.DegToRad(200),Phaser.Math.DegToRad(340)); bodyGfx.strokePath()
    bodyGfx.fillStyle(0x4b3621); bodyGfx.fillEllipse(0,-83,28,14)
    bodyGfx.fillStyle(0xff4444,0.7); bodyGfx.fillCircle(-18,-80,5); bodyGfx.fillCircle(18,-80,5)
  }

  buildSpeechBubble(order) {
    const rows=[order.flavour]
    if (order.cone)    rows.push(order.cone)
    if (order.topping) rows.push(order.topping)
    const bh=24+rows.length*22, bw=138, bx=-bw/2, by=-100-bh
    const c=this.add.container(0,0), gfx=this.add.graphics()
    gfx.fillStyle(0xffffff,0.95); gfx.fillRoundedRect(bx,by,bw,bh,8)
    gfx.lineStyle(2,0xd1d5db);    gfx.strokeRoundedRect(bx,by,bw,bh,8)
    gfx.fillStyle(0xffffff,0.95); gfx.fillTriangle(-8,by+bh,8,by+bh,0,by+bh+14)
    gfx.lineStyle(2,0xd1d5db);    gfx.strokeTriangle(-8,by+bh,8,by+bh,0,by+bh+14)
    const items=[gfx]
    rows.forEach((item,i) => {
      const ry=by+14+i*22
      if (i===0) {
        gfx.fillStyle(item.colour===0x6d4c41?0x8d5534:item.colour); gfx.fillCircle(bx+18,ry,8)
        gfx.lineStyle(1.5,item.border); gfx.strokeCircle(bx+18,ry,8)
      } else if (item.coneCol!==undefined) {
        gfx.fillStyle(item.coneCol); gfx.fillTriangle(bx+10,ry-7,bx+26,ry-7,bx+18,ry+7)
        gfx.lineStyle(1,item.border); gfx.strokeTriangle(bx+10,ry-7,bx+26,ry-7,bx+18,ry+7)
      } else {
        gfx.fillStyle(item.border); gfx.fillCircle(bx+18,ry,6)
      }
      items.push(this.add.text(bx+32,ry,item.name,{
        fontSize:'12px', fontFamily:'Arial, sans-serif', color:'#1f2937', fontStyle:'bold',
      }).setOrigin(0,0.5))
    })
    c.add(items); return c
  }

  // ─── Level complete ───────────────────────────────────────────────────────

  starsEarned(correct) {
    if (correct===5) return 3
    if (correct>=3)  return 2
    if (correct>=1)  return 1
    return 0
  }

  showLevelComplete() {
    this.levelComplete=true
    this.playSound('complete')

    const { width, height } = this.scale
    const nextLevel=this.level+1, hasNextLevel=!!LEVEL_CONFIG[nextLevel]
    const perfect=this.customersCorrect===CUSTOMERS_PER_LEVEL
    const stars=this.starsEarned(this.customersCorrect)
    const starStr='⭐'.repeat(stars)+'☆'.repeat(3-stars)
    const levelEarned=this.customersCorrect*this.cfg.coinPerOrder
    const maxEarnable=CUSTOMERS_PER_LEVEL*this.cfg.coinPerOrder

    const overlay=this.add.graphics()
    overlay.fillStyle(0x000000,0.6); overlay.fillRect(0,0,width,height)

    const cardW=460, cardH=300
    const cardX=(width-cardW)/2, cardY=(height-cardH)/2

    const card=this.add.graphics()
    card.fillStyle(perfect?0xfffbeb:0xfdf2f8)
    card.fillRoundedRect(cardX,cardY,cardW,cardH,16)
    card.lineStyle(3,perfect?0xf59e0b:0xf9a8d4)
    card.strokeRoundedRect(cardX,cardY,cardW,cardH,16)

    this.add.text(width/2,cardY+38,`🎉 ${this.cfg.title} Complete!`,{
      fontSize:'25px',fontFamily:'Arial Rounded MT Bold, Arial, sans-serif',color:'#be185d',
    }).setOrigin(0.5)
    this.add.text(width/2,cardY+76,starStr,{fontSize:'30px'}).setOrigin(0.5)
    this.add.text(width/2,cardY+112,`🪙 £${this.score} total  ·  £${levelEarned} of £${maxEarnable} this level`,{
      fontSize:'15px',fontFamily:'Arial, sans-serif',color:'#92400e',
    }).setOrigin(0.5)

    if (perfect) {
      // Reward: design your own ice cream before moving on.
      this.add.text(width/2,cardY+148,'🌟 Perfect score! 🌟',{
        fontSize:'16px',fontFamily:'Arial Rounded MT Bold, Arial, sans-serif',color:'#d97706',fontStyle:'bold',
      }).setOrigin(0.5)
      this.add.text(width/2,cardY+174,'You earned an ice cream to design and keep!',{
        fontSize:'13px',fontFamily:'Arial, sans-serif',color:'#b45309',
      }).setOrigin(0.5)
      const label=hasNextLevel?'🎨  Make your reward ice cream!':'🎨  Make your final ice cream!'
      this.addButton(width/2-135,cardY+206,270,48,label,0xec4899,0xbe185d,()=>{
        this.cameras.main.fade(200,0,0,0)
        this.time.delayedCall(220,()=>this.scene.start('CreateScene',{
          level:this.level, score:this.score, creations:this.creations,
          nextLevel:hasNextLevel?nextLevel:null, name:this.playerName,
        }))
      })
      this.addButton(width/2-60,cardY+262,120,26,'🔄 Restart',0x9ca3af,0x6b7280,()=>{
        this.cameras.main.fade(200,0,0,0)
        this.time.delayedCall(220,()=>this.scene.start('TitleScene'))
      })
    } else if (hasNextLevel) {
      const nextTheme=SCENE_THEMES[nextLevel]
      const hints={2:'Now choose the right cone too!',3:'Flavour, cone AND topping — a full order!',4:'Level 5 cuts to 12 seconds — good luck! ⏱',5:''}
      this.add.text(width/2,cardY+146,`Next up: 📍 ${nextTheme?.label||''}`,{
        fontSize:'14px',fontFamily:'Arial, sans-serif',color:'#6b7280',
      }).setOrigin(0.5)
      this.add.text(width/2,cardY+170,hints[nextLevel]||'',{
        fontSize:'13px',fontFamily:'Arial, sans-serif',color:'#9d174d',
      }).setOrigin(0.5)
      this.add.text(width/2,cardY+192,'💡 Get 5/5 to design your own ice cream!',{
        fontSize:'12px',fontFamily:'Arial, sans-serif',color:'#d97706',
      }).setOrigin(0.5)
      this.addButton(width/2-115,cardY+212,230,46,`▶  Play Level ${nextLevel}`,0x22c55e,0x15803d,()=>{
        this.cameras.main.fade(200,0,0,0)
        this.time.delayedCall(220,()=>this.scene.restart({level:nextLevel,score:this.score,creations:this.creations,name:this.playerName}))
      })
      this.addButton(width/2-60,cardY+266,120,26,'🔄 Restart',0x9ca3af,0x6b7280,()=>{
        this.cameras.main.fade(200,0,0,0)
        this.time.delayedCall(220,()=>this.scene.start('TitleScene'))
      })
    } else {
      // Finished the last level without a perfect — straight to the trophy room.
      this.add.text(width/2,cardY+158,'You beat all 5 levels! 🏆',{
        fontSize:'16px',fontFamily:'Arial, sans-serif',color:'#b45309',fontStyle:'bold',
      }).setOrigin(0.5)
      this.addButton(width/2-115,cardY+210,230,48,'🏆  See your trophy room!',0xf59e0b,0xb45309,()=>{
        this.cameras.main.fade(200,0,0,0)
        this.time.delayedCall(220,()=>this.scene.start('GalleryScene',{mode:'champion',creations:this.creations,score:this.score,name:this.playerName}))
      })
    }
  }

  addButton(x, y, w, h, label, fill, border, onClick) {
    const gfx=this.add.graphics()
    const draw=(col)=>{ gfx.clear(); gfx.fillStyle(col); gfx.fillRoundedRect(x,y,w,h,8); gfx.lineStyle(2,border); gfx.strokeRoundedRect(x,y,w,h,8) }
    draw(fill)
    this.add.text(x+w/2,y+h/2,label,{
      fontSize:'14px',fontFamily:'Arial, sans-serif',color:'#ffffff',fontStyle:'bold',align:'center',wordWrap:{width:w-16},
    }).setOrigin(0.5)
    const hit=this.add.zone(x+w/2,y+h/2,w,h).setInteractive({useHandCursor:true})
    hit.on('pointerover',()=>draw(Phaser.Display.Color.IntegerToColor(fill).lighten(15).color))
    hit.on('pointerout', ()=>draw(fill))
    hit.on('pointerdown',onClick)
  }

  // ─── Van ──────────────────────────────────────────────────────────────────

  drawVan(x, y) {
    const g=this.add.graphics()
    g.fillStyle(0xfce7f3); g.fillRoundedRect(x,y-60,160,65,8)
    g.fillStyle(0xfda4af); g.fillRoundedRect(x+110,y-78,50,83,8)
    g.fillStyle(0xfde68a); g.fillRoundedRect(x+12,y-52,58,36,4)
    g.fillStyle(0xfbbf24); g.fillRect(x+10,y-18,62,5)
    g.fillStyle(0x93c5fd); g.fillRoundedRect(x+82,y-50,22,20,3)
    g.fillStyle(0x93c5fd); g.fillRoundedRect(x+118,y-68,34,28,4)
    g.fillStyle(0x374151); g.fillCircle(x+35,y+12,18); g.fillCircle(x+135,y+12,18)
    g.fillStyle(0xd1d5db); g.fillCircle(x+35,y+12,8); g.fillCircle(x+135,y+12,8)
    g.fillStyle(0xf9a8d4); g.fillRoundedRect(x+15,y-80,90,22,6)
    this.add.text(x+60,y-69,'🍦 ICE CREAM 🍦',{
      fontSize:'10px',fontFamily:'Arial, sans-serif',color:'#be185d',
    }).setOrigin(0.5)
  }

  // ─── Update loop ──────────────────────────────────────────────────────────

  update(time, delta) {
    if (!this.timerActive || !this.cfg.timer) return
    this.timerValue -= delta
    const currentSecond=Math.ceil(this.timerValue/1000)
    if (currentSecond<=5 && currentSecond<this.lastTickSecond && currentSecond>0) {
      this.lastTickSecond=currentSecond; this.playSound('tick')
    }
    if (this.timerValue<=0) {
      this.timerValue=0; this.timerActive=false; this.timerExpired(); return
    }
    this.updateHeartTimer()
  }
}

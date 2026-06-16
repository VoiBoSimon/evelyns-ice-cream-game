import Phaser from 'phaser'
import {
  CREATE_FLAVOURS, CREATE_TOPPINGS, CONE_KEYS, CONE_STYLE,
  MAX_SCOOPS, randomName, defaultDesign, drawIceCream, saveToGallery,
} from '../iceCream.js'

// The creative reward: after a perfect (5/5) level, the player designs their own
// ice cream, names it, and keeps it. Reached from GameScene.showLevelComplete.
export class CreateScene extends Phaser.Scene {
  constructor() { super({ key: 'CreateScene' }) }

  init(data) {
    this.completedLevel = data?.level || 1
    this.score          = data?.score || 0
    this.creations      = data?.creations ? data.creations.slice() : []
    this.nextLevel      = data?.nextLevel || null
    this.playerName     = data?.name || 'Unknown'
    this.design         = defaultDesign()
    this.coneButtons    = []
    this.toppingButtons = []
  }

  create() {
    const { width, height } = this.scale

    // Background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0xfde68a, 0xfde68a, 0xfbcfe8, 0xfbcfe8, 1)
    bg.fillRect(0, 0, width, height)

    // Title
    this.add.text(width / 2, 22, '🎨 Make Your Reward Ice Cream!', {
      fontSize: '24px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      color: '#be185d', stroke: '#ffffff', strokeThickness: 4,
    }).setOrigin(0.5)
    this.add.text(width / 2, 48, `You got 5 out of 5 on Level ${this.completedLevel}! This one is just for you.`, {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#9d174d',
    }).setOrigin(0.5)

    // ── Preview pedestal (left) ──
    this.previewCx = 175
    this.previewBaseY = 318
    const ped = this.add.graphics()
    ped.fillStyle(0xffffff, 0.5); ped.fillRoundedRect(65, 326, 220, 22, 10)
    ped.fillStyle(0xf9a8d4, 0.4); ped.fillRoundedRect(85, 337, 180, 12, 8)

    this.previewGfx = this.add.graphics()
    this.redrawPreview()
    // gentle bob
    this.tweens.add({
      targets: this.previewGfx, y: -8, duration: 1400,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // Scoop counter + start-over under preview
    this.scoopText = this.add.text(175, 358, '', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#9d174d', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.updateScoopText()
    this.makeButton(115, 378, 120, 26, '↺ Start over', 0x9ca3af, 0x6b7280, () => {
      this.design.scoops = []
      this.design.toppings = []
      this.refresh()
    })

    // ── Flavours (right) ──
    this.add.text(575, 64, 'Tap a flavour to stack a scoop:', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#9d174d', fontStyle: 'bold',
    }).setOrigin(0.5, 0)
    const swX = [440, 530, 620, 710]
    for (let i = 0; i < CREATE_FLAVOURS.length; i++) {
      const flav = CREATE_FLAVOURS[i]
      const col = i % 4
      const row = Math.floor(i / 4)
      const x = swX[col]
      const y = 104 + row * 56
      this.makeSwatch(x, y, flav)
    }

    // ── Cones (right) ──
    this.add.text(575, 206, 'Cone:', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#9d174d', fontStyle: 'bold',
    }).setOrigin(0.5, 0)
    const coneX = [420, 530, 640]
    for (let i = 0; i < CONE_KEYS.length; i++) {
      const key = CONE_KEYS[i]
      const x = coneX[i]
      const btn = this.add.graphics()
      const lbl = this.add.text(x + 54, 246, key, {
        fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#78350f', fontStyle: 'bold',
      }).setOrigin(0.5)
      const desc = { btn, lbl, key, x, y: 224, w: 90, h: 40 }
      this.coneButtons.push(desc)
      const zone = this.add.zone(x + 45, 244, 90, 44).setInteractive({ useHandCursor: true })
      zone.on('pointerdown', () => { this.design.cone = key; this.refresh() })
    }

    // ── Toppings (right) ──
    this.add.text(575, 280, 'Toppings (tap to add or remove):', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#9d174d', fontStyle: 'bold',
    }).setOrigin(0.5, 0)
    const topX = [378, 480, 582, 684]
    for (let i = 0; i < CREATE_TOPPINGS.length; i++) {
      const key = CREATE_TOPPINGS[i]
      const x = topX[i]
      const btn = this.add.graphics()
      const lbl = this.add.text(x + 44, 316, key, {
        fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#1f2937', fontStyle: 'bold',
      }).setOrigin(0.5)
      const desc = { btn, lbl, key, x, y: 300, w: 88, h: 34 }
      this.toppingButtons.push(desc)
      const zone = this.add.zone(x + 44, 317, 88, 34).setInteractive({ useHandCursor: true })
      zone.on('pointerdown', () => { this.toggleTopping(key); this.refresh() })
    }

    // ── Name bar (bottom) ──
    this.add.text(20, 424, 'Name:', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#9d174d', fontStyle: 'bold',
    }).setOrigin(0, 0.5)
    this.nameText = this.add.text(72, 424, this.design.name, {
      fontSize: '16px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      color: '#be185d', fontStyle: 'bold',
    }).setOrigin(0, 0.5)
    const diceZone = this.add.zone(72, 424, 200, 30).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    diceZone.on('pointerdown', () => { this.design.name = randomName(); this.nameText.setText(this.design.name) })
    this.makeButton(282, 409, 36, 30, '🎲', 0xf9a8d4, 0xbe185d, () => {
      this.design.name = randomName(); this.nameText.setText(this.design.name)
    })

    // ── Save & continue ──
    const lastLevel = !this.nextLevel
    const label = lastLevel ? '🏆  Save & Finish!' : '💾  Save & Continue'
    this.makeButton(width - 232, 407, 220, 34, label, 0x22c55e, 0x15803d, () => this.onSave())

    this.refresh()
    this.cameras.main.fadeIn(300)
  }

  // ── State helpers ──

  toggleTopping(key) {
    const i = this.design.toppings.indexOf(key)
    if (i === -1) this.design.toppings.push(key)
    else this.design.toppings.splice(i, 1)
  }

  addScoop(colour) {
    if (this.design.scoops.length >= MAX_SCOOPS) {
      // Cycle: replace the whole stack with a single new scoop once full.
      this.design.scoops = [colour]
    } else {
      this.design.scoops.push(colour)
    }
  }

  updateScoopText() {
    const n = this.design.scoops.length
    const dots = '●'.repeat(n) + '○'.repeat(MAX_SCOOPS - n)
    this.scoopText.setText(`Scoops ${dots}`)
  }

  refresh() {
    this.redrawPreview()
    this.updateScoopText()
    this.restyleCones()
    this.restyleToppings()
  }

  // ── Drawing ──

  redrawPreview() {
    this.previewGfx.clear()
    drawIceCream(this.previewGfx, this.previewCx, this.previewBaseY, this.design, 2.3)
  }

  makeSwatch(x, y, flav) {
    const r = 18
    const g = this.add.graphics()
    const draw = (hover) => {
      g.clear()
      g.fillStyle(0x000000, 0.12); g.fillCircle(x + 2, y + 3, r)
      g.fillStyle(flav.colour); g.fillCircle(x, y, r)
      g.lineStyle(hover ? 3 : 2, hover ? 0xfbbf24 : flav.border, hover ? 0.9 : 0.8)
      g.strokeCircle(x, y, hover ? r + 2 : r)
      g.fillStyle(0xffffff, 0.35); g.fillCircle(x - 5, y - 5, 6)
    }
    draw(false)
    this.add.text(x, y + r + 7, flav.name, {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#9d174d', fontStyle: 'bold',
    }).setOrigin(0.5, 0)
    const zone = this.add.zone(x, y, r * 2 + 10, r * 2 + 10).setInteractive({ useHandCursor: true })
    zone.on('pointerover', () => draw(true))
    zone.on('pointerout', () => draw(false))
    zone.on('pointerdown', () => { this.addScoop(flav.colour); this.refresh() })
  }

  restyleCones() {
    for (let i = 0; i < this.coneButtons.length; i++) {
      const d = this.coneButtons[i]
      const sel = this.design.cone === d.key
      const style = CONE_STYLE[d.key]
      d.btn.clear()
      d.btn.fillStyle(0x000000, 0.08); d.btn.fillRoundedRect(d.x + 2, d.y + 3, d.w, d.h, 8)
      d.btn.fillStyle(style.coneCol, sel ? 1 : 0.55); d.btn.fillRoundedRect(d.x, d.y, d.w, d.h, 8)
      d.btn.lineStyle(sel ? 3 : 1.5, style.border); d.btn.strokeRoundedRect(d.x, d.y, d.w, d.h, 8)
      if (sel) { d.btn.lineStyle(4, 0xfbbf24, 0.6); d.btn.strokeRoundedRect(d.x - 3, d.y - 3, d.w + 6, d.h + 6, 10) }
      // little cone icon
      const ix = d.x + 18
      const iy = d.y + d.h / 2
      d.btn.fillStyle(style.coneCol); d.btn.fillTriangle(ix - 8, iy - 8, ix + 8, iy - 8, ix, iy + 10)
      d.btn.lineStyle(1.5, style.border, 0.8); d.btn.strokeTriangle(ix - 8, iy - 8, ix + 8, iy - 8, ix, iy + 10)
    }
  }

  restyleToppings() {
    for (let i = 0; i < this.toppingButtons.length; i++) {
      const d = this.toppingButtons[i]
      const on = this.design.toppings.indexOf(d.key) !== -1
      d.btn.clear()
      d.btn.fillStyle(0x000000, 0.08); d.btn.fillRoundedRect(d.x + 2, d.y + 3, d.w, d.h, 8)
      d.btn.fillStyle(on ? 0xfce7f3 : 0xffffff, on ? 1 : 0.7); d.btn.fillRoundedRect(d.x, d.y, d.w, d.h, 8)
      d.btn.lineStyle(on ? 3 : 1.5, on ? 0xdb2777 : 0xd1d5db); d.btn.strokeRoundedRect(d.x, d.y, d.w, d.h, 8)
      if (on) { d.btn.lineStyle(2, 0x22c55e, 0.7); d.btn.fillStyle(0x22c55e); d.btn.fillCircle(d.x + d.w - 10, d.y + 10, 5) }
    }
  }

  makeButton(x, y, w, h, label, fill, border, onClick) {
    const g = this.add.graphics()
    const draw = (col) => {
      g.clear()
      g.fillStyle(0x000000, 0.1); g.fillRoundedRect(x + 2, y + 3, w, h, 8)
      g.fillStyle(col); g.fillRoundedRect(x, y, w, h, 8)
      g.lineStyle(2, border); g.strokeRoundedRect(x, y, w, h, 8)
    }
    draw(fill)
    this.add.text(x + w / 2, y + h / 2, label, {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#ffffff', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5)
    const hit = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true })
    hit.on('pointerover', () => draw(Phaser.Display.Color.IntegerToColor(fill).lighten(12).color))
    hit.on('pointerout', () => draw(fill))
    hit.on('pointerdown', onClick)
  }

  onSave() {
    if (!this.design.scoops.length) {
      this.design.scoops = [0xfffde7] // never save an empty cone
    }
    const finished = {
      name: this.design.name,
      cone: this.design.cone,
      scoops: this.design.scoops.slice(),
      toppings: this.design.toppings.slice(),
      level: this.completedLevel,
    }
    this.creations.push(finished)
    saveToGallery(finished)

    this.cameras.main.fade(220, 0, 0, 0)
    this.time.delayedCall(240, () => {
      if (this.nextLevel) {
        this.scene.start('GameScene', { level: this.nextLevel, score: this.score, creations: this.creations, name: this.playerName })
      } else {
        this.scene.start('GalleryScene', { mode: 'champion', creations: this.creations, score: this.score, name: this.playerName })
      }
    })
  }
}

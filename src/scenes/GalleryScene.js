import Phaser from 'phaser'
import { drawIceCream, loadGallery } from '../iceCream.js'

const TOTAL_LEVELS = 5

// Two modes:
//  'champion' — end of a playthrough, shows the run's creations in 5 slots.
//  'browse'   — opened from the title, shows all-time saved creations.
export class GalleryScene extends Phaser.Scene {
  constructor() { super({ key: 'GalleryScene' }) }

  init(data) {
    this.mode        = data?.mode || 'browse'
    this.creations   = data?.creations || []
    this.score       = data?.score || 0
    this.playerName  = data?.name || 'Unknown'
  }

  create() {
    const { width, height } = this.scale

    const bg = this.add.graphics()
    if (this.mode === 'champion') {
      bg.fillGradientStyle(0xfef9c3, 0xfef9c3, 0xfde68a, 0xfde68a, 1)
    } else {
      bg.fillGradientStyle(0xbae6fd, 0xbae6fd, 0xfbcfe8, 0xfbcfe8, 1)
    }
    bg.fillRect(0, 0, width, height)

    if (this.mode === 'champion') this.buildChampion(width, height)
    else this.buildBrowse(width, height)

    this.cameras.main.fadeIn(300)
  }

  buildChampion(width, height) {
    // Save high score (single place for both routes into the champion screen).
    const prev = parseInt(localStorage.getItem('evelyn-icecream-hs') || '0', 10)
    const newBest = this.score > prev
    if (newBest) localStorage.setItem('evelyn-icecream-hs', String(this.score))

    this.add.text(width / 2, 30, '🏆 Ice Cream Champion!', {
      fontSize: '30px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      color: '#92400e', stroke: '#ffffff', strokeThickness: 5,
    }).setOrigin(0.5)

    const n = this.creations.length
    const made = n === TOTAL_LEVELS
      ? 'You made all 5 ice creams! Amazing!'
      : `You made ${n} ice cream${n === 1 ? '' : 's'} — get 5/5 on every level for all 5!`
    this.add.text(width / 2, 64, made, {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#b45309',
    }).setOrigin(0.5)

    this.add.text(width / 2, 90, `🪙 £${this.score} total${newBest ? '  ·  new best!' : ''}`, {
      fontSize: '18px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      color: '#92400e', fontStyle: 'bold',
    }).setOrigin(0.5)

    // Five slots across, filled in order.
    const slotW = 150
    const gap = 8
    const totalW = TOTAL_LEVELS * slotW + (TOTAL_LEVELS - 1) * gap
    const startX = (width - totalW) / 2
    const baseY = 300
    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const cx = startX + i * (slotW + gap) + slotW / 2
      if (this.creations[i]) this.drawSlot(cx, baseY, this.creations[i])
      else this.drawEmptySlot(cx, baseY)
    }

    // Submit score to leaderboard
    const toppings = this.creations.reduce((sum, c) => sum + (c.toppings ? c.toppings.length : 0), 0)
    fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: this.playerName, money: this.score, creations: this.creations.length, toppings }),
    }).catch(() => {})

    this.makeButton(width / 2 - 230, height - 42, 210, 34, '🏆  Leaderboard', 0xf59e0b, 0xb45309, () => {
      this.cameras.main.fade(200, 0, 0, 0)
      this.time.delayedCall(220, () => this.scene.start('LeaderboardScene', { playerName: this.playerName }))
    })
    this.makeButton(width / 2 + 20, height - 42, 210, 34, '🔄  Play Again', 0x22c55e, 0x15803d, () => {
      this.cameras.main.fade(200, 0, 0, 0)
      this.time.delayedCall(220, () => this.scene.start('NameScene'))
    })
  }

  buildBrowse(width, height) {
    this.add.text(width / 2, 30, '🍨 My Ice Cream Parlour', {
      fontSize: '28px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      color: '#be185d', stroke: '#ffffff', strokeThickness: 5,
    }).setOrigin(0.5)

    const all = loadGallery()
    if (!all.length) {
      this.add.text(width / 2, height / 2 - 10, 'No ice creams yet!', {
        fontSize: '20px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif', color: '#9d174d',
      }).setOrigin(0.5)
      this.add.text(width / 2, height / 2 + 20, 'Get 5 out of 5 on a level to design and keep one.', {
        fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#9d174d',
      }).setOrigin(0.5)
    } else {
      // Show the latest 10, newest first, in two rows of five.
      const latest = all.slice(-10).reverse()
      this.add.text(width / 2, 60, `You've made ${all.length} ice cream${all.length === 1 ? '' : 's'}${all.length > 10 ? ' (showing latest 10)' : ''}`, {
        fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#9d174d',
      }).setOrigin(0.5)

      const perRow = 5
      const slotW = 150
      const gap = 8
      const totalW = perRow * slotW + (perRow - 1) * gap
      const startX = (width - totalW) / 2
      const rowBaseY = [205, 375]
      for (let i = 0; i < latest.length; i++) {
        const col = i % perRow
        const row = Math.floor(i / perRow)
        const cx = startX + col * (slotW + gap) + slotW / 2
        this.drawSlot(cx, rowBaseY[row], latest[i], 1.5)
      }
    }

    this.makeButton(width / 2 - 90, height - 36, 180, 30, '← Back', 0xf9a8d4, 0xbe185d, () => {
      this.cameras.main.fade(200, 0, 0, 0)
      this.time.delayedCall(220, () => this.scene.start('TitleScene'))
    })
  }

  drawSlot(cx, baseY, design, scale = 1.7) {
    const g = this.add.graphics()
    g.fillStyle(0xffffff, 0.45); g.fillRoundedRect(cx - 66, baseY - 120, 132, 150, 12)
    g.lineStyle(2, 0xf9a8d4, 0.8); g.strokeRoundedRect(cx - 66, baseY - 120, 132, 150, 12)
    drawIceCream(g, cx, baseY, design, scale)
    this.add.text(cx, baseY + 16, design.name, {
      fontSize: '12px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      color: '#be185d', fontStyle: 'bold', align: 'center', wordWrap: { width: 124 },
    }).setOrigin(0.5, 0)
  }

  drawEmptySlot(cx, baseY) {
    const g = this.add.graphics()
    g.fillStyle(0xffffff, 0.2); g.fillRoundedRect(cx - 66, baseY - 120, 132, 150, 12)
    g.lineStyle(2, 0x9ca3af, 0.5); g.strokeRoundedRect(cx - 66, baseY - 120, 132, 150, 12)
    this.add.text(cx, baseY - 60, '🔒', { fontSize: '28px' }).setOrigin(0.5)
    this.add.text(cx, baseY - 20, 'Get 5/5\nto earn me!', {
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#9ca3af', align: 'center',
    }).setOrigin(0.5)
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
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5)
    const hit = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true })
    hit.on('pointerover', () => draw(Phaser.Display.Color.IntegerToColor(fill).lighten(12).color))
    hit.on('pointerout', () => draw(fill))
    hit.on('pointerdown', onClick)
  }
}

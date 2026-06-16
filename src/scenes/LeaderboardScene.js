import Phaser from 'phaser'

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super({ key: 'LeaderboardScene' }) }

  init(data) {
    this.playerName = data?.playerName || null
  }

  create() {
    const { width, height } = this.scale

    const bg = this.add.graphics()
    bg.fillGradientStyle(0xfef9c3, 0xfef9c3, 0xfde68a, 0xfde68a, 1)
    bg.fillRect(0, 0, width, height)

    this.add.text(width / 2, 28, '🏆 Leaderboard', {
      fontSize: '30px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      color: '#92400e', stroke: '#ffffff', strokeThickness: 5,
    }).setOrigin(0.5)

    this.statusText = this.add.text(width / 2, height / 2, 'Loading scores...', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#b45309',
    }).setOrigin(0.5)

    this.makeButton(width / 2 - 230, height - 42, 210, 34, '🍦  Play Again', 0xec4899, 0xbe185d, () => {
      this.cameras.main.fade(200, 0, 0, 0)
      this.time.delayedCall(220, () => this.scene.start('NameScene'))
    })
    this.makeButton(width / 2 + 20, height - 42, 210, 34, '← Back to Menu', 0xf59e0b, 0xb45309, () => {
      this.cameras.main.fade(200, 0, 0, 0)
      this.time.delayedCall(220, () => this.scene.start('TitleScene'))
    })

    this.cameras.main.fadeIn(300)
    this.loadScores()
  }

  async loadScores() {
    try {
      const res = await fetch('/api/leaderboard')
      if (!res.ok) throw new Error('bad response')
      const scores = await res.json()
      this.statusText.destroy()
      this.drawTable(Array.isArray(scores) ? scores.slice(0, 10) : [])
    } catch (_) {
      this.statusText.setText("Couldn't load scores — leaderboard is only\navailable on the live site.")
    }
  }

  drawTable(scores) {
    const { width } = this.scale
    if (!scores.length) {
      this.add.text(width / 2, 230, 'No scores yet — be the first!', {
        fontSize: '18px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif', color: '#b45309',
      }).setOrigin(0.5)
      return
    }

    const C = { rank: 36, name: 82, money: 390, creations: 545, toppings: 710 }
    const headerY = 78
    const rowH    = 30
    const rowStartY = 106

    const hStyle = { fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#92400e', fontStyle: 'bold' }
    this.add.text(C.rank,      headerY, '#',           hStyle).setOrigin(0, 0.5)
    this.add.text(C.name,      headerY, 'Name',        hStyle).setOrigin(0, 0.5)
    this.add.text(C.money,     headerY, '💰 Money',    hStyle).setOrigin(0.5, 0.5)
    this.add.text(C.creations, headerY, '🍦 Created',  hStyle).setOrigin(0.5, 0.5)
    this.add.text(C.toppings,  headerY, '🍒 Toppings', hStyle).setOrigin(0.5, 0.5)

    const divG = this.add.graphics()
    divG.lineStyle(1.5, 0xb45309, 0.35)
    divG.beginPath(); divG.moveTo(22, headerY + 13); divG.lineTo(width - 22, headerY + 13); divG.strokePath()

    for (let i = 0; i < scores.length; i++) {
      const s   = scores[i]
      const y   = rowStartY + i * rowH
      const isMe = this.playerName && s.name === this.playerName
      const rowG = this.add.graphics()

      if (isMe) {
        rowG.fillStyle(0xfbbf24, 0.35); rowG.fillRoundedRect(20, y - 11, width - 40, rowH - 2, 6)
      } else if (i % 2 === 0) {
        rowG.fillStyle(0xffffff, 0.28); rowG.fillRoundedRect(20, y - 11, width - 40, rowH - 2, 6)
      }

      const medal   = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
      const rStyle  = {
        fontSize: '13px', fontFamily: 'Arial, sans-serif',
        color: isMe ? '#78350f' : '#1f2937', fontStyle: isMe ? 'bold' : 'normal',
      }
      this.add.text(C.rank,      y, medal,                   { ...rStyle, fontSize: i < 3 ? '15px' : '13px' }).setOrigin(0, 0.5)
      this.add.text(C.name,      y, s.name,                  rStyle).setOrigin(0, 0.5)
      this.add.text(C.money,     y, `£${s.money}`,           rStyle).setOrigin(0.5, 0.5)
      this.add.text(C.creations, y, String(s.creations || 0), rStyle).setOrigin(0.5, 0.5)
      this.add.text(C.toppings,  y, String(s.toppings  || 0), rStyle).setOrigin(0.5, 0.5)
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
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5)
    const hit = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true })
    hit.on('pointerover', () => draw(Phaser.Display.Color.IntegerToColor(fill).lighten(12).color))
    hit.on('pointerout',  () => draw(fill))
    hit.on('pointerdown', onClick)
  }
}

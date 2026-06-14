import Phaser from 'phaser'

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }) }

  create() {
    const { width, height } = this.scale

    // Sky gradient
    const sky = this.add.graphics()
    sky.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xfce7f3, 0xfce7f3, 1)
    sky.fillRect(0, 0, width, height)

    // Ground
    const g = this.add.graphics()
    g.fillStyle(0x86efac); g.fillRect(0, height * 0.68, width, height * 0.32)
    g.fillStyle(0x6b7280); g.fillRect(0, height * 0.78, width, height * 0.22)
    g.fillStyle(0xfbbf24)
    for (let x = 0; x < width; x += 80) g.fillRect(x, height * 0.85, 50, 5)

    // Trees (decorative)
    this.drawTree(60,  height * 0.72, 0.8)
    this.drawTree(720, height * 0.72, 0.9)
    this.drawTree(760, height * 0.68, 1.1)

    // Van (parked, centre-ish)
    this.drawVan(width / 2 - 80, height * 0.62)

    // Title
    this.add.text(width / 2, 72, "🍦 Evelyn's Ice Cream Van", {
      fontSize: '38px',
      fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      color: '#be185d',
      stroke: '#fce7f3',
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5)

    // Sub-tagline
    this.add.text(width / 2, 128, 'Can you make the perfect order?', {
      fontSize: '17px', fontFamily: 'Arial, sans-serif', color: '#9d174d',
    }).setOrigin(0.5)

    // High score
    const hs = localStorage.getItem('evelyn-icecream-hs')
    if (hs) {
      this.add.text(width / 2, 165, `🏆 Best ever: £${hs}`, {
        fontSize: '18px', fontFamily: 'Arial, sans-serif', color: '#92400e', fontStyle: 'bold',
      }).setOrigin(0.5)
    }

    // Bouncing scoops
    const scoopData = [
      { x: 90,        y: 290, col: 0xf48fb1, border: 0xc2185b, delay: 0   },
      { x: width-90,  y: 270, col: 0xa5d6a7, border: 0x388e3c, delay: 300 },
      { x: 150,       y: 240, col: 0xfffde7, border: 0xf9a825, delay: 600 },
      { x: width-150, y: 260, col: 0x8d5534, border: 0x3e2723, delay: 900 },
    ]
    scoopData.forEach(({ x, y, col, border, delay }) => {
      const sg = this.add.graphics()
      sg.fillStyle(0xfde68a); sg.fillTriangle(x - 12, y + 18, x + 12, y + 18, x, y + 42)
      sg.fillStyle(col);      sg.fillCircle(x, y, 24)
      sg.lineStyle(2, border, 0.6); sg.strokeCircle(x, y, 24)
      sg.fillStyle(0xffffff, 0.3); sg.fillCircle(x - 6, y - 6, 7)
      this.tweens.add({
        targets: sg, y: -20, duration: 1600, yoyo: true,
        repeat: -1, ease: 'Sine.easeInOut', delay,
      })
    })

    // Play button
    this.addButton(width / 2 - 120, height * 0.5, 240, 58, '🍦  Tap to Play!', 0xec4899, 0xbe185d, () => {
      this.scene.start('GameScene', { level: 1, score: 0 })
    })

    // My Creations button
    this.addButton(width / 2 - 95, height * 0.5 + 66, 190, 38, '🍨  My Creations', 0xa78bfa, 0x7c3aed, () => {
      this.scene.start('GalleryScene', { mode: 'browse' })
    }, '16px')

    // Level indicator dots
    this.add.text(width / 2, height * 0.5 + 116, '5 levels  ·  get 5/5 to design your own ice cream', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#be185d',
    }).setOrigin(0.5)

    this.cameras.main.fadeIn(400)
  }

  drawTree(x, baseY, scale = 1) {
    const g = this.add.graphics()
    g.fillStyle(0x713f12)
    g.fillRect(x - 6 * scale, baseY - 30 * scale, 12 * scale, 30 * scale)
    g.fillStyle(0x16a34a)
    g.fillCircle(x, baseY - 46 * scale, 24 * scale)
    g.fillStyle(0x15803d)
    g.fillCircle(x - 10 * scale, baseY - 36 * scale, 16 * scale)
    g.fillCircle(x + 10 * scale, baseY - 36 * scale, 16 * scale)
  }

  drawVan(x, y) {
    const g = this.add.graphics()
    g.fillStyle(0xfce7f3); g.fillRoundedRect(x, y - 60, 160, 65, 8)
    g.fillStyle(0xfda4af); g.fillRoundedRect(x + 110, y - 78, 50, 83, 8)
    g.fillStyle(0xfde68a); g.fillRoundedRect(x + 12, y - 52, 58, 36, 4)
    g.fillStyle(0xfbbf24); g.fillRect(x + 10, y - 18, 62, 5)
    g.fillStyle(0x93c5fd); g.fillRoundedRect(x + 82, y - 50, 22, 20, 3)
    g.fillStyle(0x93c5fd); g.fillRoundedRect(x + 118, y - 68, 34, 28, 4)
    g.fillStyle(0x374151); g.fillCircle(x + 35, y + 12, 18); g.fillCircle(x + 135, y + 12, 18)
    g.fillStyle(0xd1d5db); g.fillCircle(x + 35, y + 12, 8); g.fillCircle(x + 135, y + 12, 8)
    g.fillStyle(0xf9a8d4); g.fillRoundedRect(x + 15, y - 80, 90, 22, 6)
    this.add.text(x + 60, y - 69, '🍦 ICE CREAM 🍦', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#be185d',
    }).setOrigin(0.5)
  }

  addButton(x, y, w, h, label, fill, border, onClick, fontSize = '22px') {
    const gfx = this.add.graphics()
    const draw = (col) => {
      gfx.clear()
      gfx.fillStyle(col); gfx.fillRoundedRect(x, y, w, h, 12)
      gfx.lineStyle(3, border); gfx.strokeRoundedRect(x, y, w, h, 12)
    }
    draw(fill)
    this.add.text(x + w / 2, y + h / 2, label, {
      fontSize, fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif', color: '#ffffff',
    }).setOrigin(0.5)
    const hit = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true })
    hit.on('pointerover', () => draw(Phaser.Display.Color.IntegerToColor(fill).lighten(15).color))
    hit.on('pointerout',  () => draw(fill))
    hit.on('pointerdown', onClick)
  }
}

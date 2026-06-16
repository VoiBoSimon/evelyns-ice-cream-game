import Phaser from 'phaser'

export class NameScene extends Phaser.Scene {
  constructor() { super({ key: 'NameScene' }) }

  create() {
    const { width, height } = this.scale

    const bg = this.add.graphics()
    bg.fillGradientStyle(0xfde68a, 0xfde68a, 0xfbcfe8, 0xfbcfe8, 1)
    bg.fillRect(0, 0, width, height)

    this.add.text(width / 2, height * 0.20, "🍦 Evelyn's Ice Cream Van", {
      fontSize: '28px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      color: '#be185d', stroke: '#ffffff', strokeThickness: 4,
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.36, "What's your name?", {
      fontSize: '22px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      color: '#9d174d',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.46, 'Your score will go on the leaderboard!', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#b45309',
    }).setOrigin(0.5)

    // Create a plain DOM input positioned over the canvas using fixed CSS.
    // Avoids Phaser's DOM container (which blocks canvas pointer events).
    this.nameInput = document.createElement('input')
    const inp = this.nameInput
    inp.type = 'text'
    inp.maxLength = 16
    inp.placeholder = 'Enter your name...'
    inp.autocomplete = 'off'
    inp.spellcheck = false
    inp.setAttribute('autocorrect', 'off')
    inp.setAttribute('autocapitalize', 'words')
    inp.style.cssText = [
      'position:fixed',
      'left:50%',
      'top:50%',
      'transform:translate(-50%,-50%)',
      'font-size:22px',
      'font-family:Arial,sans-serif',
      'padding:10px 18px',
      'border-radius:10px',
      'border:3px solid #ec4899',
      'outline:none',
      'text-align:center',
      'width:280px',
      'color:#be185d',
      'background:#fff',
      'box-shadow:0 4px 12px rgba(236,72,153,0.15)',
      'z-index:100',
    ].join(';')
    document.body.appendChild(inp)

    this.time.delayedCall(200, () => inp.focus())

    this.errorText = this.add.text(width / 2, height * 0.68, '', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#dc2626',
    }).setOrigin(0.5)

    const doPlay = () => {
      const name = inp.value.trim()
      if (!name) { this.errorText.setText('Please enter your name first!'); return }
      this.removeInput()
      this.cameras.main.fade(200, 0, 0, 0)
      this.time.delayedCall(220, () =>
        this.scene.start('GameScene', { level: 1, score: 0, creations: [], name })
      )
    }

    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') doPlay() })

    this.makeButton(width / 2 - 110, height * 0.73, 220, 48, "🍦  Let's Play!", 0xec4899, 0xbe185d, doPlay)

    this.add.text(width / 2, height * 0.90, '🏆 View Leaderboard', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#9d174d', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', function () { this.setColor('#be185d') })
      .on('pointerout',  function () { this.setColor('#9d174d') })
      .on('pointerdown', () => {
        this.removeInput()
        this.cameras.main.fade(200, 0, 0, 0)
        this.time.delayedCall(220, () => this.scene.start('LeaderboardScene'))
      })

    // Clean up input if scene is shut down any other way
    this.events.on('shutdown', () => this.removeInput())

    this.cameras.main.fadeIn(300)
  }

  removeInput() {
    if (this.nameInput && this.nameInput.parentNode) {
      this.nameInput.parentNode.removeChild(this.nameInput)
      this.nameInput = null
    }
  }

  makeButton(x, y, w, h, label, fill, border, onClick) {
    const g = this.add.graphics()
    const draw = (col) => {
      g.clear()
      g.fillStyle(0x000000, 0.1); g.fillRoundedRect(x + 2, y + 3, w, h, 10)
      g.fillStyle(col); g.fillRoundedRect(x, y, w, h, 10)
      g.lineStyle(2.5, border); g.strokeRoundedRect(x, y, w, h, 10)
    }
    draw(fill)
    this.add.text(x + w / 2, y + h / 2, label, {
      fontSize: '20px', fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif', color: '#ffffff',
    }).setOrigin(0.5)
    const hit = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true })
    hit.on('pointerover', () => draw(Phaser.Display.Color.IntegerToColor(fill).lighten(12).color))
    hit.on('pointerout',  () => draw(fill))
    hit.on('pointerdown', onClick)
  }
}

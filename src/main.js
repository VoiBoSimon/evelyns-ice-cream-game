import Phaser from 'phaser'
import { TitleScene }       from './scenes/TitleScene.js'
import { NameScene }        from './scenes/NameScene.js'
import { GameScene }        from './scenes/GameScene.js'
import { CreateScene }      from './scenes/CreateScene.js'
import { GalleryScene }     from './scenes/GalleryScene.js'
import { LeaderboardScene } from './scenes/LeaderboardScene.js'

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  backgroundColor: '#fce7f3',
  scene: [TitleScene, NameScene, GameScene, CreateScene, GalleryScene, LeaderboardScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
}

new Phaser.Game(config)

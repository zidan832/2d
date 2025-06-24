
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: false
    }
  },
  scene: [MainScene]
};

let game = new Phaser.Game(config);

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.player = null;
    this.boss = null;
    this.zombies = null;
    this.lasers = null;
    this.hpText = null;
    this.playerHp = 100;
    this.bossHp = 100;
    this.killCount = 0;
    this.regenCooldown = false;
  }

  preload() {
    this.load.image('fightText', 'assets/sprites/fight_text.png');
    this.load.audio('fightSound', 'assets/audio/fight.mp3');
    this.load.image('bg', 'assets/sprites/background.png');
    this.load.image('player', 'assets/sprites/player.png');
    this.load.image('boss', 'assets/sprites/boss.png');
    this.load.image('zombie', 'assets/sprites/zombie.png');
    this.load.image('laser', 'assets/sprites/laser.png');
    this.load.audio('laserSound', 'assets/audio/laser.mp3');
    this.load.audio('hitSound', 'assets/audio/hit.mp3');
    this.load.audio('summonSound', 'assets/audio/summon.mp3');
    this.load.audio('healSound', 'assets/audio/heal.mp3');
  }

  create() {
    this.fightImage = this.add.image(400, 100, 'fightText').setVisible(true);
    this.sound.play('fightSound');
    this.time.delayedCall(2000, () => this.fightImage.setVisible(false));
    this.add.image(400, 225, 'bg');

    this.player = this.physics.add.sprite(100, 350, 'player');
    this.player.setCollideWorldBounds(true);

    this.boss = this.physics.add.sprite(600, 350, 'boss');
    this.boss.setCollideWorldBounds(true);

    this.lasers = this.physics.add.group();
    this.zombies = this.physics.add.group();

    this.hpText = this.add.text(10, 10, '', { font: '16px Arial', fill: '#ffffff' });
    this.updateHP();

    this.input.keyboard.on('keydown-A', () => this.fireBullet());
    this.input.keyboard.on('keydown-S', () => this.heal());

    this.physics.add.overlap(this.player, this.lasers, () => this.takeDamage(20), null, this);
    this.physics.add.overlap(this.player, this.zombies, (p, z) => { this.takeDamage(10); z.destroy(); }, null, this);

    this.time.addEvent({ delay: 5000, loop: true, callback: this.fireLaser, callbackScope: this });
    this.time.addEvent({ delay: 8000, loop: true, callback: this.summonZombie, callbackScope: this });
  }

  update() {
    // simple movement
    const cursors = this.input.keyboard.createCursorKeys();
    if (cursors.left.isDown) this.player.setVelocityX(-160);
    else if (cursors.right.isDown) this.player.setVelocityX(160);
    else this.player.setVelocityX(0);

    if (cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-350);
    }
  }

  fireBullet() {
    const bullet = this.physics.add.image(this.player.x + 20, this.player.y, 'laser');
    bullet.setVelocityX(300);
    this.sound.play('laserSound');
    this.physics.add.overlap(bullet, this.boss, () => {
      this.bossHp -= 25;
      bullet.destroy();
      this.sound.play('hitSound');
      if (this.bossHp <= 0) this.bossDefeated();
      this.updateHP();
    }, null, this);

    this.physics.add.overlap(bullet, this.zombies, (b, z) => {
      z.destroy();
      b.destroy();
      this.sound.play('hitSound');
    });
  }

  heal() {
    if (this.regenCooldown || this.playerHp >= 100) return;
    this.playerHp = Math.min(this.playerHp + 20, 100);
    this.sound.play('healSound');
    this.updateHP();
    this.regenCooldown = true;
    this.time.delayedCall(10000, () => this.regenCooldown = false);
  }

  fireLaser() {
    const laser = this.lasers.create(this.boss.x - 20, this.boss.y, 'laser');
    laser.setVelocityX(-300);
    this.sound.play('laserSound');
  }

  summonZombie() {
    const z = this.zombies.create(this.boss.x - 50, this.boss.y, 'zombie');
    z.setVelocityX(-50);
    this.sound.play('summonSound');
  }

  takeDamage(amount) {
    this.playerHp -= amount;
    if (this.playerHp <= 0) {
      this.scene.restart();
      alert('Dunia Hancur. Kamu Kalah!');
    }
    this.updateHP();
  }

  bossDefeated() {
    this.killCount += 1;
    if (this.killCount >= 10) {
      alert('Dunia Pulih! Kamu Menang!');
      this.scene.restart();
    } else {
      this.bossHp = 100;
      this.updateHP();
    }
  }

  updateHP() {
    this.hpText.setText(`Player HP: ${this.playerHp} | Boss HP: ${this.bossHp} | Kemenangan: ${this.killCount}`);
  }
}

  showDialogue(text) {
    if (this.dialogueText) this.dialogueText.destroy();
    this.dialogueText = this.add.text(400, 50, text, {
      font: '18px Arial',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      align: 'center'
    }).setOrigin(0.5);
  }

  setIdleAnimation() {
    this.tweens.add({
      targets: this.player,
      y: '+=5',
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  moveToCenter() {
    this.tweens.add({
      targets: this.boss,
      x: 600,
      duration: 2000,
      ease: 'Power2'
    });
  }

  startGameplay() {
    if (this.dialogueText) this.dialogueText.destroy();
    this.fightImage.setVisible(false);
    this.cutsceneFinished = true;
  }

  playCutscene() {
    this.setIdleAnimation();
    this.fightImage = this.add.image(400, 100, 'fightText').setVisible(false);

    this.time.delayedCall(1000, () => {
      this.sound.play('playerVoice');
      this.showDialogue("Apa yang terjadi di dunia ini…?");
    });

    this.time.delayedCall(4000, () => {
      this.moveToCenter();
      this.sound.play('bossVoice');
      this.showDialogue("Kau tak akan bisa menghentikanku...");
    });

    this.time.delayedCall(7000, () => {
      this.sound.play('bossVoice');
      this.showDialogue("Bangkitlah, pasukanku!");
      this.summonZombie();
      this.sound.play('zombieGrowl');
    });

    this.time.delayedCall(10000, () => {
      this.fightImage.setVisible(true);
      this.sound.play('fightSound');
    });

    this.time.delayedCall(12000, () => {
      this.startGameplay();
    });
  }



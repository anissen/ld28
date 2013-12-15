
if (self.meSpeak && meSpeak.canPlay()) {
  meSpeak.loadConfig("scripts/mespeak/mespeak_config.json");
  meSpeak.loadVoice("scripts/mespeak/voices/en/en.json", voiceLoaded);
}
else {
  console.log('Could not load text-to-speak engine');
}

function voiceLoaded(success, message) {
  if (!success) {
    console.log("Failed to load a voice: " + message);
  }
}

function speak(texts) {
  texts = [].concat(texts);
  var text = texts[Math.floor(texts.length*Math.random())];
  var t = game.add.text(game.camera.x + Math.random() * game.width, game.camera.y + Math.random() * game.height, text, { font: "30pt Courier", fill: "#19cb65", stroke: "#ee0000", strokeThickness: 20, align: "center" });
  t.anchor.setTo(0.5, 0.5);
  t.rotation = -Math.PI / 4 + Math.random() * Math.PI / 2;
  t.anchor.setTo(0.5, 0.5);
  t.alpha = 0.7;
  boss.alpha = 0.5;
  game.paused = true;
  meSpeak.speak(text, { amplitude: 300, speed: 120, variant: 'whisperf' }, function() {
    var hideTextTween = game.add.tween(t);
    hideTextTween
      .to({ alpha: 0 }, 1000 + Math.random() * 3000, Phaser.Easing.Linear.None)
      .start()
      .onCompleteCallback(function() {
        t.destroy();
      });
    var hideBossTween = game.add.tween(boss);
    hideBossTween
      .to({ alpha: 0 }, 100 + Math.random() * 1000, Phaser.Easing.Cubic.InOut)
      .start();
    game.paused = false;
  });
}

var game = new Phaser.Game(800, 600, Phaser.WEBGL, 'game', { preload: preload, create: create, update: update });

var player;
var platforms;
var cursors;
var enemies;
var boss;

var core;

var sky;
var sky2;
var stars;
var waveText;

var bullets;
var explosions;

var fireRate = 300;
var nextFire = 0;

var upKey;
var downKey;
var leftKey;
var rightKey;

var filter;

var shootSound;
var jumpSound;
var explosionSound;
var successSound;
var backgroundSound;
var hitSound;
var pickupSound;

var wave = 0;
var score = 0;

var loadingText;

function preload() {
  loadingText = game.add.text(game.world.centerX, game.world.centerY, 'Loading', { font: "30pt Courier", fill: "#ee0000", stroke: "#19cb65", strokeThickness: 10, align: 'center' });
  loadingText.anchor.setTo(0.5, 0.5);

  game.load.image('sky', 'assets/tron.png');
  game.load.image('sky2', 'assets/cyberglow.png');

  game.load.image('bullet', 'assets/bullet.png');
  game.load.image('core', 'assets/paddle1.png');
  game.load.image('boss', 'assets/zod4.png');
  game.load.spritesheet('platform', 'assets/catastrophi_tiles_16.png', 64, 40);
  game.load.spritesheet('enemy', 'assets/invader32x32x4.png', 32, 32);
  game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
  game.load.spritesheet('kaboom', 'assets/explode.png', 128, 128);
  game.load.spritesheet('rocket', 'assets/xenon2_bomb.png', 8, 16);
  game.load.spritesheet('star', 'assets/coin.png', 32, 32);

  game.load.audio('shot', 'assets/alien_death1.wav');
  game.load.audio('jump', 'assets/hardkick-37.mp3');
  game.load.audio('explosion', 'assets/sentry_explode.wav');
  game.load.audio('success', 'assets/menu_select.mp3');
  game.load.audio('background', 'assets/civil-destruction2.mp3');
  game.load.audio('hit', 'assets/pusher.wav');
  game.load.audio('pickup', 'assets/battery.wav');

  game.load.script('filter', 'filters/Fire.js');
}

function create() {
  game.world.setBounds(0, 0, 800, 1000);

  filter = game.add.filter('Fire', 800, 600);
  filter.alpha = 0.0;

  var filterSprite = game.add.sprite(0, 0);
  filterSprite.width = 800;
  filterSprite.height = 600;

  filterSprite.filters = [filter];
  filterSprite.alpha = 0.1;

  sky = game.add.tileSprite(0, 0, 1400, 1400, 'sky');
  sky2 = game.add.tileSprite(0, 0, 1400, 1400, 'sky2');

  platforms = game.add.group();

  ground = platforms.create(0, game.world.height - 32, 'platform');
  ground.animations.add('ledgeGlitch', [0, 1, 0, 2, 3, 2, 4, 5, 4, 6, 7], 2, true);
  ground.animations.play('ledgeGlitch');
  ground.scale.setTo(15, 1);
  ground.body.immovable = true;

  var ledge;
  ledge = platforms.create(240, game.world.height - 800, 'platform');
  bouncePlatform(ledge);

  ledge = platforms.create(-160, game.world.height - 600, 'platform');
  bouncePlatform(ledge);

  ledge = platforms.create(640, game.world.height - 600, 'platform');
  bouncePlatform(ledge);

  ledge = platforms.create(240, game.world.height - 400, 'platform');
  bouncePlatform(ledge);

  ledge = platforms.create(-160, game.world.height - 200, 'platform');
  bouncePlatform(ledge);

  ledge = platforms.create(640, game.world.height - 200, 'platform');
  bouncePlatform(ledge);

  core = game.add.sprite(game.world.width / 2, game.world.height - 64, 'core');
  core.anchor.setTo(0.5, 0.5);
  core.scale.setTo(2, 4);
  core.body.immovable = true;
  core.health = 100;

  player = game.add.sprite(32, game.world.height - 150, 'dude');
  player.anchor.setTo(0.5, 0.5);

  player.body.gravity.y = 25;
  player.body.collideWorldBounds = true;

  player.animations.add('left', [0, 1, 2, 3], 10, true);
  player.animations.add('right', [5, 6, 7, 8], 10, true);

  game.camera.follow(player, Phaser.Camera.FOLLOW_TIGHT);

  bullets = game.add.group();
  bullets.createMultiple(50, 'rocket');
  bullets.setAll('anchor.x', 0.5);
  bullets.setAll('anchor.y', 0.5);
  bullets.setAll('body.bounce.x', 1.0);
  bullets.setAll('body.bounce.y', 1.0);
  bullets.setAll('outOfBoundsKill', true);

  stars = game.add.group();
  star = stars.create(-100, 0, 'star');

  explosions = game.add.group();
  for (var i = 0; i < 10; i++) {
    var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
    explosionAnimation.anchor.setTo(0.5, 0.5);
    explosionAnimation.animations.add('kaboom');
  }

  enemies = game.add.group();

  waveText = game.add.text(game.world.centerX, 250, 'Wave: 0 Score: 0', { font: "30pt Courier", fill: "#ee0000", stroke: "#19cb65", strokeThickness: 10, align: 'center' });
  waveText.anchor.setTo(0.5, 0.5);
  waveText.alpha = 0.5;

  boss = game.add.sprite(game.world.camera.x, game.world.camera.y, 'boss');
  boss.scale.setTo(2.5, 2.5);
  boss.alpha = 0.02;
  boss.fixedToCamera = true;

  upKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
  downKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
  leftKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
  rightKey = game.input.keyboard.addKey(Phaser.Keyboard.D);

  shootSound = game.add.audio('shot');
  hitSound = game.add.audio('hit');
  jumpSound = game.add.audio('jump');
  explosionSound = game.add.audio('explosion');
  successSound = game.add.audio('success');
  backgroundSound = game.add.audio('background');
  pickupSound = game.add.audio('pickup');

  backgroundSound.play('', 0, 0.7, true);

  loadingText.destroy();

  spawnWave();
}

function bouncePlatform(platform) {
  platform.scale.setTo(6, 1);
  platform.body.immovable = true;
  platform.animations.add('ledgeGlitch', [0, 1, 0, 2, 3, 2, 4, 5, 4, 6, 7], 5 + Math.random() * 10, true);
  platform.animations.play('ledgeGlitch');
  var bounce = game.add.tween(platform);
  bounce
    .to({ y: platform.y + 25 }, 1000 + Math.random() * 3000, Phaser.Easing.Cubic.InOut)
    .to({ y: platform.y - 25 }, 1000 + Math.random() * 3000, Phaser.Easing.Linear.None)
    .loop()
    .start();
}

function update() {
  game.physics.collide(player, platforms);
  game.physics.collide(player, core);
  game.physics.collide(stars, platforms);
  game.physics.collide(bullets, platforms, hitPlatform, null, this);
  game.physics.collide(enemies, platforms);
  game.physics.collide(bullets, enemies, hitEnemy, null, this);
  game.physics.collide(enemies, core, hitCore, null, this);
  game.physics.collide(player, enemies, hitPlayer, null, this);

  game.physics.overlap(player, stars, collectStar, null, this);

  if (!player.alive) return;

  player.body.velocity.x = 0;

  if (game.input.activePointer.isDown) {
    fire();
  }

  if (leftKey.isDown) {
    player.body.velocity.x = -250;
    player.animations.play('left');
  } else if (rightKey.isDown) {
    player.body.velocity.x = 250;
    player.animations.play('right');
  } else {
    player.animations.stop();
    player.frame = 4;
  }
  
  if (upKey.isDown && player.body.touching.down) {
    player.body.velocity.y = -800;
    jumpSound.play();
  }

  if (enemies.countLiving() === 0) {
    successSound.stop();
    successSound.play();
    spawnWave();
  }

  game.camera.x += 4.0 - Math.random() * 8;
  game.camera.y += 4.0 - Math.random() * 8;
  game.camera.rotation = Math.random();

  platforms.alpha = (platforms.alpha + Math.random() + 0.05) / 2;
  
  var value = Math.sin(game.time.now / 1000) * Math.cos(game.time.now / 500);
  sky.alpha = value;
  sky2.alpha = (1.0 - value) / 2;
  sky.tileScale.x = 1 + Math.sin(game.time.now) / 100;
  sky.tileScale.y = 1 + Math.cos(game.time.now) / 100;
  sky.tilePosition.x += 1.0 - Math.random() * 2;

  sky2.tilePosition.y += 1.0 - Math.random() * 2;
  sky2.tileScale.x = 1 + Math.sin(game.time.now) / 100;
  sky2.tileScale.y = 1 + Math.cos(game.time.now) / 100;
  sky2.tilePosition.x += 1.0 - Math.random() * 2;
  sky2.tilePosition.y += 1.0 - Math.random() * 2;

  filter.update();
}

function hitPlatform(bullet, platform) {
  var explosion = explosions.getFirstDead();
  explosion.reset(bullet.x, bullet.y);
  explosion.play('kaboom', 30, false, true);
  bullet.kill();
}

function lose() {
  player.kill();
  core.kill();
  explosionSound.play();

  speak(['I have won']);
  game.paused = true;
}

function hitEnemy(bullet, enemy) {
  hitSound.play();
  enemy.health -= 10;

  var explosion = explosions.getFirstDead();
  explosion.reset(bullet.x, bullet.y);
  explosion.play('kaboom', 30, false, true);

  bullet.kill();
  if (enemy.health <= 0) {
    var explosion2 = explosions.getFirstDead();
    explosion2.reset(enemy.x, enemy.y);
    explosion2.play('kaboom', 30, false, true);

    var star = stars.create(enemy.x, enemy.y - 10, 'star');
    star.body.gravity.y = 10;
    star.body.bounce.y = 0.8;
    star.animations.add('spin', [0, 1, 2, 3, 4, 5], 8 + Math.random() * 5, true);
    star.animations.play('spin');

    enemy.kill();

    explosionSound.play();
  }
}

function hitCore(core, enemy) {
  enemy.kill();
  core.health -= 50;
  if (core.health <= 0) {
    lose();
  } else {
    speak(['Your defeat draws closer', 'Victory is near', 'Your core is almost destroyed']);
  }
}

function hitPlayer(enemy, player) {
  lose();
}

function collectStar (player, star) {
  star.kill();
  pickupSound.play();
  score += 1;
  waveText.content = 'Wave: ' + wave + ' Score: ' + score;
}

function spawnWave() {
    wave++;
    for (var i = 0; i < wave; i++) {
      var boss = Math.random() * wave > 3 && Math.random() < 0.3;
      var enemy = enemies.create((game.world.width / 3) * (1 + Math.random()), Math.random() * 10, 'enemy');
      enemy.health = (boss ? wave * 15 : wave * 5);
      enemy.body.mass = 10 + wave;
      enemy.body.gravity.y = 10;
      enemy.body.velocity.x = 70 + (Math.random()+0.2) * 15 * wave;
      if (Math.random() < 0.5) enemy.body.velocity.x *= -1;
      enemy.body.bounce.x = 1.0;
      enemy.body.collideWorldBounds = true;
      enemy.scale.setTo((boss ? 4 : 2), (boss ? 4 : 2));
      enemy.animations.add('walk', [0, 1, 2, 3], 10 + wave, true);
      enemy.animations.play('walk');
    }
    waveText.content = 'Wave: ' + wave + ' Score: ' + score;
    speak(['My minions will overwhelm you', 'Surrender', 'Resistance is futile', 'Accept your fate', 'All must be destroyed', 'Your death will be swift', 'Why do you persist?', 'I am unstoppable', 'I am invinsible', 'I am endless', 'My strenght is limitless', 'Give in', 'I will terminate you', 'I am your annihilation', 'I will end your life', 'You will be disintegrated', 'I will tear you apart, atom by atom', 'Killing you will be easy', 'You will fail', 'Your end is nigh']);
}

function fire() {
  if (game.time.now > nextFire && bullets.countDead() > 0) {
    nextFire = game.time.now + fireRate;
    var bullet = bullets.getFirstDead();
    bullet.reset(player.x, player.y);
    bullet.body.mass = 0.01;
    bullet.health = 100;
    bullet.scale.setTo(2, 2);
    bullet.animations.add('fly', [0, 1, 2, 3], 50, true);
    bullet.animations.play('fly');
    bullet.rotation = game.physics.moveToPointer(bullet, 1000);
    bullet.rotation += Math.PI / 2;
    shootSound.play();
  }
}

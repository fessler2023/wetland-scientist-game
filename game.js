/*
========================================================================
Program: The Adventures of Little Doug - Level 2: Wetland Explorer
Author: Douglas Fessler
Date: 2026-02-09
========================================================================
*/

// -------------------------
// Phaser Config
// -------------------------
const config = {
    type: Phaser.AUTO, 
    width: window.innerWidth, 
    height: window.innerHeight, 
    backgroundColor: '#6B8E6E', // Wetland green
    physics: { default: 'arcade', arcade: { debug: false } }, 
    scene: { preload, create, update }, 
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
};

const game = new Phaser.Game(config);

// -------------------------
// Globals
// -------------------------
let player, cursors;
let rocks = [], logs = [], lilypads = [], envSprites = [];
let score = 0, scoreText;
let titleText, titleBg;
let rockFlipSound, ambientSound, trashSound;

let clickedCount = 0;
let totalRocks = 10;
let collectedBugs = [];
let flippedTrash = [];

// -------------------------
// Wetland Critters
// -------------------------
const macroinvertebrates = [
    { key:'dragonflyNymph', sprite:'dragonflyNymph.png', name:'Dragonfly Nymph',
      blurb:'Dragonfly nymphs live in still water and are powerful predators of mosquitoes.' },
    { key:'damselflyNymph', sprite:'damselflyNymph.png', name:'Damselfly Nymph',
      blurb:'Damselfly nymphs are sensitive to pollution and common in healthy wetlands.' },
    { key:'divingBeetle', sprite:'divingBeetle.png', name:'Diving Beetle',
      blurb:'Diving beetles trap air bubbles to breathe underwater.' },
    { key:'waterBoatman', sprite:'waterBoatman.png', name:'Water Boatman',
      blurb:'Water boatmen help recycle nutrients in wetlands.' },
    { key:'snail', sprite:'snail.png', name:'Freshwater Snail',
      blurb:'Freshwater snails graze on algae and keep wetland waters clear.' },
    { key:'tadpole', sprite:'tadpole.png', name:'Tadpole',
      blurb:'Tadpoles grow into frogs and toads. Wetlands are critical nurseries.' }
];

// -------------------------
// Trash Items
// -------------------------
const trashItems = [
    { key:'plasticBag', sprite:'plasticBag.png', name:'Plastic Bag', points:-6,
      blurb:'Plastic bags can smother wetland plants and trap wildlife.' },
    { key:'foamCup', sprite:'foamCup.png', name:'Foam Cup', points:-5,
      blurb:'Foam breaks into tiny pieces eaten by wildlife.' },
    { key:'fishingLine', sprite:'fishingLine.png', name:'Fishing Line', points:-7,
      blurb:'Fishing line can entangle birds, turtles, and amphibians.' },
    { key:'oilSheen', sprite:'oilSheen.png', name:'Oil Residue', points:-8,
      blurb:'Oil pollution blocks oxygen exchange in wetlands.' }
];

// -------------------------
// Vegetation Anchors
// -------------------------
const vegetation = [
    { key:'cattail', x:0.85, y:0.25, scale:0.18 },
    { key:'reeds', x:0.4, y:0.7, scale:0.35 },
    { key:'grass', x:0.2, y:0.4, scale:0.25 }
];

// -------------------------
// Helper function for non-overlapping positions
// -------------------------
function getNonOverlappingPosition(existingObjects, widthRange, heightRange, minDistance = 0.08, maxAttempts = 20) {
    let attempt = 0;
    let pos = { x: 0, y: 0 };
    let safe = false;

    while(!safe && attempt < maxAttempts) {
        pos.x = Phaser.Math.FloatBetween(widthRange.min, widthRange.max);
        pos.y = Phaser.Math.FloatBetween(heightRange.min, heightRange.max);
        safe = true;

        for (let obj of existingObjects) {
            const dx = pos.x - obj.x;
            const dy = pos.y - obj.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            if(distance < minDistance) {
                safe = false;
                break;
            }
        }
        attempt++;
    }

    return pos;
}

// -------------------------
// Preload
// -------------------------
function preload() {
    this.load.image('player','player.png');
    this.load.image('rock','rock.png');
    this.load.image('tree','tree.png'); 
    this.load.image('cattail','cattail.png');
    this.load.image('marshWater','marshWater.png');
    this.load.image('treestump','treestump.png');
    this.load.image('log','log.png');
    this.load.image('lilypad','lilypad.png');

    vegetation.forEach(v => this.load.image(v.key, v.key + '.png'));
    macroinvertebrates.forEach(c => this.load.image(c.key,c.sprite));
    trashItems.forEach(t => this.load.image(t.key,t.sprite));

    this.load.audio('rockFlip','rockFlip.wav');
    this.load.audio('ambientWetland','wetlandAmbience.mp3');
    this.load.audio('trashSound','trash.wav');
}

// -------------------------
// Create
// -------------------------
function create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Title
    titleBg = this.add.rectangle(w/2,0,w,40,0x000000,0.4).setOrigin(0.5,0).setDepth(10);
    titleText = this.add.text(w/2,8,'The Adventures of Little Doug — Wetland Explorer',
        {font:'22px Arial',fill:'#fff',fontStyle:'bold'}).setOrigin(0.5,0).setDepth(11);
    scoreText = this.add.text(10,50,'Score: 0',{font:'18px Arial',fill:'#fff'}).setDepth(11);

    // -------------------------
    // Marsh water pockets
    // -------------------------
    for(let i=0;i<6;i++){
        this.add.image(
            w*Phaser.Math.FloatBetween(0.15,0.85),
            h*Phaser.Math.FloatBetween(0.35,0.75),
            'marshWater'
        )
        .setScale(Phaser.Math.FloatBetween(0.3,0.6))
        .setAlpha(0.6)
        .setDepth(0)
        .setRotation(Phaser.Math.FloatBetween(-0.1,0.1));
    }

    // -------------------------
    // Tree stumps
    // -------------------------
    for(let i=0;i<4;i++){
        this.add.image(
            w*Phaser.Math.FloatBetween(0.1,0.9),
            h*Phaser.Math.FloatBetween(0.4,0.85),
            'treestump'
        )
        .setScale(Phaser.Math.FloatBetween(0.45,0.6))
        .setOrigin(0.5,1)
        .setDepth(1)
        .setRotation(Phaser.Math.FloatBetween(-0.1,0.1));
    }

    // -------------------------
    // Dense cattails (scenery)
    // -------------------------
    for(let i=0;i<30;i++){
        this.add.image(
            w*Phaser.Math.FloatBetween(0.05,0.95),
            h*Phaser.Math.FloatBetween(0.3,0.9),
            'cattail'
        )
        .setScale(Phaser.Math.FloatBetween(0.14,0.22))
        .setOrigin(0.5,1)
        .setDepth(1);
    }

    // Vegetation array
    vegetation.forEach(obj=>{
        const s = this.add.image(w*obj.x,h*obj.y,obj.key)
            .setScale(obj.scale)
            .setOrigin(0.5,1)
            .setDepth(1);
        envSprites.push(s);
    });

    // Trees along top
    for(let i=0;i<24;i++){
        this.add.image(w*Math.random(),h*0.05,'tree')
            .setScale(Phaser.Math.FloatBetween(0.5,0.7))
            .setDepth(2);
    }

    // Player
    player = this.physics.add.sprite(w/2,h*0.8,'player')
        .setScale(0.5).setCollideWorldBounds(true).setDepth(2);
    cursors = this.input.keyboard.createCursorKeys();

    // Sounds
    rockFlipSound = this.sound.add('rockFlip',{volume:0.5});
    ambientSound = this.sound.add('ambientWetland',{loop:true,volume:0.3});
    ambientSound.play();
    trashSound = this.sound.add('trashSound',{volume:0.5});

    // -------------------------
    // Clickable objects: rocks, logs, lily pads
    // -------------------------
    const clickableObjects = [];

    // Rocks
    for(let i=0;i<totalRocks;i++){
        const pos = getNonOverlappingPosition(clickableObjects, {min:0.1,max:0.9}, {min:0.3,max:0.8});
        const rock = this.physics.add.sprite(
            w*pos.x, h*pos.y, 'rock'
        )
        .setScale(Phaser.Math.FloatBetween(0.25,0.35))
        .setInteractive()
        .setDepth(2);
        rocks.push(rock);
        clickableObjects.push(rock);
    }

    // Logs
    for(let i=0;i<5;i++){
        const pos = getNonOverlappingPosition(clickableObjects, {min:0.1,max:0.9}, {min:0.4,max:0.8});
        const log = this.physics.add.sprite(
            w*pos.x, h*pos.y, 'log'
        )
        .setScale(Phaser.Math.FloatBetween(0.15,0.25))
        .setInteractive()
        .setDepth(2);
        logs.push(log);
        clickableObjects.push(log);
    }

    // Lilypads
    for(let i=0;i<4;i++){
        const pos = getNonOverlappingPosition(clickableObjects, {min:0.2,max:0.8}, {min:0.5,max:0.75});
        const pad = this.physics.add.sprite(
            w*pos.x, h*pos.y, 'lilypad'
        )
        .setScale(Phaser.Math.FloatBetween(0.1,0.2))
        .setInteractive()
        .setDepth(2);
        lilypads.push(pad);
        clickableObjects.push(pad);
    }

    // Interaction for all clickable objects
    clickableObjects.forEach(obj => {
        obj.on('pointerdown', () => {
            if(Phaser.Math.Distance.Between(player.x, player.y, obj.x, obj.y) < 60){
                let isTrash = Phaser.Math.Between(1,100) <= 20;
                let content;
                if(isTrash){
                    content = Phaser.Utils.Array.GetRandom(trashItems);
                    trashSound.play();
                    score += content.points;
                    flippedTrash.push(content.name);
                } else {
                    content = Phaser.Utils.Array.GetRandom(macroinvertebrates);
                    rockFlipSound.play();
                    score += 10;
                    collectedBugs.push(content.name);
                }
                obj.disableInteractive();
                obj.destroy();
                scoreText.setText('Score: ' + score);
                updateExplorer(content);
                clickedCount++;
                if(clickedCount >= clickableObjects.length) showLevelSummary();
            }
        });
    });

    window.addEventListener('resize',resizeGame);
}

// -------------------------
// Update
// -------------------------
function update(){
    player.setVelocity(0);
    const speed=200;
    if(cursors.left.isDown) player.setVelocityX(-speed);
    else if(cursors.right.isDown) player.setVelocityX(speed);
    if(cursors.up.isDown) player.setVelocityY(-speed);
    else if(cursors.down.isDown) player.setVelocityY(speed);
}

// -------------------------
// Resize Handler
// -------------------------
function resizeGame(){
    const w=window.innerWidth,h=window.innerHeight;
    game.scale.resize(w,h);
    titleBg.setSize(w,40);
    titleBg.setPosition(w/2,0);
    titleText.setPosition(w/2,8);
    player.setPosition(w/2,h*0.8);
}

// -------------------------
// Explorer Panel Update
// -------------------------
function updateExplorer(item){
    explorerImage.src=item.sprite;
    explorerName.innerText=item.name;
    explorerText.innerText=item.blurb;
}

// -------------------------
// Level Summary
// -------------------------
function showLevelSummary(){
    alert(`Level Complete!\nScore: ${score}`);
    window.location.reload();
}





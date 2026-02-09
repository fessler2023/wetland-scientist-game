/*
========================================================================
Program: The Adventures of Little Doug - Level 2: Wetland Explorer
Author: Douglas Fessler
Date: 2026-02-09
Description: 
    This is an educational interactive game using Phaser 3. The player 
    explores a wetland/pond environment, flips logs or mud clumps to discover 
    macroinvertebrates (bugs, tadpoles, snails) or trash items. Finding critters 
    increases the score, while trash reduces it. Players learn about wetland 
    ecology, amphibians, and the importance of keeping wetlands clean.
========================================================================
*/

// -------------------------
// Phaser Config
// -------------------------
const config = {
    type: Phaser.AUTO, 
    width: window.innerWidth, 
    height: window.innerHeight, 
    backgroundColor: '#6B8E6E', // Muted wetland green
    physics: { default: 'arcade', arcade: { debug: false } }, 
    scene: { preload, create, update }, 
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
};

const game = new Phaser.Game(config);

// -------------------------
// Globals
// -------------------------
let player, cursors; 
let rocks = [], envSprites = []; 
let score = 0, scoreText; 
let titleText, titleBg; 
let rockFlipSound, ambientSound, trashSound; 

let clickedCount = 0; 
let totalRocks = 10; // fewer rocks/logs in wetland
let collectedBugs = []; 
let flippedTrash = []; 

// -------------------------
// Wetland Macroinvertebrates & Critters
// -------------------------
const macroinvertebrates = [
    {
        key: 'dragonflyNymph',
        sprite: 'dragonflyNymph.png',
        name: 'Dragonfly Nymph',
        blurb: 'Dragonfly nymphs live in still water and are powerful predators of mosquitoes. Their presence signals a healthy wetland.'
    },
    {
        key: 'damselflyNymph',
        sprite: 'damselflyNymph.png',
        name: 'Damselfly Nymph',
        blurb: 'Damselfly nymphs are common in ponds and marshes. They are sensitive to pollution and help maintain insect balance.'
    },
    {
        key: 'divingBeetle',
        sprite: 'divingBeetle.png',
        name: 'Diving Beetle',
        blurb: 'Diving beetles are strong swimmers that trap air bubbles to breathe underwater. They are important wetland predators.'
    },
    {
        key: 'waterBoatman',
        sprite: 'waterBoatman.png',
        name: 'Water Boatman',
        blurb: 'Water boatmen swim upside down and feed on algae and small organisms, helping recycle nutrients in wetlands.'
    },
    {
        key: 'snail',
        sprite: 'snail.png',
        name: 'Freshwater Snail',
        blurb: 'Freshwater snails graze on algae and plant material, helping keep wetland waters clear.'
    },
    {
        key: 'tadpole',
        sprite: 'tadpole.png',
        name: 'Tadpole',
        blurb: 'Tadpoles are young frogs and toads. Wetlands provide critical nursery habitat for amphibians.'
    }
];

// -------------------------
// Wetland Trash Items (20% chance)
// -------------------------
const trashItems = [
    {
        key: 'plasticBag',
        sprite: 'plasticBag.png',
        name: 'Plastic Bag',
        blurb: 'Plastic bags can smother wetland plants and trap wildlife, especially in still water.',
        points: -6
    },
    {
        key: 'foamCup',
        sprite: 'foamCup.png',
        name: 'Foam Cup',
        blurb: 'Foam products break into tiny pieces that persist in wetlands and are often eaten by wildlife.',
        points: -5
    },
    {
        key: 'fishingLine',
        sprite: 'fishingLine.png',
        name: 'Fishing Line',
        blurb: 'Discarded fishing line can entangle birds, turtles, and amphibians in wetland habitats.',
        points: -7
    },
    {
        key: 'oilSheen',
        sprite: 'oilSheen.png',
        name: 'Oil Residue',
        blurb: 'Oil pollution blocks oxygen exchange and poisons wetland organisms.',
        points: -8
    }
];

// -------------------------
// Wetland Vegetation (replaces bushes)
// -------------------------
const vegetation = [
    { key: 'cattail', x: 0.85, y: 0.25, scale: 0.18 },
    { key: 'cattail', x: 0.75, y: 0.85, scale: 0.35 },
    { key: 'reeds', x: 0.4, y: 0.7, scale: 0.4 },
    { key: 'grass', x: 0.2, y: 0.4, scale: 0.3 }
];

// -------------------------
// Preload
// -------------------------
function preload() {
    this.load.image('player', 'player.png');
    this.load.image('rock', 'rock.png'); // still “rock” for interactivity
    this.load.image('tree', 'tree.png'); 

    vegetation.forEach(v => this.load.image(v.key, v.key + '.png')); 
    macroinvertebrates.forEach(c => this.load.image(c.key, c.sprite));
    trashItems.forEach(t => this.load.image(t.key, t.sprite));

    // Sounds
    this.load.audio('rockFlip', 'rockFlip.wav');
    this.load.audio('ambientWetland', 'wetlandAmbience.mp3'); // optional wetland ambient
    this.load.audio('trashSound', 'trash.wav');
}

// -------------------------
// Create
// -------------------------
function create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Title Bar
    titleBg = this.add.rectangle(w/2, 0, w, 40, 0x000000, 0.4).setOrigin(0.5,0).setDepth(10);
    titleText = this.add.text(w/2, 8, 'The Adventures of Little Doug — Wetland Explorer', 
        { font:'22px Arial', fill:'#fff', fontStyle:'bold' }).setOrigin(0.5,0).setDepth(11);

    // Score Text
    scoreText = this.add.text(10, 50, 'Score: 0', { font:'18px Arial', fill:'#fff' }).setDepth(11);

    // Add vegetation
    vegetation.forEach(obj => {
        const sprite = this.add.image(w*obj.x, h*obj.y, obj.key).setScale(obj.scale).setDepth(1);
        envSprites.push(sprite);
    });

    // Trees (randomized top border)
    const treeCount = 24;
    for (let i = 0; i < treeCount; i++) {
        const randX = Phaser.Math.FloatBetween(0, 1);
        const scale = Phaser.Math.FloatBetween(0.5, 0.7);
        const depth = Phaser.Math.Between(1, 2);
        this.add.image(w * randX, h * 0.05, 'tree').setScale(scale).setDepth(depth);
    }

    // Player
    player = this.physics.add.sprite(w/2, h*0.8, 'player').setScale(0.5).setCollideWorldBounds(true).setDepth(2);
    cursors = this.input.keyboard.createCursorKeys();

    // Load sounds
    rockFlipSound = this.sound.add('rockFlip', { volume: 0.5 });
    ambientSound = this.sound.add('ambientWetland', { loop: true, volume: 0.3 });
    ambientSound.play();
    trashSound = this.sound.add('trashSound', { volume: 0.5 });

    // Rocks (clickable logs/mud patches)
    for (let i = 0; i < totalRocks; i++) {
        const randX = Phaser.Math.FloatBetween(0.1, 0.9);
        const randY = Phaser.Math.FloatBetween(0.3, 0.8);
        const rock = this.physics.add.sprite(w * randX, h * randY, 'rock')
            .setScale(Phaser.Math.FloatBetween(0.25, 0.35))
            .setInteractive()
            .setDepth(2);

        rocks.push(rock);

        rock.on('pointerdown', () => {
            if (Phaser.Math.Distance.Between(player.x, player.y, rock.x, rock.y) < 60) {
                let isTrash = Phaser.Math.Between(1, 100) <= 20;
                let content;
                if(isTrash) {
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

                rock.disableInteractive();
                rock.destroy();
                scoreText.setText('Score: ' + score);
                updateExplorer(content);
                clickedCount++;
                if(clickedCount >= totalRocks) showLevelSummary();
            } else console.log('Move closer to flip the rock!');
        });
    }

    window.addEventListener('resize', resizeGame);
}

// -------------------------
// Update
// -------------------------
function update() {
    player.setVelocity(0);
    const speed = 200;
    if(cursors.left.isDown) player.setVelocityX(-speed);
    else if(cursors.right.isDown) player.setVelocityX(speed);
    if(cursors.up.isDown) player.setVelocityY(-speed);
    else if(cursors.down.isDown) player.setVelocityY(speed);
}

// -------------------------
// Resize Handler
// -------------------------
function resizeGame() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    game.scale.resize(w,h);

    titleBg.setSize(w,40);
    titleBg.setPosition(w/2,0);
    titleText.setPosition(w/2,8);

    vegetation.forEach((b,i)=> envSprites[i].setPosition(w*b.x, h*b.y));
    rocks.forEach(r => { if(r.active) r.setPosition(r.x/w * w, r.y/h * h); });
    player.setPosition(w/2,h*0.8);
}

// -------------------------
// Explorer Panel Update
// -------------------------
function updateExplorer(item) {
    document.getElementById("explorerImage").src = item.sprite;
    document.getElementById("explorerName").innerText = item.name;
    document.getElementById("explorerText").innerText = item.blurb;
}

// -------------------------
// Level Summary
// -------------------------
function showLevelSummary() {
    let summary = `Level Complete!\nScore: ${score}\n\nBugs Collected:\n`;
    
    const bugCounts = collectedBugs.reduce((acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});
    
    for (let bug in bugCounts) {
        summary += `- ${bug} x${bugCounts[bug]}\n`;
    }

    summary += `\nTrash Collected:\n`;
    flippedTrash.forEach(t => summary += `- ${t}\n`);

    alert(summary);

    const wantsFeedback = confirm("Would you like to provide feedback on this level? Click OK to go to the feedback form, or Cancel to continue playing.");

    if (wantsFeedback) {
        window.open(
            "https://docs.google.com/forms/d/e/1FAIpQLScFHSVlx0Fp4j5Kp8qVK7krCadWA7juq-U34Pt_ZWN8IUARKw/viewform?usp=sf_link",
            "_blank"
        );
    } else {
        window.location.reload();
    }
}



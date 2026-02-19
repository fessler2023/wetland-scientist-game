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
    backgroundColor: '#6B8E6E', 
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
      blurb:'Dragonfly nymphs live underwater and eat mosquito larvae. They help control insect populations and indicate healthy wetland water.' },

    { key:'damselflyNymph', sprite:'damselflyNymph.png', name:'Damselfly Nymph',
      blurb:'Damselfly nymphs are sensitive to pollution. Finding them means the water is clean and well-balanced.' },

    { key:'divingBeetle', sprite:'divingBeetle.png', name:'Diving Beetle',
      blurb:'Diving beetles carry air bubbles underwater and hunt small insects. They help maintain balance in pond ecosystems.' },

    { key:'waterBoatman', sprite:'waterboatman.png', name:'Water Boatman',
      blurb:'Water boatmen feed on algae and organic matter, helping recycle nutrients and keep water clear.' },

    { key:'snail', sprite:'snail.png', name:'Freshwater Snail',
      blurb:'Freshwater snails graze on algae and help filter the water, preventing harmful overgrowth.' },

    { key:'tadpole', sprite:'tadpole.png', name:'Tadpole',
      blurb:'Tadpoles eat algae and grow into frogs or toads. They help keep ponds clean and support amphibian populations.' },

    { key:'springPeeper', sprite:'springpeeper.png', name:'Spring Peeper',
      blurb:'Spring peepers are tiny frogs with loud spring calls. They indicate healthy wetlands and help control insects.' },

    { key:'woodFrog', sprite:'woodFrog.png', name:'Wood Frog',
      blurb:'Wood frogs breed in temporary pools. Their presence shows a functioning wetland that supports clean seasonal water.' },

    { key:'americanToad', sprite:'americanToad.png', name:'American Toad',
      blurb:'American toads eat insects and pests. They thrive in healthy wetlands and signal balanced ecosystems.' },

    { key:'paintedTurtle', sprite:'paintedTurtle.png', name:'Painted Turtle',
      blurb:'Painted turtles eat plants and small animals. They help keep wetlands balanced and depend on clean water habitats.' },

    { key:'greenFrog', sprite:'greenFrog.png', name:'Green Frog',
      blurb:'Green frogs eat insects and small invertebrates. They are a strong indicator of good water quality.' },

    { key:'northernLeopardFrog', sprite:'northernLeopardFrog.png', name:'Northern Leopard Frog',
      blurb:'Northern leopard frogs prefer marshy wetlands. Their presence signals clean water and healthy habitat.' },

    { key:'caddisflyLarvae', sprite:'caddisfly.png', name:'Caddisfly Larva',
      blurb:'Caddisfly larvae build tiny cases from sand and sticks. They filter organic material from water and indicate strong water quality.' },

    { key:'mayflyNymph', sprite:'mayfly.png', name:'Mayfly Nymph',
      blurb:'Mayfly nymphs survive only in clean, oxygen-rich water. They are one of the best indicators of healthy wetlands.' },

    { key:'stoneflyNymph', sprite:'stonefly.png', name:'Stonefly Nymph',
      blurb:'Stonefly nymphs are extremely sensitive to pollution. Finding them means the water is very clean and well-oxygenated.' },

    { key:'snappingTurtle', sprite:'snappingTurtle.png', name:'Snapping Turtle',
      blurb:'Snapping turtles are top wetland predators. They help control fish and invertebrate populations, keeping ecosystems balanced.' },

    { key:'blandingsTurtle', sprite:'blandingsTurtle.png', name:'Blanding’s Turtle',
      blurb:'Blanding’s turtles depend on healthy marshes and ponds. Their presence indicates strong wetland habitat.' },

    { key:'easternBoxTurtle', sprite:'easternBoxTurtle.png', name:'Eastern Box Turtle',
      blurb:'Box turtles move between wetlands and forests, helping connect ecosystems and spread plant seeds.' }
];


// -------------------------
// Trash Items
// -------------------------
const trashItems = [
    { key:'plasticBag', sprite:'plasticBag.png', name:'Plastic Bag', points:-6,
      blurb:'Plastic bags can smother wetland plants and trap turtles, birds, and frogs. As they break down into microplastics, they pollute water that wildlife and humans both depend on.' },

    { key:'styrofoam', sprite:'styrofoam.png', name:'Foam Cup', points:-5,
      blurb:'Foam breaks into tiny pieces that animals mistake for food. These particles pollute water and can eventually enter the human water supply and food chain.' },

    { key:'fishingLine', sprite:'fishingLine.png', name:'Fishing Line', points:-7,
      blurb:'Discarded fishing line tangles birds, turtles, and amphibians. It does not break down easily and pollutes the same waters people use for recreation and drinking.' },

    { key:'oilSheen', sprite:'oilSheen.png', name:'Oil Residue', points:-8,
      blurb:'Oil pollution blocks oxygen in the water and poisons fish, frogs, and insects. Contaminated wetlands reduce natural water filtration that helps keep human water sources clean.' },

    { key:'plasticBottle', sprite:'plasticBottle.png', name:'Plastic Bottle', points:-5,
      blurb:'Plastic bottles can trap small animals and slowly break into microplastics. These pollutants harm wildlife and can return to humans through drinking water and food.' },

    { key:'aluminumCan', sprite:'can.png', name:'Aluminum Can', points:-4,
      blurb:'Aluminum cans can leach chemicals as they degrade. Polluted water harms wetland ecosystems and reduces the natural filtration that protects human communities.' },

    { key:'glassBottle', sprite:'glassBottle.png', name:'Glass Bottle', points:-6,
      blurb:'Broken glass injures wildlife and people. Trash in wetlands disrupts habitats and weakens the natural systems that filter and clean our water.' },

    { key:'cigaretteButt', sprite:'cigarette.png', name:'Cigarette Butt', points:-6,
      blurb:'Cigarette filters contain toxic chemicals that leach into water. These toxins harm fish and amphibians and contaminate water that eventually flows downstream to communities.' }
];


// -------------------------
// Vegetation Anchors
// -------------------------
const vegetation = [
    { key:'cattail', x:0.85, y:0.25, scale:0.18 },
    //{ key:'reeds', x:0.4, y:0.7, scale:0.35 },
    //{ key:'grass', x:0.2, y:0.4, scale:0.25 }
];

// -------------------------
// Helper function for non-overlapping positions
// -------------------------
function getFreePosition(existingPositions, widthRange, heightRange, minDistance = 0.08, maxAttempts = 50) {
    let attempt = 0;
    let pos = { x: 0, y: 0 };
    let safe = false;

    while(!safe && attempt < maxAttempts) {
        pos.x = Phaser.Math.FloatBetween(widthRange.min, widthRange.max);
        pos.y = Phaser.Math.FloatBetween(heightRange.min, heightRange.max);
        safe = true;

        for (let p of existingPositions) {
            const dx = pos.x - p.x;
            const dy = pos.y - p.y;
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
    for(let i=0;i<40;i++){
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
    const occupiedPositions = [];
    for(let i=0;i<4;i++){
        const x = Phaser.Math.FloatBetween(0.1,0.9);
        const y = Phaser.Math.FloatBetween(0.4,0.85);
        this.add.image(w*x, h*y, 'treestump')
            .setScale(Phaser.Math.FloatBetween(0.45,0.6))
            .setOrigin(0.5,1)
            .setDepth(1)
            .setRotation(Phaser.Math.FloatBetween(-0.1,0.1));
        occupiedPositions.push({x:x, y:y}); // add to occupied positions
    }

    // -------------------------
    // Dense cattails
    // -------------------------
    for(let i=0;i<30;i++){
        const x = Phaser.Math.FloatBetween(0.05,0.95);
        const y = Phaser.Math.FloatBetween(0.3,0.9);
        this.add.image(w*x, h*y, 'cattail')
            .setScale(Phaser.Math.FloatBetween(0.14,0.22))
            .setOrigin(0.5,1)
            .setDepth(1);
        occupiedPositions.push({x:x, y:y}); // avoid placing clickables here
    }

    // Vegetation array
    vegetation.forEach(obj=>{
        const s = this.add.image(w*obj.x,h*obj.y,obj.key)
            .setScale(obj.scale)
            .setOrigin(0.5,1)
            .setDepth(1);
        envSprites.push(s);
        occupiedPositions.push({x: obj.x, y: obj.y});
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
        const pos = getFreePosition(occupiedPositions, {min:0.1,max:0.9}, {min:0.3,max:0.8}, 0.08);
        const rock = this.physics.add.sprite(w*pos.x, h*pos.y, 'rock')
            .setScale(Phaser.Math.FloatBetween(0.15,0.25))
            .setInteractive()
            .setDepth(2);
        clickableObjects.push(rock);
        rocks.push(rock);
        occupiedPositions.push(pos);
    }

    // Logs
    for(let i=0;i<5;i++){
        const pos = getFreePosition(occupiedPositions, {min:0.1,max:0.9}, {min:0.4,max:0.8}, 0.08);
        const log = this.physics.add.sprite(w*pos.x, h*pos.y, 'log')
            .setScale(Phaser.Math.FloatBetween(0.15,0.25))
            .setInteractive()
            .setDepth(2);
        clickableObjects.push(log);
        logs.push(log);
        occupiedPositions.push(pos);
    }

    // Lilypads
    for(let i=0;i<4;i++){
        const pos = getFreePosition(occupiedPositions, {min:0.2,max:0.8}, {min:0.5,max:0.75}, 0.08);
        const pad = this.physics.add.sprite(w*pos.x, h*pos.y, 'lilypad')
            .setScale(0.10) // smaller size
            .setInteractive()
            .setDepth(2);
        clickableObjects.push(pad);
        lilypads.push(pad);
        occupiedPositions.push(pos);
    }

    // Interaction for all clickables
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






















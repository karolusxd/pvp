var gamewindow = document.getElementById("gamewindow");
var ctx = gamewindow.getContext("2d");
var usrindex = 0;
var ingame = false;
var alive = true;

// html elements
var fightbtn = document.getElementById("fightbtn");
var enterscreen = document.getElementById("enterscreen");
var firstslotselect = document.getElementById("firstslotselect");
var secondslotselect = document.getElementById("secondslotselect");
var thirdslotselect = document.getElementById("thirdslotselect");
var playernameinput = document.getElementById("playernameinput");

playernameinput.onkeyup = function () {
    if (playernameinput.value != "") {
        fightbtn.disabled = false;
    } else {
        fightbtn.disabled = true;
    }
}

fightbtn.onclick = function () {
    enterscreen.style.display = "none";
    inventoryslot[0] = firstslotselect.value;
    inventoryslot[1] = secondslotselect.value;
    inventoryslot[2] = thirdslotselect.value;

    //create new character
    usrindex = champions.name.length;
    registernewchampion(playernameinput.value);
    ingame = true;
    render();
}

//sprite assets
var embergaugesprite = new Image();
embergaugesprite.src = "./asset/sprites/ember-gauge.png";
var playersprite = new Image();
playersprite.src = "./asset/sprites/default-char-1.png";
var barrelsprite = new Image();
barrelsprite.src = "./asset/sprites/barrels.png";
var potionsprite = new Image();
potionsprite.src = "./asset/sprites/potions.png";

//consumes in inventory sprites
var singlesprite = new Image();
singlesprite.src = "./asset/sprites/single.png";
var trisprite = new Image();
trisprite.src = "./asset/sprites/tri.png";
var orbisprite = new Image();
orbisprite.src = "./asset/sprites/orbis.png";

var speedsprite = new Image();
speedsprite.src = "./asset/sprites/speed.png";
var confsprite = new Image();
confsprite.src = "./asset/sprites/conf.png";
var drainsprite = new Image();
drainsprite.src = "./asset/sprites/drain.png";
var awaresprite = new Image();
awaresprite.src = "./asset/sprites/aware.png";
var fatiguesprite = new Image();
fatiguesprite.src = "./asset/sprites/fatigue.png";
var windsprite = new Image();
windsprite.src = "./asset/sprites/heal.png";

var embersound = new Audio();
embersound.src = "./asset/audio/ember.mp3";
var nopesound = new Audio();
nopesound.src = "./asset/audio/nope.mp3";
nopesound.volume = 0;
var drinksound = new Audio();
drinksound.src = "./asset/audio/drink.wav";
var windsound = new Audio();
windsound.src = "./assets/audio/windd.wav";

window.onload = function () {
    gamewindow.height = 480;
    gamewindow.width = 640;

    setmapdata();

    //read map data
    mapmasterdata = mapdata.split("!");
    for (i = 0; i < mapmasterdata.length; i++) {
        mapmasterdata[i] = mapmasterdata[i].split("");
    }
    for (i = 0; i < mapmasterdata.length; i++) {
        for (p = 0; p < mapmasterdata.length; p++) {
            mapmasterdata[i][p] = parseInt(mapmasterdata[i][p]);
        }
    }
}

var embergaugemax = 8;
var lightdistance = 2000;
var clienthp = 200;
var clientember = 1;
var embercooldown = 65; //def is 65
var camera = [0, 0];
var clientdirectionframe = 0;
var clientanimationframe = 0;
var moved = 0;
var emberformcooldown = 0;
var focusenemyindex = -1;
var speedtick = 0;
var inventoryslot = ["none", "none", "none", "none", "none", "none"];
var inventoryslotcooldown = [0, 0, 0, 0, 0, 0];
var inventorytriggered = [0, 0, 0, 0, 0, 0];
var consumes = {
    name: ["speed", "wind", "conf", "drain", "aware", "fatigue"],
    cooldown: [1000, 100, 2500, 2000, 700, 5000],
    sprites: [speedsprite, windsprite, confsprite, drainsprite, awaresprite, fatiguesprite]
}
var textdata = {
    positionx: [],
    positiony: [],
    life: [],
    text: [],
    type: []
}
var champions = {
    emberlevel: [6],
    lifelevel: [200],
    spacelevel: [2],
    name: ["Tester"],
    positionx: [30],
    positiony: [30],
    animframe: [0],
    direction: [0],
    speed: [3],
    speeding: [0],
    conf: [0],
    fatigue: [0],
    drain: [0],
    dead: [0]
}

var objectdata = {
    positionx: [29],
    positiony: [45],
    health: [200],
    maxhealth: [200],
    name: ["Item Barrel"],
    respawntick: [1950],
    status: [1]
}

var consdata = { //only for map render
    type: [], // 0 speed
    positionx: [],
    positiony: [],
    height: []
}

function spawncons(barrelindex) { // the one who breaks the barrel is responsible of spawning the ocns
    var consamount = getRandomInt(2, 5);
    for (i = 0; i < consamount; i++) {
        var whichcons = 0;
        consdata.type.push(whichcons);
        consdata.positionx.push(objectdata.positionx[barrelindex] + getRandomInt(-5, 5));
        consdata.positiony.push(objectdata.positiony[barrelindex] + getRandomInt(2, 5));
        consdata.height.push(0);
    }
}

var shoots = "single";
var projectiledata = {
    type: [],
    positionx: [],
    positiony: [],
    velx: [],
    vely: [],
    velstore: [],
    updated: [],
    framereset: [],
    owner: [],
    delete: []
};

function render() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 640, 480);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 640, 480);

    if (alive) {
        champions.dead[usrindex] = 1;
    } else {
        champions.dead[usrindex] = 0;
    }

    //load in game objects
    var mapcode;
    for (i = 0; i < 64; i++) {
        // render floor first
        for (p = 0; p < 64; p++) {
            var pixeldistance = Math.abs((i + camera[1]) - champions.positiony[usrindex]) + Math.abs((p + camera[0]) - champions.positionx[usrindex]);
            mapcode = mapmasterdata[i + camera[1]][p + camera[0]];
            if (mapcode == 1) {
                ctx.fillStyle = "#624d3b";
                // ctx.filter = 'brightness(' + (1 - (pixeldistance / lightdistance - 0.1)) * 100 + ')';
                if (pixeldistance >= lightdistance) {
                    ctx.globalAlpha = 0.1;
                } else {
                    ctx.globalAlpha = 1 - (pixeldistance / lightdistance - 0.1);
                }
                ctx.fillRect(p * 10, i * 10, 10, 10);
            }
            ctx.globalAlpha = 1;
        }
    }
    for (i = 0; i < 64; i++) {
        for (p = 0; p < 64; p++) {
            //render the solid/floating objects
            var pixeldistance = Math.abs((i + camera[1]) - champions.positiony[usrindex]) + Math.abs((p + camera[0]) - champions.positionx[usrindex]);
            if (pixeldistance >= lightdistance) {
                ctx.globalAlpha = 0.1;
            } else {
                ctx.globalAlpha = 1 - (pixeldistance / lightdistance - 0.1);
            }
            mapcode = mapmasterdata[i + camera[1]][p + camera[0]];
            if (mapcode == 2 || mapcode == 3) {
                ctx.fillStyle = "#433220";
                ctx.fillRect(p * 10, i * 10, 10, 10);

                //make wall
                for (o = 0; o < 10; o++) {
                    ctx.fillStyle = "#433220";
                    ctx.fillRect(p * 10, (i * 10) - (o * 10), 10, 10);
                }
                ctx.fillStyle = "#58412b";
                ctx.fillRect(p * 10, (i * 10) - 100, 10, 10);
            } else if (mapcode == 4) {
                //item barrel
                for (x = 0; x < objectdata.name.length; x++) {
                    if (objectdata.positionx[x] == (p + camera[0]) && objectdata.positiony[x] == (i + camera[1])) {
                        if (objectdata.status[x] == 1) {
                            //not broke
                            ctx.drawImage(barrelsprite, 0, 0, 5, 7, p * 10 - 20, i * 10 - 40, 50, 70);
                        } else {
                            //is broke
                            ctx.drawImage(barrelsprite, 5, 0, 5, 7, p * 10 - 20, i * 10 - 40, 50, 70);
                        }
                    }
                }
            }
            ctx.globalAlpha = 1;

            //render cons
            for (x = 0; x < consdata.type.length; x++) {
                if (consdata.positionx[x] == (p + camera[0]) && consdata.positiony[x] == (i + camera[1])) {
                    ctx.drawImage(potionsprite, 0, 0, 3, 3, (consdata.positionx[x] - camera[0]) * 10, (consdata.positiony[x] - 3 - camera[1] - Math.floor(consdata.height[x])) * 10, 30, 30);
                }
            }
        }
        //load players at y coordinate
        for (p = 0; p < champions.positiony.length; p++) {
            if (champions.positiony[p] == (i + camera[1])) {
                if (champions.dead[p] == 1) {
                    //draw shadow
                    ctx.globalAlpha = 0.2;
                    ctx.fillStyle = "#000";
                    ctx.fillRect((champions.positionx[p] - camera[0]) * 10, (champions.positiony[p] - camera[1]) * 10, 20, 10);
                    ctx.globalAlpha = 1;
                    //draw player
                    ctx.drawImage(playersprite, (champions.animframe[p] * 4), 11 * champions.direction[p], 4, 11, ((champions.positionx[p] - camera[0]) * 10) - 10, ((champions.positiony[p] - camera[1]) * 10) - 90, 40, 110);
                }
            }
        }

        for (p = 0; p < projectiledata.type.length; p++) {
            // projectiledata.positiony[p] == (i + camera[1])
            if (projectiledata.updated[p] == 0 && projectiledata.delete[p] == 0) {
                projectiledata.updated[p] = 1;
                //ember render and update code

                //render ember
                var movedpixel = [0, 0];
                var loadpixel = [0, 0];

                //render ember shadow
                for (z = 0; z < 2; z++) {
                    loadpixel[0] += Math.abs(projectiledata.velx[p]);
                    loadpixel[1] += Math.abs(projectiledata.vely[p]);
                    if (loadpixel[0] >= 1) {
                        if (projectiledata.velx[p] > 0) {
                            movedpixel[0] -= 1;
                        } else {
                            movedpixel[0] += 1;
                        }
                        loadpixel[0] = 0;
                    }
                    if (loadpixel[1] >= 1) {
                        if (projectiledata.vely[p] > 0) {
                            movedpixel[1] -= 1;
                        } else {
                            movedpixel[1] += 1;
                        }
                    }

                    ctx.globalAlpha = 0.2;
                    ctx.fillStyle = "#000";
                    ctx.fillRect((projectiledata.positionx[p] + movedpixel[0] - camera[0]) * 10, (projectiledata.positiony[p] + movedpixel[1] - camera[1]) * 10, 10, 10);
                    ctx.globalAlpha = 1;
                }

                //render ember
                for (z = 0; z < 3; z++) {
                    loadpixel[0] += Math.abs(projectiledata.velx[p]);
                    loadpixel[1] += Math.abs(projectiledata.vely[p]);
                    if (loadpixel[0] >= 1) {
                        if (projectiledata.velx[p] > 0) {
                            movedpixel[0] += 1;
                        } else {
                            movedpixel[0] -= 1;
                        }
                        loadpixel[0] = 0;
                    }
                    if (loadpixel[1] >= 1) {
                        if (projectiledata.vely[p] > 0) {
                            movedpixel[1] += 1;
                        } else {
                            movedpixel[1] -= 1;
                        }
                    }

                    ctx.globalAlpha = (0.5 * z);
                    ctx.fillStyle = "#e3021b";
                    ctx.fillStyle = "#00ff00";
                    ctx.fillRect((projectiledata.positionx[p] + movedpixel[0] - camera[0]) * 10, (projectiledata.positiony[p] + movedpixel[1] - camera[1] - 5) * 10, 10, 10);
                    ctx.globalAlpha = 1;
                }

                //update position
                if (Math.abs(projectiledata.velx[p]) != 0 && Math.abs(projectiledata.vely[p]) != 0) {
                    //diagnal
                    if (projectiledata.velstore[p] >= 1) {
                        //update both and reset velstore
                        if (projectiledata.velx[p] > 0) {
                            // right
                            projectiledata.positionx[p] += 1;
                        } else {
                            // left
                            projectiledata.positionx[p] -= 1;
                        }
                        if (projectiledata.vely[p] > 0) {
                            // down
                            projectiledata.positiony[p] += 1;
                        } else {
                            // up
                            projectiledata.positiony[p] -= 1;
                        }
                        projectiledata.velstore[p] = 0;
                    } else {
                        if (Math.abs(projectiledata.velx[p]) > Math.abs(projectiledata.vely[p])) {
                            //update y velstore value
                            if (projectiledata.velx[p] > 0) {
                                // right
                                projectiledata.positionx[p] += 1;
                            } else {
                                // left
                                projectiledata.positionx[p] -= 1;
                            }

                            projectiledata.velstore[p] += Math.abs(projectiledata.vely[p]);
                        } else {
                            //update x velstore value
                            if (projectiledata.vely[p] > 0) {
                                // right
                                projectiledata.positiony[p] += 1;
                            } else {
                                // left
                                projectiledata.positiony[p] -= 1;
                            }

                            projectiledata.velstore[p] += Math.abs(projectiledata.velx[p]);
                        }
                    }

                } else {
                    if (Math.abs(projectiledata.velx[p]) != 0) {
                        //right or left
                        if (projectiledata.velx[p] > 0) {
                            // right
                            projectiledata.positionx[p] += 1;
                        } else {
                            // left
                            projectiledata.positionx[p] -= 1;
                        }
                    } else {
                        // up or down
                        if (projectiledata.vely[p] > 0) {
                            // down
                            projectiledata.positiony[p] += 1;
                        } else {
                            // up
                            projectiledata.positiony[p] -= 1;
                        }
                    }
                }

            }

            var embercoldat = mapmasterdata[projectiledata.positiony[p]][projectiledata.positionx[p]];
            if (embercoldat != 1 && projectiledata.delete[p] != 1) {
                projectiledata.delete[p] = 1;
                if (embercoldat == 4 || embercoldat == 5) {
                    if (embercoldat == 4) {
                        //just find collision from object database
                        for (l = 0; l < objectdata.name.length; l++) {
                            if (objectdata.status[l] != 0) {
                                if (objectdata.positionx[l] == projectiledata.positionx[p] && objectdata.positiony[l] == projectiledata.positiony[p]) {
                                    // its collided
                                    focusenemyindex = l;
                                    objectdata.health[l] -= getRandomInt(10, 32);
                                    if (objectdata.health[l] <= 0) {
                                        spawncons(l);
                                        focusenemyindex = -1;
                                        objectdata.health[l] = 0;
                                        objectdata.status[l] = 0;
                                        //spawn the cons
                                    }
                                }
                            }
                        }
                    } else {
                        // scan from left
                        for (l = 0; l < 10; l++) {
                            if ((projectiledata.positionx[p] + l - 5) >= 0) {
                                //is valid index
                                for (x = 0; x < objectdata.name.length; x++) {
                                    if (objectdata.status[x] != 0) {
                                        if (objectdata.positionx[x] == (projectiledata.positionx[p] + l - 5) && objectdata.positiony[x] == projectiledata.positiony[p]) {
                                            // its collided
                                            focusenemyindex = x;
                                            objectdata.health[x] -= getRandomInt(10, 32);
                                            if (objectdata.health[x] < 0) {
                                                spawncons(l);
                                                focusenemyindex = -1;
                                                objectdata.health[x] = 0;
                                                objectdata.status[x] = 0;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                }
            }
        }
    }

    for (p = 0; p < projectiledata.updated.length; p++) {
        if (projectiledata.owner[p] == usrindex) {
            for (v = 0; v < champions.positionx.length; v++) {
                var collisionbool = projectiledata.positionx[p] == champions.positionx[v] && projectiledata.positiony[p] == champions.positiony[v];
                var collisionbooltwo = projectiledata.positionx[p] == (champions.positionx[v] + 1) && projectiledata.positiony[p] == champions.positiony[v];
                if (collisionbool || collisionbooltwo) {
                    if (projectiledata.owner[p] != v && champions.dead[v] != 0) {
                        console.log(projectiledata.positionx[p]);
                        console.log(projectiledata.positiony[p]);
                        emberhitchampion(v);
                        projectiledata.delete[p] = 1;
                    }
                }
            }
        }
        projectiledata.updated[p] = 0;
    }

    for (p = 0; p < projectiledata.delete.length; p++) {
        if (projectiledata.delete[p] == 1) {
            //delete ember
            projectiledata.type.splice(p, 1);
            projectiledata.positionx.splice(p, 1);
            projectiledata.positiony.splice(p, 1);
            projectiledata.velx.splice(p, 1);
            projectiledata.vely.splice(p, 1);
            projectiledata.velstore.splice(p, 1);
            projectiledata.updated.splice(p, 1);
            projectiledata.framereset.splice(p, 1);
            projectiledata.owner.splice(p, 1);
            projectiledata.delete.splice(p, 1);
            p -= 1;
        }
    }

    //load player nametags and chat
    for (i = 0; i < champions.name.length; i++) {
        if (i == usrindex) {
            ctx.fillStyle = "#fff";
            if (alive) {
                ctx.font = "15px defaultrs";
                ctx.fillText(champions.name[i], (champions.positionx[i] - camera[0]) * 10 - ((champions.name[i].length / 2) * 5), (champions.positiony[i] - camera[1]) * 10 + 30);
            }
        } else {
            ctx.fillStyle = "#f99ea0";
            if (champions.dead[i] == 1) {
                ctx.font = "15px defaultrs";
                ctx.fillText(champions.name[i], (champions.positionx[i] - camera[0]) * 10 - ((champions.name[i].length / 2) * 5), (champions.positiony[i] - camera[1]) * 10 + 30);
            }
        }
    }

    //e3021b ember color 4px


    // set client status
    var embergaugemax = champions.emberlevel[usrindex] * 2;
    if (embergaugemax > clientember) {
        if (embercooldown == 0) {
            clientember += 1;
        }
    }

    if (embercooldown >= 0) {
        embercooldown -= 1;
    } else {
        embercooldown = 15; // def is 65
    }

    //empty ember gauge
    for (i = 0; i < embergaugemax; i++) {
        if (embergaugemax > 15) {
            ctx.drawImage(embergaugesprite, 6, 0, 6, 7, 400 - (i * 400 / (embergaugemax)), 400, 18, 21);
        } else {
            ctx.drawImage(embergaugesprite, 6, 0, 6, 7, 10 + (i * 26), 400, 18, 21);
        }
    }
    //fill ember gauge
    for (i = 0; i < clientember; i++) {
        if (embergaugemax > 15) {
            ctx.drawImage(embergaugesprite, 0, 0, 6, 7, (400 - ((embergaugemax - clientember) * 400 / (embergaugemax))) - (i * 400 / (embergaugemax)), 400, 18, 21);
        } else {
            ctx.drawImage(embergaugesprite, 0, 0, 6, 7, 10 + (i * 26), 400, 18, 21);
        }
    }

    // cons inventory slots
    for (i = 0; i < 6; i++) {
        ctx.fillStyle = "#888";
        ctx.globalAlpha = 0.5;
        ctx.fillRect(50 + (i * 50), 425, 40, 40)
        ctx.globalAlpha = 1;
    }

    //load cons icon depending on slot
    for (i = 0; i < inventoryslot.length; i++) {
        if (inventoryslot[i] != "none") {
            if (inventoryslotcooldown[i] != 0) {
                ctx.globalAlpha = 0.5;
            }
            var consindex = consumes.name.indexOf(inventoryslot[i]);
            ctx.drawImage(consumes.sprites[consindex], 50 + 5 + (i * 50), 430, 30, 30);
            ctx.globalAlpha = 1;
        }
    }

    // ember mode in inventory
    if (shoots == "single") {
        ctx.drawImage(singlesprite, 10, 430, 30, 30);
    } else if (shoots == "tri") {
        ctx.drawImage(trisprite, 10, 430, 30, 30);
    } else if (shoots == "orbis") {
        ctx.drawImage(orbisprite, 10, 430, 30, 30);
    }

    // show exp bar
    ctx.fillStyle = "#c0bfbf";
    ctx.fillRect(0, 470, 10, 2);
    ctx.fillStyle = "#fefefe";
    ctx.fillRect(0, 472, 10, 2);
    ctx.fillStyle = "#bfc0c0";
    ctx.fillRect(0, 474, 10, 2);
    ctx.fillStyle = "#828282";
    ctx.fillRect(0, 476, 10, 2);


    //life bar
    ctx.fillStyle = "#fff";
    ctx.fillRect(619, 279, 17, 202);
    ctx.fillStyle = "#404040";
    ctx.fillRect(620, 280, 15, 200);
    ctx.fillStyle = "#ff1b32";
    ctx.fillRect(620, 280 + (champions.lifelevel[usrindex] - clienthp), 15, (clienthp / champions.lifelevel[usrindex]) * 200);
    // clienthp = 10 + (2 * champions.lifelevel[usrindex]);
    // ctx.globalAlpha = (1 - (clienthp / 200));
    // for (i = 0; i < clienthp; i++) {
    //     ctx.fillStyle = "#fff";
    //     ctx.fillRect(620, 480 - ((200 / clienthp) * i), 15, 1);
    // }
    // ctx.globalAlpha = 1;

    if (speedtick == 0) {
        moved = 0;
    }
    //player movements and other keycontrols
    //movement cooldown
    var collisioncheck = 0;
    if (speedtick == 0) {
        if (moveup) {
            var mapinforelative = [mapmasterdata[champions.positiony[usrindex] - 1][champions.positionx[usrindex]], mapmasterdata[champions.positiony[usrindex] - 1][champions.positionx[usrindex] + 1]];
            for (i = 0; i < mapinforelative.length; i++) {
                if (mapinforelative[i] == 1) {
                    moved = 1;
                    collisioncheck += 1;
                } else {
                    collisioncheck -= 1;
                }
            }
            if (collisioncheck > 0) {
                champions.positiony[usrindex] -= 1;
                collisioncheck = 0;
            }
        } else if (movedown) {
            var mapinforelative = [mapmasterdata[champions.positiony[usrindex] + 1][champions.positionx[usrindex]], mapmasterdata[champions.positiony[usrindex] + 1][champions.positionx[usrindex] + 1]];
            for (i = 0; i < 2; i++) {
                if (mapinforelative[i] == 1) {
                    moved = 1;
                    collisioncheck += 1;
                } else {
                    collisioncheck -= 1;
                }
            }
            if (collisioncheck > 0) {
                champions.positiony[usrindex] += 1;
                collisioncheck = 0;
            }
        }

        if (moveright) {
            var mapinforelative = mapmasterdata[champions.positiony[usrindex]][champions.positionx[usrindex] + 2];
            clientdirectionframe = 0;
            //check if mapdata above is a wall or not
            if (mapinforelative == 1) {
                champions.positionx[usrindex] += 1;
                moved = 1;
            };
        } else if (moveleft) {
            var mapinforelative = mapmasterdata[champions.positiony[usrindex]][champions.positionx[usrindex] - 1];
            clientdirectionframe = 1;
            if (mapinforelative == 1) {
                champions.positionx[usrindex] -= 1;
                moved = 1;
            };
        }


        speedtick = champions.speed[usrindex];
    } else {
        speedtick -= 1;
    }

    if (moved == 1) {
        if (clientanimationframe < 4) {
            if (speedtick == 0) {
                clientanimationframe += 1;
            }
        } else {
            clientanimationframe = 0;
        }
    } else {
        clientanimationframe = 0;
    }

    // update gravity
    // for (i = 0; i < consdata.type.length; i++) {
    //     if (consdata.height[i] > 0) {
    //         consdata.height[i] -= 0.2;
    //     }
    // }

    //set animation frame on master data
    champions.animframe[usrindex] = clientanimationframe;
    champions.direction[usrindex] = clientdirectionframe;

    // cast any consumes triggered, lowercooldown
    for (i = 0; i < inventorytriggered.length; i++) {
        if (inventorytriggered[i] == 1) {
            if (inventoryslot[i] == "speed") {
                champions.speeding[usrindex] += 500;

                db.push({ type: "newtext", texttype: 2, x: champions.positionx[usrindex], y: champions.positiony[usrindex], text: "SPEED UP" });
                drinksound.cloneNode(true).play();
            } else if (inventoryslot[i] == "wind") {
                var healamount = getRandomInt(5, 40);
                db.push({ type: "newtext", texttype: 2, x: champions.positionx[usrindex], y: champions.positiony[usrindex], text: "HEALTH UP" });
                windsound.cloneNode(true).play();
                if (clienthp + healamount > champions.lifelevel[usrindex]) {
                    clienthp = champions.lifelevel[usrindex]
                } else {
                    clienthp += healamount;
                }
            }
            var keptvar = getRandomInt(1, 10);
            if (keptvar <= 3) {
                // burnt
                inventoryslot[i] = "none";
            }
            inventorytriggered[i] = 0;
        }
    }

    //take effect of all consumes
    if (champions.speeding[usrindex] > 0) {
        champions.speed[usrindex] = 1;
        champions.speeding[usrindex] -= 1;
    } else if (champions.fatigue[usrindex] > 0) {
        champions.speed[usrindex] = 6;
        champions.fatigue[usrindex] -= 1;
    } else {
        champions.speed[usrindex] = 3;
    }

    for (i = 0; i < inventoryslotcooldown.length; i++) {
        if (inventoryslotcooldown[i] > 0) {
            inventoryslotcooldown[i] -= 1;
        }
    }

    // mouse is down; create embers
    var mousecordbool = mousecord[0] < 342 && mousecord[0] > 48 && mousecord[1] > 427 && mousecord[1] < 467;
    if (mousedowned && mousecordbool) {
        // consumes have been clicked
        var clickedslot = Math.floor((mousecord[0] - 50) / 50);
        if (inventorytriggered[clickedslot] == 0 && inventoryslotcooldown[clickedslot] == 0) {
            inventorytriggered[clickedslot] = 1;
            inventoryslotcooldown[clickedslot] += consumes.cooldown[consumes.name.indexOf(inventoryslot[clickedslot])];
        }
        mousedowned = false;
    } else if (mousedowned) {
        if (clientember > 0) {
            //single ember
            if (shoots == "single" && clientember >= 1) {
                emberformcooldown += 20;
                shoots = "tri";
                embersound.cloneNode(true).play();
                projectiledata.type.push("ember");
                var xclick = Math.floor(mousecord[0] / 10) + camera[0];
                var yclick = Math.floor(mousecord[1] / 10) + camera[1];
                var xdistance = Math.abs(Math.floor(mousecord[0] / 10) + camera[0] - champions.positionx[usrindex]);
                var ydistance = Math.abs(Math.floor(mousecord[1] / 10) + camera[1] - (champions.positiony[usrindex]));
                var xcord = Math.floor(mousecord[0] / 10) + camera[0] - champions.positionx[usrindex];
                var ycord = Math.floor(mousecord[1] / 10) + camera[1] - (champions.positiony[usrindex]);

                projectiledata.positionx.push(champions.positionx[usrindex]);
                projectiledata.positiony.push(champions.positiony[usrindex]);
                projectiledata.velstore.push(0);
                projectiledata.updated.push(0);
                projectiledata.framereset.push(2);
                projectiledata.owner.push(usrindex);
                projectiledata.delete.push(0);

                if (xdistance != 0 && ydistance != 0) {
                    //prevent 0,0 distance render
                    //in here everything is diagnal
                    if (xdistance > ydistance) {
                        // make x 1, y is less than 1
                        if (ycord > 0) {
                            // down
                            projectiledata.vely.push((ydistance / xdistance));
                        } else {
                            // up
                            projectiledata.vely.push(-1 * (ydistance / xdistance));
                        }

                        if (xcord > 0) {
                            // right
                            projectiledata.velx.push(1);
                        } else {
                            //left
                            projectiledata.velx.push(-1);
                        }
                    } else {
                        // make y 1, x is less than 1
                        if (xcord > 0) {
                            // right
                            projectiledata.velx.push((xdistance / ydistance));
                        } else {
                            // left
                            projectiledata.velx.push(-1 * (xdistance / ydistance));
                        }

                        if (ycord > 0) {
                            // down
                            projectiledata.vely.push(1);
                        } else {
                            // up
                            projectiledata.vely.push(-1);
                        }
                    }
                } else {
                    if (xdistance != 0) {
                        // right or left
                        projectiledata.vely.push(0);
                        if (xcord > 0) {
                            // right
                            projectiledata.velx.push(1);
                        } else {
                            // left
                            projectiledata.velx.push(-1);
                        }
                    } else if (ydistance != 0) {
                        // up or down
                        projectiledata.velx.push(0);
                        if (ycord > 0) {
                            // down
                            projectiledata.vely.push(1);
                        } else {
                            // up
                            projectiledata.vely.push(-1);
                        }
                    }
                }

                for (p = 0; p < 1; p++) {
                    var cuestore = projectiledata.delete.length - 1 - p;
                    servernewember(projectiledata.positionx[cuestore], projectiledata.positiony[cuestore], projectiledata.velx[cuestore], projectiledata.vely[cuestore]);
                }

                clientember -= 1;
            } else if (shoots == "tri" && clientember >= 3) {
                emberformcooldown += 20;
                shoots = "orbis";
                embersound.cloneNode(true).play();
                var xclick = Math.floor(mousecord[0] / 10) + camera[0];
                var yclick = Math.floor(mousecord[1] / 10) + camera[1];
                var xdistance = Math.abs(Math.floor(mousecord[0] / 10) + camera[0] - champions.positionx[usrindex]);
                var ydistance = Math.abs(Math.floor(mousecord[1] / 10) + camera[1] - (champions.positiony[usrindex]));
                var xcord = Math.floor(mousecord[0] / 10) + camera[0] - champions.positionx[usrindex];
                var ycord = Math.floor(mousecord[1] / 10) + camera[1] - (champions.positiony[usrindex]);

                for (i = 0; i < 3; i++) {
                    projectiledata.type.push("ember");
                    projectiledata.positionx.push(champions.positionx[usrindex]);
                    projectiledata.positiony.push(champions.positiony[usrindex]);
                    projectiledata.velstore.push(0);
                    projectiledata.updated.push(0);
                    projectiledata.framereset.push(2);
                    projectiledata.owner.push(usrindex);
                    projectiledata.delete.push(0);
                }


                if (xdistance != 0 && ydistance != 0) {
                    //prevent 0,0 distance render
                    //in here everything is diagnal
                    if (xdistance > ydistance) {
                        // make x 1, y is less than 1
                        if (ycord > 0) {
                            // down
                            projectiledata.vely.push((ydistance / xdistance));
                            projectiledata.vely.push((ydistance / xdistance) + 1);
                            projectiledata.vely.push((ydistance / xdistance) - 1);
                        } else {
                            // up
                            projectiledata.vely.push(-1 * (ydistance / xdistance));
                            projectiledata.vely.push(-1 * (ydistance / xdistance) + 1);
                            projectiledata.vely.push(-1 * (ydistance / xdistance) - 1);
                        }

                        if (xcord > 0) {
                            // right
                            projectiledata.velx.push(1);
                            projectiledata.velx.push(1);
                            projectiledata.velx.push(1);
                        } else {
                            //left
                            projectiledata.velx.push(-1);
                            projectiledata.velx.push(-1);
                            projectiledata.velx.push(-1);
                        }
                    } else {
                        // make y 1, x is less than 1
                        if (xcord > 0) {
                            // right
                            projectiledata.velx.push((xdistance / ydistance));
                            projectiledata.velx.push((xdistance / ydistance) + 1);
                            projectiledata.velx.push((xdistance / ydistance) - 1);
                        } else {
                            // left
                            projectiledata.velx.push(-1 * (xdistance / ydistance));
                            projectiledata.velx.push(-1 * (xdistance / ydistance) + 1);
                            projectiledata.velx.push(-1 * (xdistance / ydistance) - 1);
                        }

                        if (ycord > 0) {
                            // down
                            projectiledata.vely.push(1);
                            projectiledata.vely.push(1);
                            projectiledata.vely.push(1);
                        } else {
                            // up
                            projectiledata.vely.push(-1);
                            projectiledata.vely.push(-1);
                            projectiledata.vely.push(-1);
                        }
                    }
                } else {
                    if (xdistance != 0) {
                        // right or left
                        projectiledata.vely.push(0);
                        projectiledata.vely.push(1);
                        projectiledata.vely.push(-1);
                        if (xcord > 0) {
                            // right
                            projectiledata.velx.push(1);
                            projectiledata.velx.push(1);
                            projectiledata.velx.push(1);
                        } else {
                            // left
                            projectiledata.velx.push(-1);
                            projectiledata.velx.push(-1);
                            projectiledata.velx.push(-1);
                        }
                    } else if (ydistance != 0) {
                        // up or down
                        projectiledata.velx.push(0);
                        projectiledata.velx.push(1);
                        projectiledata.velx.push(-1);
                        if (ycord > 0) {
                            // down
                            projectiledata.vely.push(1);
                            projectiledata.vely.push(1);
                            projectiledata.vely.push(1);
                        } else {
                            // up
                            projectiledata.vely.push(-1);
                            projectiledata.vely.push(-1);
                            projectiledata.vely.push(-1);
                        }
                    }
                }

                for (p = 0; p < 3; p++) {
                    var cuestore = projectiledata.delete.length - 1 - p;
                    servernewember(projectiledata.positionx[cuestore], projectiledata.positiony[cuestore], projectiledata.velx[cuestore], projectiledata.vely[cuestore]);
                }

                clientember -= 3;
            } else if (shoots == "orbis" && clientember >= 8) {
                embersound.cloneNode(true).play();
                var xclick = Math.floor(mousecord[0] / 10) + camera[0];
                var yclick = Math.floor(mousecord[1] / 10) + camera[1];
                var xdistance = Math.abs(Math.floor(mousecord[0] / 10) + camera[0] - champions.positionx[usrindex]);
                var ydistance = Math.abs(Math.floor(mousecord[1] / 10) + camera[1] - (champions.positiony[usrindex]));
                var xcord = Math.floor(mousecord[0] / 10) + camera[0] - champions.positionx[usrindex];
                var ycord = Math.floor(mousecord[1] / 10) + camera[1] - (champions.positiony[usrindex]);

                for (i = 0; i < 8; i++) {
                    projectiledata.type.push("ember");
                    projectiledata.positionx.push(champions.positionx[usrindex]);
                    projectiledata.positiony.push(champions.positiony[usrindex]);
                    projectiledata.velstore.push(0);
                    projectiledata.updated.push(0);
                    projectiledata.framereset.push(2);
                    projectiledata.owner.push(usrindex);
                    projectiledata.delete.push(0);
                }

                projectiledata.velx.push(0);
                projectiledata.vely.push(1);

                projectiledata.velx.push(0);
                projectiledata.vely.push(-1);

                projectiledata.velx.push(1);
                projectiledata.vely.push(1);

                projectiledata.velx.push(1);
                projectiledata.vely.push(0);

                projectiledata.velx.push(1);
                projectiledata.vely.push(-1);

                projectiledata.velx.push(-1);
                projectiledata.vely.push(1);

                projectiledata.velx.push(-1);
                projectiledata.vely.push(0);

                projectiledata.velx.push(-1);
                projectiledata.vely.push(-1);

                clientember -= 8;

                for (p = 0; p < 8; p++) {
                    var cuestore = projectiledata.delete.length - 1 - p;
                    servernewember(projectiledata.positionx[cuestore], projectiledata.positiony[cuestore], projectiledata.velx[cuestore], projectiledata.vely[cuestore]);
                }
            } else {
                if (clientember > 0) {
                    // nopesound.cloneNode(true).play();
                }
            }
        }
        mousedowned = false;
    }

    //if mouse position is over any items, prompt message to pick up when E is pressed


    // update camera position according to character position

    if (20 > (champions.positiony[usrindex] - camera[1])) {
        if (camera[1] > 0) {
            camera[1] -= 1;
        }
    } else if (38 < (champions.positiony[usrindex] - camera[1])) {
        camera[1] += 1;
    }
    if (55 < (champions.positionx[usrindex] - camera[0])) {

        camera[0] += 1;
    } else if (10 > (champions.positionx[usrindex] - camera[0])) {
        if (camera[0] > 0) {
            camera[0] -= 1;
        }
    }

    // enemy health bar
    if (focusenemyindex != -1) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#888";
        ctx.fillRect(255, 15, 130, 30);

        //hp bar
        ctx.fillStyle = "#ff1b32";
        ctx.fillRect(255, 15, 130 * (objectdata.health[focusenemyindex] / objectdata.maxhealth[focusenemyindex]), 30);

        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff";
        ctx.font = "15px sans-serif";
        ctx.fillText(objectdata.name[focusenemyindex], 270, 35);
    }

    if (clienthp < champions.lifelevel[usrindex]) {
        clienthp += 0.01;
    }

    if (emberformcooldown == 0) {
        if (shoots == "orbis") {
            shoots = "tri";
            emberformcooldown = 40;
        } else if (shoots == "tri") {
            shoots = "single";
        }
    }

    if (emberformcooldown > 0) {
        emberformcooldown -= 1;
    }

    //render texts
    var deathoftexts = [];
    for (i = 0; i < textdata.text.length; i++) {
        if (textdata.type[i] == 1) {
            ctx.fillStyle = "#e29092";
        } else if (textdata.type[i] == 2) {
            ctx.fillStyle = "#d7d7a0";
        } else {
            ctx.fillStyle = "#fff";
        }
        ctx.font = "15px defaultrs";
        ctx.globalAlpha = 1 - textdata.life[i];
        ctx.fillText(textdata.text[i], (textdata.positionx[i] - camera[0]) * 10, (textdata.positiony[i] - textdata.life[i] - camera[1] - 10) * 10);
        ctx.globalAlpha = 1;
        if (textdata.life[i] < 1) {
            textdata.life[i] += 0.02;
        } else {
            textdata.life[i] = 1;
            deathoftexts.push(i);
        }
    }

    for (i = 0; i < deathoftexts; i++) {
        textdata.life.splice(i, 1);
        textdata.positionx.splice(i, 1);
        textdata.positiony.splice(i, 1);
        textdata.text.splice(i, 1);
        textdata.type.splice(i, 1);
    }

    //update all status
    updatestatus(usrindex);

    setTimeout(function () {
        if (alive) {
            render();
        } else {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(0, 0, 640, 480);
        }
    }, 15)
}

//key controls
var moveup = false;
var movedown = false;
var moveright = false;
var moveleft = false;
var onKeyUp = function (event) {
    switch (event.keyCode) {
        case 87: // w
            moveup = false;
            break;
        case 83: //s
            movedown = false;
            break;
        case 65: //a
            moveleft = false;
            break;
        case 68: //d
            moveright = false;
            break;
        // case 49: // 1 is single
        //     shoots = "single";
        //     break;
        // case 50: // 2 is tri
        //     shoots = "tri";
        //     break;
        // case 51: // 3 is orbis
        //     shoots = "orbis";
        //     break;
    }
};
var onKeyDown = function (event) {
    switch (event.keyCode) {
        case 87: // w
            moveup = true;
            break;
        case 83: //s
            movedown = true;
            break;
        case 65: //a
            moveleft = true;
            break;
        case 68: //d
            moveright = true;
            break;
    }
};
document.addEventListener('keyup', onKeyUp, false);
document.addEventListener('keydown', onKeyDown, false);

var mousecord = [0, 0]
gamewindow.onmousemove = function (e) {
    mousecord[0] = e.offsetX;
    mousecord[1] = e.offsetY;
}

var mousedowned = false;
gamewindow.onmousedown = function () {
    mousedowned = true;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
var db = new Firebase("https://aberoyale-94ca3-default-rtdb.firebaseio.com/");
var startListening = function () {
    db.on('child_added', function (snapshot) {
        var snap = snapshot.val();
        //ToDo: work on the stuff xd
        if (snap.type == "regist") {
            champions.animframe.push(0);
            champions.conf.push(0);
            champions.direction.push(0);
            champions.drain.push(0);
            champions.fatigue.push(0);
            champions.lifelevel.push(200);
            champions.emberlevel.push(6);
            champions.name.push(snap.name);
            champions.positionx.push(30);
            champions.positiony.push(30);
            champions.spacelevel.push(2);
            champions.speed.push(3);
            champions.speeding.push(0);
            champions.dead.push(0);
        } else if (snap.type == "statusupdate") {
            champions.animframe[snap.index] = snap.animframe;
            champions.conf[snap.index] = snap.conf;
            champions.direction[snap.index] = snap.direction;
            champions.drain[snap.index] = snap.drain;
            champions.fatigue[snap.index] = snap.fatigue;
            champions.lifelevel[snap.index] = snap.lifelevel;
            champions.emberlevel[snap.index] = snap.emberlevel;
            champions.name[snap.index] = snap.name;
            champions.positionx[snap.index] = snap.positionx;
            champions.positiony[snap.index] = snap.positiony;
            champions.spacelevel[snap.index] = snap.spacelevel;
            champions.speed[snap.index] = snap.speed;
            champions.speeding[snap.index] = snap.speeding;
            if (ingame) {
                champions.dead[snap.index] = snap.dead;
            }
        } else if (snap.type == "killed") {
            champions.dead[snap.who] = 0;
        }

        if (ingame) {
            if (snap.type == "newember") {
                if (snap.owner != usrindex) {
                    projectiledata.type.push("ember");
                    projectiledata.positionx.push(parseFloat(snap.x));
                    projectiledata.positiony.push(parseFloat(snap.y));
                    projectiledata.velstore.push(0);
                    projectiledata.updated.push(0);
                    projectiledata.framereset.push(2);
                    projectiledata.owner.push(parseFloat(snap.owner));
                    projectiledata.delete.push(0);
                    projectiledata.velx.push(parseFloat(snap.velx));
                    projectiledata.vely.push(parseFloat(snap.vely));
                }
            } else if (snap.type == "damageplayer") {
                if (snap.who == usrindex) {
                    clienthp -= snap.damage;
                    if (clienthp < 0) {
                        clienthp = 0;
                        //ded
                        alive = false;
                        db.push({ type: "killed", who: usrindex, killer: snap.by });
                        db.push({ type: "newtext", texttype: 1, x: champions.positionx[usrindex], y: champions.positiony[usrindex], text: "ARRRRRGGGHHHH" });
                    } else {
                        db.push({ type: "newtext", texttype: 1, x: champions.positionx[usrindex], y: champions.positiony[usrindex], text: "-" + snap.damage });
                    }
                }
            } else if (snap.type == "newtext") {
                textdata.positionx.push(parseInt(snap.x));
                textdata.positiony.push(parseInt(snap.y));
                textdata.life.push(0);
                textdata.type.push(parseInt(snap.texttype));
                textdata.text.push(snap.text);
            }
        }
    });
}
startListening();

function registernewchampion(playername) {
    db.push({ type: "regist", name: playername });
}

function updatestatus(indexofplayer) {
    var statusvar = {
        type: "statusupdate",
        animframe: champions.animframe[usrindex],
        conf: champions.conf[usrindex],
        direction: champions.direction[usrindex],
        drain: champions.drain[usrindex],
        fatigue: champions.fatigue[usrindex],
        lifelevel: champions.lifelevel[usrindex],
        emberlevel: champions.emberlevel[usrindex],
        name: champions.name[usrindex],
        positionx: champions.positionx[usrindex],
        positiony: champions.positiony[usrindex],
        spacelevel: champions.spacelevel[usrindex],
        speed: champions.speed[usrindex],
        speeding: champions.speeding[usrindex],
        index: usrindex,
        dead: champions.dead[usrindex]
    }
    db.push(statusvar);
}

function servernewember(x, y, velx, vely) {
    //push data to server about new ember
    db.push({ type: "newember", x: x, y: y, velx: velx, vely: vely, owner: usrindex });
}

function emberhitchampion(championindex) {
    var damage = getRandomInt(20, 50);
    db.push({ type: "damageplayer", who: championindex, by: usrindex, damage: damage });
}
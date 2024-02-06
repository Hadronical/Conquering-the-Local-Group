/*
* TEAMS:
* 0 => neutral
* 1: team 1
* ...
* n: team n
*/

let TeamColors;
let TERRITORIES

class Territory
{
    static __ID_TERRITORY__ = 0;
    static newID ()
    {
        return Territory.__ID_TERRITORY__++;
    }

    static MAXHPatLVL = [ 20, 25, 35, 50, 70 ];
    static CAPACITYatLVL = [ 10, 50, 100, 200, 500 ];

    constructor (celestialBodyID, tm)
    {
        this.id = Territory.newID();

        this.CBodyID = celestialBodyID;
        this.team = (tm == undefined) ? (0) : (tm);

        this.level = 0;
        this.setLevel(0);
        this.health = 20;
        this.strength = 0;

        this.updateTimer = 0;
        this.updateInterval = random(1.0, 5.0);

        this.vertices = [];

        this.buildings = [];
    }

    update ()
    {
        if (this.team == 0) { return; }

        this.updateTimer += dT;

        if (this.updateTimer > this.updateInterval)
        {
            for (let b of this.buildings) {
                b.update();
            }

            this.updateTimer = 0;
        }
    }

    display ()
    {
        PUSH();

        CANVAS.fill(lerpColor(TeamColors[0], TeamColors[this.team], this.health / this.maxHealth));
        CANVAS.noStroke();
        CANVAS.beginShape();
        BUFFER_SELECT.fill(ID2RGB());
        BUFFER_SELECT.noStroke();
        BUFFER_SELECT.beginShape();
        BUFFER_SELECT.vertex(0,0);
        for (let i = 0, l = this.vertices.length, vert; i < l; i++)
        {
            vert = this.vertices[i];
            CANVAS.vertex(vert.x, vert.y);
            BUFFER_SELECT.vertex(vert.x, vert.y);
        }
        BUFFER_SELECT.vertex(0,0);
        CANVAS.endShape(CLOSE);
        BUFFER_SELECT.endShape(CLOSE);

        POP();
    }

    //! getVisualCenter ()


    getHealth ()
    {
        return this.health;
    }
    getPosition ()
    {
        return GRAVITYBODIES[this.CBodyID].getPosition();
    }
    getCelestialBody ()
    {
        return GRAVITYBODIES.get(this.CBodyID);
    }

    setHealth (HP)
    {
        this.health = constrain(HP, 0,this.maxHealth);
        if (this.health == 0)
        {
            console.log("team " + this.team + " has lost a territory");
            this.team = 0;
            this.setLevel(1);
            this.setHealth(this.maxHealth);
        }
    }
    heal (hp)
    {
        this.setHealth(this.health + hp);
    }
    damage (dmg)
    {
        this.setHealth(this.health - dmg);
    }

    setLevel (lvl)
    {
        this.level = constrain(lvl, 0, this.maxLevel);
        this.maxHealth = Territory.MAXHPatLVL[lvl];
        this.capacity = Territory.CAPACITYatLVL[lvl];
    }
    addLevelBuffer ()
    {
        this.levelBuffer++;
        if (this.levelBuffer == this.maxHealth)
        {
            this.setLevel(this.level + 1);
            this.levelBuffer = 0;
        }
    }

    build (buildingType)
    {
        if (this.buildings.length == 5) { return; }

        this.buildings.push(new Building(this.team, buildingType));
    }
    demolish (buildingType)
    {
        for (let i = 0; i < this.buildings.length; i++)
        {
            if (this.buildings[i].type == buildingType)
            {
                this.buildings.splice(i, 1);
            }
        }
    }

    changeTeam (tm)
    {
        let CBody = this.getCelestialBody();
        CBody.teamsContesting.delete(this.team);
        
        this.team = tm;

        CBody.teamsContesting.add(this.team);
    }

    setShipToProduce (type)
    {
        this.type = type;
    }
    canProduceShip ()
    {
        return this.resources >= ShipPrices.get(this.shipType);
    }
    produceShips (pos)
    {
        let ship;

        for (let i = 0; i < Territory.ShipsPerBatch[this.level]; i++)
        {
            if (!this.canProduceShip()) { break; }

            switch (this.shipType)
            {
                case ShipTypes.CRG:
                    ship = createCargoShip(this.team);
                    break;
                case ShipTypes.FTR:
                    ship = createFigherShip(this.team);
                    break;
                case ShipTypes.BBR:
                    ship = createBomberShip(this.team);
                    break;
            }

            ship.pos = pos;
            ship.state = ShipStates.DEF;
            ship.setTarget(this.CB);
            let velsqr = rotateVector90CC(p5.Vector.mult(
                displacementFromTo(ship, this.CB),
                gravitationalAccOnBy(ship, this.CB).mag()
            ));
            ship.vel = p5.Vector.add(this.CB.vel, sqrtMag(velsqr));
            ship.update();
        }
    }

    worldSpaceRotation (angle)
    {
        if (angle == undefined) angle = 0;
        return this.getCelestialBody().rotation + angle;
    }
    getProductionPos ()
    {
        let CBody = this.getCelestialBody();
        return p5.Vector.add(CBody.pos, p5.Vector.fromAngle(this.worldSpaceRotation()).setMag(CBody.size));
    }
    local2WorldSpace (pos)
    {
        return p5.Vector.add(this.getCelestialBody().pos, rotateVectorCW(pos, this.worldSpaceRotation()));
    }
}



// TODO finish all functionality for buildings
const BUILDING_TYPES = {
    SPC: "Space Center",
    POW: "Power Station",
    RAD: "Radar Array",
    HNG: "Hangar",
    BRK: "Barracks",
    MIN: "Mine",
    STR: "Storage",
    CTY: "City"
};

class Building
{
    constructor (tm, tp)
    {
        this.lvl = 1;
        this.team = tm;
        this.type = tp;
    }

    update ()
    {
        // passive function
        switch (this.type)
        {
            case BUILDING_TYPES.SPC: {
                // does nothing
                break;
            }
            case BUILDING_TYPES.POW: {

                break;
            }
            case BUILDING_TYPES.RAD: {
                break;
            }
            case BUILDING_TYPES.HNG: {
                break;
            }
            case BUILDING_TYPES.BRK: {
                break;
            }
        }
    }
}
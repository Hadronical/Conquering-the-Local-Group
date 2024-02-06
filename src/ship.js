/*
* ALL SHIP TYPES:
* - Cargo
* - Fighter
* - Bomber
*/

const ShipTypes = {
    CRG: "cargo",
    FTR: "fighter",
    BBR: "bomber"
}
const ShipStates = {
    IDL: "idle",
    DEF: "defend",
    ATK: "attack"
}

let ShipPrices = new Map();
ShipPrices.set(ShipTypes.CRG, 0.1);
ShipPrices.set(ShipTypes.FTR, 0.25);
ShipPrices.set(ShipTypes.BBR, 0.8);

let SHIPS = new Map();
let SHIPS2DESTORY = [];

/*
Ships are created by territories
Ships are selected by dragging, and target set by clicking
*/
class Ship extends GravityBody
{
    constructor (team, type)
    {
        super(0,0, 1, 5);

        this.engineForce = createVector(0, 0);
        this.isBraking = false;

        this.isShip = true;
        this.type = type;

        this.team = team;
        this.target = null;

        SHIPS.set(this.id, this);
        INTERACTABLES.push(this.id);

        this.tobeDestroyed = false;
    }

    update ()
    {
        super.update();

        for (let id of Star.STARS)
        {
            let star = GRAVITYBODIES.get(id);
            if (distanceBetween(this, star) < star.size)
            {
                this.tobeDestroyed = true;
            }
        }

        if (this.tobeDestroyed)
        {
            this.destroyOnEOF();
        }
    }

    display ()
    {
        CANVAS.push();
        CANVAS.translate(this.pos.x, this.pos.y);

        // engine
        BUFFER_BLOOM.push();
        BUFFER_BLOOM.stroke(200);
        BUFFER_BLOOM.strokeWeight(2);
        let engineDisplay = this.engineForce.copy().mult(-1).limit(random(7, 10));
        BUFFER_BLOOM.line(0,0, engineDisplay.x,engineDisplay.y);
        BUFFER_BLOOM.pop();

        CANVAS.fill(TeamColors[this.team]);
        CANVAS.noStroke();

        displayShip(this);

        if (this.isSelected)
        {
            CANVAS.noFill();
            CANVAS.stroke(240,240,80, 200);
            CANVAS.circle(0,0, this.size * 1.1);

            CANVAS.pop();

            if (this.path != null)
            {
                this.path.draw();
            }
        }
        else
        {
            CANVAS.pop();
        }
    }

    setState (state)
    {
        this.state = state;
        this.isBraking = false;
    }

    hasTarget ()
    {
        return this.target != null;
    }
    setTarget (target)
    {
        this.target = target;
        console.log("target set to", target.id);
    }
    chaseTarget ()
    {
        if (this.isBraking)
        {
            this.engineForce = p5.Vector.mult(this.vel, -1);
        }
        else
        {
            this.engineForce = p5.Vector.sub(displacementFromTo(this, this.target), p5.Vector.sub(this.acc, this.engineForce)).limit(15);
        }

        this.acc.add(this.engineForce);    
    }

    reachedDestination ()
    {
        return (this.target instanceof PositionTarget) && (distanceBetween(this, this.target) <= this.size * 2);
    }

    //TODO find better way for ships to orbit
    attemptOrbit (territory, altitude)
    {
        return;

        let orbitPos = p5.Vector.add(territory.CB.pos, displacementFromTo(territory.CB, this).setMag(territory.CB.size + altitude));
        this.pos = p5.Vector.lerp(this.pos, orbitPos, 5 * dT);

        this.acc = gravitationalAccOnBy(this, territory.CB);
        let dist = distanceBetween(this, territory.CB);
        this.vel = p5.Vector.add(territory.CB.vel, rotateVector90CW(p5.Vector.mult(this.acc, dist)).mult(6));
        this.updatePosition();
    }

    destroyOnEOF ()
    {
        console.log("destroying " + this.id);
        SHIPS2DESTORY.push(this.id);
    }
}



class CargoShip extends Ship
{
    constructor (team)
    {
        super(team, ShipTypes.CRG);

        this.isLoaded = false;
    }

    loadFrom (territory)
    {
        if (this.isLoaded) { return; }

        territory.resources--;
        this.isLoaded = true;
    }
    unloadTo (territory)
    {
        if (!this.isLoaded) { return; }

        territory.resources++;
        this.isLoaded = false;
    }
}


/*
Fighters can target territories and ships and damage them on collision
idle (IDL), defend (DEF) and attack (ATK) states:
- IDL: landed on territory
- DEF: stay in orbit or in place, attempt to collide with approaching enemy ships
- ATK: seek target and collide
*/

class Fighter extends Ship
{
    constructor (team)
    {
        super(team, ShipTypes.FTR);

        this.state = ShipStates.DEF;

        this.maxRange = 150;
    }

    update ()
    {
        if (this.hasTarget())
        {
            switch (this.state)
            {
                case ShipStates.IDL:
                    this.chaseTarget();

                    if (this.reachedDestination())
                    {
                        this.isBraking = true;
                    }
                    break;
                case ShipStates.DEF:
                    this.attemptOrbit(this.target, 30);

                    let enemy = this.checkClosestEnemy();
                    if (enemy != null)
                    {
                        if (enemy.state == ShipStates.ATK)
                        {
                            console.log("attacking enemy ships")
                            this.setTarget(enemy);
                            this.setState(ShipStates.ATK)    
                        }
                    }
                    break;
                case ShipStates.ATK:
                    this.chaseTarget();
                    
                    if (distanceBetween(this, this.target) <= this.size + this.target.size)
                    {
                        this.collidedWithTarget();
                    }
                    break;
            }
        }

        super.update();
    }

    setTarget (target)
    {
        super.setTarget(target);

        if (target instanceof PositionTarget)
        {
            this.setState(ShipStates.IDL);
        }
        else if (target instanceof Territory)
        {
            if (target.team == this.team)
            {
                this.setState(ShipStates.DEF);
            }
            else
            {
                this.setState(ShipStates.ATK);
            }
        }
    }

    checkClosestEnemy ()
    {
        let closest = null;
        let minDist = this.maxRange;
        SHIPS.forEach((ship, _) => {
            if (ship.team == this.team) { return; }

            let dist = distanceBetween(this, ship);
            if (dist < minDist)
            {
                closest = ship;
                minDist = dist;
            }
        });

        return closest;
    }

    collidedWithTarget ()
    {
        if (this.target instanceof Territory)
        {
            this.target.damage(1);
        }
        else if (this.target instanceof Ship)
        {
            this.target.tobeDestroyed = true;
        }
        else if (this.target instanceof PositionTarget)
        {
            return;
        }

        this.tobeDestroyed = true;
    }
}


/*
Bombers can only target territories
Bomber orbits the territory
drops bombs to reduce the health of the bulidings
*/
class Bomber extends Ship
{
    static BombingAltitude = 40;

    constructor (team)
    {
        super(team, ShipTypes.BBR);
    }

    update ()
    {
        if (this.target.team == this.team)
        {
            this.attemptOrbit(this.target, 30);
            return;
        }

        this.chaseTarget();
        
        if (distanceBetween(this, this.target) <= Bomber.BombingAltitude)
        {
            this.attemptOrbit(this.target, Bomber.BombingAltitude);
        }
    }
}



function displayShip (ship)
{
    switch (ship.type)
    {
        case ShipTypes.CRG: {
            CANVAS.rotate2vector(ship.vel);
            CANVAS.rect(0,0, ship.size);
            break;
        }
        case ShipTypes.FTR: {
            CANVAS.circle(0,0, ship.size);
            break;
        }
        case ShipTypes.BBR: {
            CANVAS.rotate2vector(ship.vel);
            CANVAS.rect(-ship.size/2,-ship.size/2 - 1, ship.size,ship.size + 3);
            break;
        }
    }
}


function createCargoShip (team)
{
    let cargo = new CargoShip(team);
    return cargo;
}
function createFigherShip (team)
{
    let fighter = new Fighter(team);
    return fighter;
}
function createBomberShip (team)
{
    let bomber = new Bomber(team);
    return bomber;
}
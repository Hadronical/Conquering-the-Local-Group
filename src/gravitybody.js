let GRAVITYBODIES = new Map();
let attractorIDs = [];


class GravityBody
{
    static __ID_GBODY__ = 0;
    static newID ()
    {
        return GravityBody.__ID_GBODY__++;
    }

    static getAccelerations ()
    {
        GRAVITYBODIES.forEach((body, id) => {
            body.updateAcceleration();
        });
    }


    constructor (x,y, mass, size)
    {
        this.id = GravityBody.newID();
        GRAVITYBODIES.set(this.id, this);

        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);

        this.mass = mass;
        this.size = size;

        this.isShip = false;
        this.isSelected = false;

        this.parent = null;
        this.path = null;
    }


    getID ()
    {
        return this.id;
    }

    getPosition ()
    {
        return this.pos;
    }

    updatePosition ()
    {
        this.pos.add(p5.Vector.mult(this.vel, dT));
    }
    updateVelocity ()
    {
        this.vel.add(p5.Vector.mult(this.acc, 0.5 * dT));
    }
    updateAcceleration ()
    {
        let accX = 0, accY = 0;

        let parentI = -1;
        let maxF = createVector(0, 0);
        for (let i = 0, l = attractorIDs.length; i < l; i++)
        {
            if (attractorIDs[i] == this.id) { continue; }

            let attractor = GRAVITYBODIES.get(attractorIDs[i]);
            let force = gravitationalAccOnBy(this, attractor);
            accX += force.x;
            accY += force.y;

            if (force.mag() > maxF.mag() && attractor.mass > this.mass)
            {
                maxF.x = force.x;
                maxF.y = force.y;
                parentI = i;
            }
        }
        
        if (parentI != -1)
        {
            this.parent = GRAVITYBODIES.get(attractorIDs[parentI]);
            this.path = getOrbitPredictionForTo(this, this.parent);
        }

        this.acc.x = accX;
        this.acc.y = accY;
    }
    update ()
    {
        //* leapfrog integration
        this.updateVelocity();
        this.updatePosition();

        this.updateAcceleration();
        this.updateVelocity();
    }

    display () {}

    setSelected (b)
    {
        this.isSelected = b;
    }

    getTrackingPos ()
    {
        return this.pos;
    }

    addForce (force)
    {
        let acc = p5.Vector.div(force, this.mass);
        this.acc.x = acc.x;
        this.acc.y = acc.y;
    }

    getRelativePosTo (target)
    {
        return p5.Vector.sub(this.pos, target.pos);
    }
    getRelativeVelTo (target)
    {
        return p5.Vector.sub(this.vel, target.vel);
    }
}


class Star extends GravityBody
{
    static STARS = [];

    constructor (x,y, mass, size)
    {
        mass = max(mass, 2000);
        size = max(size, 70);

        super(x,y, mass, size);

        this.color = lerpColor(color(200,20,20), color(80,80,240), map(this.mass, 5e3,3e5, 0,1));

        attractorIDs.push(this.id);
        Star.STARS.push(this.id);
    }

    display ()
    {
        BUFFER_BLOOM.push();
        BUFFER_BLOOM.translate(this.pos.x, this.pos.y);
        BUFFER_BLOOM.fill(this.color);
        BUFFER_BLOOM.circle(0,0, 2 * this.size);
        BUFFER_BLOOM.pop();
    }
}


class CelestialBody extends GravityBody
{
    constructor (x,y, mass, size)
    {
        super(x,y, mass, size);

        this.rotation = 0;
        this.rotTime = random(50, 70);

        // vertex count
        let n = random(Array(10).fill(0).map((_,i) => floor(2*sqrt(size/2)) + i));

        // territory vertex distribution      
        this.territoryVertexDistribution = [];
        this.territoryVertexCount = 0;
        while (this.territoryVertexCount < n)
        {
            let newTerritoryVertices = min(random([1,2,3,4]), n - this.territoryVertexCount);
            this.territoryVertexDistribution.push(newTerritoryVertices);
            this.territoryVertexCount += newTerritoryVertices;
        }
        this.territories = [];
        for (let i = 0 ; i < this.territoryVertexDistribution.length; i++)
        {
            this.territories[i] = new Territory(this.id, 0);
        }
        this.teamsContesting = new Set([0]);

        console.log(this.territoryVertexDistribution);

        // vertices
        let dA = TWO_PI / n;
        let territoryI = 0;
        let nextVertexCount = this.territoryVertexDistribution[0];
        for (let i = 0, vert; i < n; i++)
        {
            let a = i * dA;
            let dR = this.size * 0.02;
            let r = (this.size / 2) + random(-dR, dR);
            vert = p5.Vector.fromAngle(a).setMag(r);

            this.territories[territoryI].vertices.push(vert);

            if (i + 1 == nextVertexCount)
            {
                territoryI++;
                nextVertexCount += this.territoryVertexDistribution[territoryI];
            }
        }
        console.log(this.territories);

        for (let i = 0, l = this.territories.length; i < l; i++)
        {
            let i_ = (i + 1) % l;
            //console.log(this.territories[i_].vertices);
            this.territories[i].vertices.push(this.territories[i_].vertices[0]);
        }
        //console.log(this.territories[0].vertices);

        attractorIDs.push(this.id);
        INTERACTABLES.push(this.id);
    }

    update ()
    {
        super.update();

        this.rotation += TWO_PI * dT / this.rotTime;

        for (let t of this.territories)
        {
            t.update();
        }
    }

    display ()
    {
        if (this.path != null)
        {
            this.path.draw();
        }

        PUSH();
        TRANSLATE(this.pos.x, this.pos.y);
        ROTATE(this.rotation);

        let angle = 0;
        let angleInterval = 1/this.territoryVertexCount * TWO_PI;

        for (let i = 0; i < this.territories.length; i++)
        {
            let t = this.territories[i];

            switch (CAMERA_LOD)
            {
                case CAMERA_LODs.LOCAL:
                {
                    t.display();
                    break;
                }
                case CAMERA_LODs.MAP:
                {
                    let col = TeamColors[t.team];
                    CANVAS.fill(color(col));
                    CANVAS.stroke(color(col));
                    CANVAS.arc(
                        0,0, this.size,this.size,
                        angle,
                        angle + this.territoryVertexDistribution[i]*angleInterval
                    );
                    angle += this.territoryVertexDistribution[i]*angleInterval;
                    break;
                }
            }
        }

        if (this.isSelected)
        {
            CANVAS.noFill();
            CANVAS.stroke(240,240,80, 200);
            CANVAS.strokeWeight(1.5);
            CANVAS.circle(0,0, this.size * 1.1);
        }

        POP();
    }
}


//! NOT STARTED
class Projectile extends GravityBody
{
    constructor ()
    {

    }
}
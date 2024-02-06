// very useful summay of equations
// https://stackoverflow.com/questions/71863525/calculating-2d-orbital-paths-in-newtonian-gravity-simulation


class OrbitalPath
{
    constructor (a,b,e,o, obj)
    {
        this.semiMajor = a;
        this.semiMinor = b;
        this.eccentricity = e;
        this.orientation = o;

        this.attractor = obj;
    }

    draw ()
    {
        CANVAS.push();
        TRANSLATE(this.attractor.pos.x, this.attractor.pos.y);

        CANVAS.noFill();
        CANVAS.stroke(255, 50);
        CANVAS.strokeWeight(2);
        ROTATE(this.orientation);
        CANVAS.ellipse(
            -this.semiMajor*this.eccentricity, 0,
            2*this.semiMajor,
            2*this.semiMinor
        );

        CANVAS.pop();
    }
}

function getOrbitPredictionForTo (gb1, gb2)
{
    let pos = gb1.getRelativePosTo(gb2);
    let vel = gb1.getRelativeVelTo(gb2);
    let _pos_ = pos.mag();
    let _vel_ = vel.mag();
    
    // std gravitation parameter
    let u = gb1.mass + gb2.mass;

    // semimajor axis
    let a = -(u * _pos_) / (_pos_ * _vel_*_vel_ - (u+u));
    // angular momentum
    let angP = pos.x * vel.y - pos.y * vel.x;
    // orbital energy
    let E = (_vel_*_vel_ / 2) - (u / _pos_);
    // eccentricity
    let e = sqrt(1 + (2 * E * angP*angP) / (u*u));
    // semiminor axis
    let b = a * sqrt(1 - e*e);

    // eccentricity vector
    let eV = p5.Vector.sub(
        p5.Vector.mult(pos, (((_vel_*_vel_) / u) - (1 / _pos_))),
        p5.Vector.mult(vel, (p5.Vector.dot(pos, vel) / u))
    )

    // orientation of periapsis
    let o = atan2(eV.y, eV.x);
        
    return new OrbitalPath(a,b, e, o, gb2);
}
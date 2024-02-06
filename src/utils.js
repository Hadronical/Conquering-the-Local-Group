//* visual utilities
function rotate2vector (vector)
{
    rotate(vector.heading());
}

//* p5 Vector addons
function rotateVector90CC (vec)
{
    return createVector(-vec.y, vec.x);
}
function rotateVector90CW (vec)
{
    return createVector(vec.y, -vec.x);
}
function rotateVectorCW (vec, a)
{
    let c = cos(a), s = sin(a);
    return createVector(
        vec.x * c - vec.y * s,
        vec.x * s + vec.y * c
    );
}
function sqrtMag (vec)
{
    let sqrtMag = sqrt(vec.mag());
    return p5.Vector.setMag(vec, sqrtMag);
}

//* calculation utilities
function displacementFromTo (A, B)
{
    return p5.Vector.sub(B.getPosition(), A.getPosition());
}
function distanceBetween (A, B)
{
    return p5.Vector.dist(A.getPosition(), B.getPosition());
}

function positionWithinCircle (pos, center,radius)
{
    return (p5.Vector.sub(pos, center).mag() <= radius);
}

function valueBetween (v, a,b)
{
    return (v >= a) && (v <= b);
}

function gravitationalAccOnBy (A, B)
{
    let dir = displacementFromTo(A, B);
    let dist = dir.mag();
    return dir.setMag(B.mass / (dist * dist + 0.1));
}


class PositionTarget
{
    constructor (pos)
    {
        this.pos = pos;
        this.size = 0;
    }

    getPosition ()
    {
        return this.pos;
    }
}


function PUSH ()
{
    CANVAS.push();
    BUFFER_BLOOM.push();
    BUFFER_SELECT.push();
}
function POP ()
{
    CANVAS.pop();
    BUFFER_BLOOM.pop();
    BUFFER_SELECT.pop();
}
function TRANSLATE (x, y)
{
    CANVAS.translate(x, y);
    BUFFER_BLOOM.translate(x, y);
    BUFFER_SELECT.translate(x, y);
}
function ROTATE (a)
{
    CANVAS.rotate(a);
    BUFFER_BLOOM.rotate(a);
    BUFFER_SELECT.rotate(a);
}
function SCALE (scl)
{
    CANVAS.scale(scl);
    BUFFER_BLOOM.scale(scl);
    BUFFER_SELECT.scale(scl);
}
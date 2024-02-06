document.oncontextmenu = () => {
	mouseClicked();
	return false;
}


let W, H,
    halfW, halfH;
let CANVAS,
    BACKGROUND,
    BUFFER_BLOOM,
    UI,
    BUFFER_SELECT;

let SHADER_BLOOM;

/*
* CAMERA CONTROL
* - 0: free cam
* - 1: focus/follow target
* - mouseDrag1: follow but offset camera from focus
* - scrollWheel: zoom in and out
*/
const CAMERA_MODES = {
    FREE: 0,
    FOCUS: 1
}
const CAMERA_LODs = {
    LOCAL: 0,
    MAP: 1
}
let CAMERA_MODE = CAMERA_MODES.FREE;
let CAMERA_LERP_t = 10;
let CAMERA_LOD = CAMERA_LODs.MAP;
let scl = 1, sclTarget = 1,
    focusTarget,
	focusPos,
	focusOffset;

let dT = 0.03;



function preload ()
{
    SHADER_BLOOM = loadShader('../assets/shaders/test.vert', '../assets/shaders/test.frag');
}


function setup ()
{
    W = windowWidth;
    H = windowHeight;
    halfW = W / 2;
    halfH = H / 2;

    createCanvas(W, H, WEBGL);

    //noCursor();

    CANVAS = createGraphics(W, H);
    BACKGROUND = createGraphics(W, H);
    BUFFER_BLOOM = createGraphics(W, H);
    UI = createGraphics(W, H);
    BUFFER_SELECT = createGraphics(W, H);


    // create background
    BACKGROUND.push();
    BACKGROUND.background(0);
    BACKGROUND.fill(255);
    BACKGROUND.noStroke();
    for (let i = 0; i < 100; i++)
    {
        let x = random(0, W);
        let y = random(0, H);
        let r = random(1, 3);
        BACKGROUND.circle(x,y, r);
    }
    BACKGROUND.pop();

    BUFFER_BLOOM.noStroke();
    BUFFER_SELECT.pixelDensity(1);

    TeamColors = [
        color(180),
        color(220,100,100),
        color(60,80,200),
        color(100,240,200)
    ]

    new Star(0,0, 1e6, 80);
    let planet1 = new CelestialBody(0,-700, 1500, 40, [20]);
    planet1.vel.x = 38;
    let planet2 = new CelestialBody(200, 400, 1000, 36, 1, [23]);
    planet2.vel.x = -45;
    planet2.vel.y = 15;

    for (let t of planet1.territories)
    {
        t.changeTeam(random([1,2,3]));
    }
    for (let t of planet2.territories)
    {
        t.changeTeam(random([1,2,3]));
    }

    // utility initializations
    mouse = createVector(0, 0);
    pmouse = createVector(0, 0);
    ppmouse = createVector(0, 0);
    dmouse = createVector(0, 0);
    mouseIndicator = createVector(0, 0);

    focusTarget = GRAVITYBODIES.get(1);
    focusPos = createVector(0, 0);
    focusOffset = createVector(0, 0);

    selectionStart = createVector(0, 0);
    selectionEnd = createVector(0, 0);
}

function draw ()
{
    background(0);
    CANVAS.clear();
    BUFFER_BLOOM.clear();
    UI.clear();
    BUFFER_SELECT.clear();
    BUFFER_BLOOM.image(BACKGROUND, 0,0);
    resetShader();


    //==<update timers>==//


    update();
    updateUI()

    blendMode(BLEND);
    image(CANVAS, -halfW,-halfH);
    image(UI, -halfW,-halfH);
    blendMode(ADD);
    shader(SHADER_BLOOM);
    drawGlow();
    

    for (let i = 0, l = SHIPS2DESTORY.length, shipID; i < l; i++)
    {
        shipID = SHIPS2DESTORY[i];
        console.log(shipID);
        SHIPS.delete(shipID);
        GRAVITYBODIES.delete(shipID);
    }
    SHIPS2DESTORY = [];
}


function update ()
{
    //==<camera control and focus>==//
    getMouseInput();

    // lerp camera to focusTarget
	if (focusTarget != null && focusTarget != undefined) {
		if (CAMERA_LERP_t > 0) {
			focusPos = p5.Vector.lerp(focusPos,focusTarget.getTrackingPos(), 10 * dT);
			CAMERA_LERP_t--;
		}
		else {
			focusPos.x = focusTarget.pos.x;
			focusPos.y = focusTarget.pos.y;
		}
	}

	let tX = -focusPos.x - focusOffset.x;
	let tY = -focusPos.y - focusOffset.y;


    scl = lerp(scl, sclTarget, 15 * dT);

	PUSH();

    TRANSLATE(halfW, halfH);
	SCALE(scl);
	TRANSLATE(tX, tY);

    GravityBody.getAccelerations();

    GRAVITYBODIES.forEach((body, _) => {
        body.display();
        body.update();
    });

    POP();
}

function updateUI ()
{
    // display focus
    let screenFocus = worldToScreenSpace(focusPos);
    UI.push();
    UI.noFill();
    UI.stroke(80,180,240, 160);
    UI.circle(screenFocus.x,screenFocus.y, 8);
    UI.line(screenFocus.x-8,screenFocus.y-8, screenFocus.x+8,screenFocus.y+8);
    UI.line(screenFocus.x+8,screenFocus.y-8, screenFocus.x-8,screenFocus.y+8);
    UI.pop();

    // mouse cursor
    /*
    UI.push();
    UI.noFill();
    UI.stroke(255);
    UI.strokeWeight(map(dmouse.mag(), 0,20, 2,2.5));
    UI.line(mouseX,mouseY, pmouseX,pmouseY);
    UI.pop();
    */

    if (isSelecting)
	{
		selectionEnd.x = mouseX;
		selectionEnd.y = mouseY;
	}

    // display selection box
    UI.push();
    if (isSelecting)
    {
        UI.rectMode(CORNERS);
        UI.fill(40,40, 240, 50);
        UI.stroke(40,40, 200, 100);
        UI.strokeWeight(1.5);
        UI.rect(selectionStart.x,selectionStart.y, selectionEnd.x,selectionEnd.y);    
    }
    UI.pop();

    // display zoom
    UI.push();
    UI.noStroke();
    UI.fill(100, 150);
    UI.rect(10,10, 100, 10);
    UI.fill(80,200,240, 200);
    UI.rect(12,12, map(scl, 0.05,2, 0,96),6);
    UI.pop();
}



function drawGlow ()
{
    SHADER_BLOOM.setUniform('buffer_bloom', BUFFER_BLOOM);
    SHADER_BLOOM.setUniform('texel', [1.0/W, 1.0/H]);
    SHADER_BLOOM.setUniform('gaussian_radius', 6 * scl);
    
    rect(-W/2,-H/2, W,H);
}

/*
* MOUSE INPUT
*/
let mouse, pmouse,ppmouse, dmouse, mouseIndicator;
let mouseHover = false,
	mouseDown1 = false,
	mouseDown2 = false;

let INTERACTABLES = [];
let SELECTED = [];

let selectionStart,
	selectionEnd,
	isSelecting = false;
let selectionContinue = false;

function getMouseInput ()
{
	mouse.x = mouseX;
    mouse.y = mouseY;
	ppmouse.x = pmouse.x;
	ppmouse.y = pmouse.y;
	pmouse.x = pmouseX;
    pmouse.y = pmouseY;
    dmouse = p5.Vector.div(p5.Vector.sub(mouse, pmouse), scl);
}

function mouseClicked () 
{
	let x = round(mPos.x);
	let y = round(mPos.y);
	let RGB = BUFFER_SELECT.get(x, y);
	let RGBarr = [red(RGB), blue(RGB), green(RGB)];
	selected.push(INTERACTABLES[RGB2ID(RGBarr)]);
}
function mousePressed ()
{
	mouseDown1 = mouseButton === LEFT;
	mouseDown2 = mouseButton === RIGHT;

	if (mouseDown1)
	{
		if (!isSelecting)
		{
			if (SELECTED.length > 0)
			{
				let target = getMouseTarget();

				for (let id of SELECTED)
				{
					if (!SHIPS.has(id)) { continue; }
					SHIPS.get(id).setTarget(target);
				}

				deselect();
				isSelecting = false;
			}
			else
			{
				selectionStart.x = mouseX;
				selectionStart.y = mouseY;
				selectionEnd.x = mouseX;
				selectionEnd.y = mouseY;
				isSelecting = true;	
			}
		}
	}
}
function mouseReleased ()
{
	if (isSelecting)
	{
		performSelection();
	}

	isSelecting = false;
}
function mouseDragged ()
{
	if (mouseDown2)
	{
		focusOffset.sub(dmouse);
	}
}
function mouseWheel (e)
{
	if (abs(e.deltaY) >= 1)
	{
		sclTarget += e.deltaY / 500;
		sclTarget = constrain(sclTarget, 0.05, 2);
	}

	if (sclTarget >= 1.35)
	{
		CAMERA_LOD = CAMERA_LODs.LOCAL;
	}
	else
	{
		CAMERA_LOD = CAMERA_LODs.MAP;
	}
}

function keyPressed ()
{
	switch (keyCode)
	{
		case SHIFT:
			selectionContinue = true;
			break;
		case ESCAPE:
			focusTarget = new PositionTarget(p5.Vector.add(focusPos, focusOffset));
			break;
		case ENTER:
			focusOffset.x = 0;
			focusOffset.y = 0;
			break;
	
	}
}



function screenToWorldSpace (pos)
{
	let temp = pos.copy();

	let focus = p5.Vector.add(focusPos, focusOffset);

	temp.div(scl).add(focus);

	let worldHalfW = halfW / scl;
	let worldHalfH = halfH / scl;

	temp.x -= worldHalfW;
	temp.y -= worldHalfH;

	return temp;
}
function worldToScreenSpace (pos)
{
	let temp = pos.copy();

	let worldHalfW = halfW / scl;
	let worldHalfH = halfH / scl;

	temp.x += worldHalfW;
	temp.y += worldHalfH;

	let focus = p5.Vector.add(focusPos, focusOffset);

	temp.sub(focus).mult(scl);

	return temp;
}

function getMouseTarget ()
{
	let worldMouse = screenToWorldSpace(createVector(mouseX, mouseY));
    let target = new PositionTarget(worldMouse);

	for (let id of INTERACTABLES)
	{
		let interactable = GRAVITYBODIES.get(id);
		if (interactable instanceof Ship) { continue; }

		console.log(interactable);
		if (positionWithinCircle(worldMouse, interactable.getPosition(),interactable.size))
		{
			target = interactable;
		}
	}

    return target;
}


function performSelection ()
{
	if (!selectionContinue) deselect();

	let S = screenToWorldSpace(selectionStart);
	let E = screenToWorldSpace(selectionEnd);

	let mx = min(S.x, E.x);
	let Mx = max(S.x, E.x);
	let my = min(S.y, E.y);
	let My = max(S.y, E.y);

	for (let id of INTERACTABLES)
	{
		let body = GRAVITYBODIES.get(id);
		if (valueBetween(body.pos.x, mx,Mx) && valueBetween(body.pos.y, my,My))
		{
			body.setSelected(true);
			SELECTED.push(id);
		}
	}

	console.log(SELECTED);
}
function deselect ()
{
	while (SELECTED.length > 0)
	{
		GRAVITYBODIES.get(SELECTED[0]).setSelected(false);
		SELECTED.splice(0, 1);
	}
}


function ID2RGB (id)
{
	return [
		floor(id / 256*256),
		floor(id / 256),
		id % 256
	];
}
function RGB2ID (rgb)
{
	return rgb[0] + rgb[1]*256 + rgb[2]*256*256;
}
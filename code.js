// https://www.w3schools.com/tags/tag_select.asp
// https://www.w3schools.com/jsref/met_console_time.asp

let mcan = document.getElementById("mcan");
mcan.width = 500;
mcan.height = 500;
let mctx = mcan.getContext("2d", {willReadFrequently: true});
mctx.fillStyle = "white";
mctx.fillRect(0, 0, mcan.width, mcan.height);
let mcanContainer = document.getElementById("mcancontainer");
let settingsDiv = document.getElementById("settingsdiv");

let toolDropdown = document.getElementById("tooldropdown");
toolDropdown.addEventListener("input", ()=>{
    
});

function createInputPalette(label, container, variable, inputType, count, defaults, updateFunc) {
    let div = document.createElement("div");
    for (let i=0; i<count; i++) {
        let input = document.createElement("input");
        input.type = inputType;
        input.value = defaults[i%defaults.length];
        function update(){
            variable.value = input.value;
            if (updateFunc != undefined) {
                updateFunc();
            }
        }
        input.addEventListener("input", update);
        input.addEventListener("click", update);
        input.style.width = "20%";
        div.appendChild(input);
    }
    let labelP = document.createElement("p");
    labelP.innerText = label;
    container.appendChild(labelP);
    container.appendChild(div);
}

function createOnOffButton(label, container, variable){
    let button = document.createElement("button");
    button.innerText = label+" (off)";
    button.addEventListener("click", ()=>{
        variable.value = !variable.value;
        if (variable.value) {
            button.innerText = label+" (on)";
            button.style.backgroundColor = "gold";
        } else {
            button.innerText = label+" (off)";
            button.style.backgroundColor = "white";
        }
    });
    container.appendChild(button);
}

let canvasWidth = {value: 500};
createInputPalette("Canvas Width:", settingsDiv, canvasWidth, "text", 1, ["500"], ()=>{
    mcan.width = canvasWidth.value;
    mcan.style.width = canvasWidth.value+"px";
    mctx.fillStyle = "white";
    mctx.fillRect(0, 0, mcan.width, mcan.height);
});
let canvasHeight = {value: 500};
createInputPalette("Canvas Height:", settingsDiv, canvasHeight, "text", 1, ["500"], ()=>{
    mcan.height = canvasHeight.value;
    mcan.style.height = canvasHeight.value+"px";
    mctx.fillStyle = "white";
    mctx.fillRect(0, 0, mcan.width, mcan.height);
});
let canvasZoom = {value: 1};
createInputPalette("Zoom:", settingsDiv, canvasZoom, "range", 1, [1], ()=>{
    console.log(canvasZoom.value);
});
let brushSize = {value: 10};
createInputPalette("Brush Size:", settingsDiv, brushSize, "text", 4, ["10"]);
let brushColor = {value: 10};
createInputPalette("Brush Color:", settingsDiv, brushColor, "color", 4, ["black"]);
let redrawLinesOn = {value: false};
createOnOffButton("Redraw Lines", settingsDiv, redrawLinesOn);
let lineSmoothness = {value: 10};
createInputPalette("Line Smoothness:", settingsDiv, lineSmoothness, "text", 1, ["10"]);
let thickerCurveBrushOn = {value: false};
createOnOffButton("Thicker Curve Brush", settingsDiv, thickerCurveBrushOn);

let keysDown = [];
let mcanStates = [];
let pointsToDraw = [];
let isDrawing = false;
let drawingStraightLine = false;

mcan.addEventListener("click", (event)=>{
    if (toolDropdown.value == "paintbrush") {
        isDrawing = !isDrawing;
        if (isDrawing) {
            mcanStates.push(mctx.getImageData(0, 0, mcan.width, mcan.height));
            drawingStraightLine = arrayHasItem(keysDown, "Shift");
            pointsToDraw = [[event.offsetX, event.offsetY]];
        } else {
            drawingStraightLine = false;
            if (redrawLinesOn.value) {
                mctx.putImageData(mcanStates[mcanStates.length-1], 0, 0);
                drawLine(pointsToDraw, lineSmoothness.value);
            }
        }
    } else if (toolDropdown.value == "paintbucket") {
        let mctxImgdt = mctx.getImageData(0, 0, mcan.width, mcan.height);
        mcanStates.push(mctxImgdt);
        let newImgdt = new ImageData(mcan.width, mcan.height);
        for (let i=0; i<mctxImgdt.data.length; i++) {
            newImgdt.data[i] = mctxImgdt.data[i];
        }
        let index = (event.offsetY*mcan.width+event.offsetX)*4
        let colorToReplace = [mctxImgdt.data[index], mctxImgdt.data[index+1], mctxImgdt.data[index+2]];
        let pixelsToReplace = [];
        pixelsToReplace.push(index);
        let done = false;
        let pixelsCheckStartIndex = 0;
        let mcanw4 = mcan.width*4;
        let mctxImgdtDataLength = mctxImgdt.data.length;
        while (!done) {
            done = true;
            let pixelsToReplaceLength = pixelsToReplace.length;
            for (let i=pixelsCheckStartIndex; i<pixelsToReplaceLength; i++) {
                done = false;
                    index = pixelsToReplace[i];
                    let indices = [index+4, index-4, index+mcanw4, index-mcanw4];
                    for (let j=0; j<indices.length; j++) {
                        let ind = indices[j];
                        if (ind > -1 && ind < mctxImgdtDataLength) {
                            let sameColor = true;
                            for (let k=0; k<3; k++) {
                                if (mctxImgdt.data[ind+k] != colorToReplace[k]) {
                                    sameColor = false;
                                }
                            }
                            if (sameColor) {
                                let hasIndex = false;
                                for (let k=0; k<pixelsToReplace.length; k++) {
                                    if (pixelsToReplace[k] == ind) {
                                        hasIndex = true;
                                    }
                                }
                                if (!hasIndex) {
                                    pixelsToReplace.push(ind);
                                }
                            }
                        }
                    }
            }
            pixelsCheckStartIndex = pixelsToReplaceLength;
        }
        let int = parseInt(brushColor.value.substring(1), 16);
        let fillColor = [];
        for (let i=0; i<3; i++) {
            fillColor.push(int%256);
            int /= 256;
        }
        for (let i=0; i<pixelsToReplace.length; i++) {
            index = pixelsToReplace[i];
            newImgdt.data[index] = fillColor[2];
            newImgdt.data[index+1] = fillColor[1];
            newImgdt.data[index+2] = fillColor[0];
            newImgdt.data[index+3] = 255;
        }
        mctx.putImageData(newImgdt, 0, 0);
    }
});

mcan.addEventListener("mousemove", (event)=>{
    if (isDrawing) {
        if (drawingStraightLine) {
            pointsToDraw[1] = [event.offsetX, event.offsetY];
        } else {
            pointsToDraw.push([event.offsetX, event.offsetY]);
            if (pointsToDraw.length > 1) {
                drawLine(pointsToDraw.slice(), lineSmoothness.value*thickerCurveBrushOn.value);
            }
        }
    }
});

document.addEventListener("keydown", (event)=>{
    if (!arrayHasItem(keysDown, event.key)) {
        keysDown.push(event.key);
        if (arrayHasItem(keysDown, "z") && arrayHasItem(keysDown, "Control")) {
            mctx.putImageData(mcanStates[mcanStates.length-1], 0, 0);
            mcanStates.splice(mcanStates.length-1, 1);
        }
    }
});

document.addEventListener("keyup", (event)=>{
    for (let i=0; i<keysDown.length; i++) {
        if (keysDown[i] == event.key) {
            keysDown.splice(i, 1);
            i--;
        }
    }
});

function drawingLoop(){
    if (drawingStraightLine) {
        mctx.putImageData(mcanStates[mcanStates.length-1], 0, 0);
        drawLine(pointsToDraw.slice(), 0);
    }
    requestAnimationFrame(drawingLoop);
}
drawingLoop();

function drawLine(line, smoothen){
    if (line.length > 1) {
        if (line.length > 2) {
            for (let ii=0; ii<smoothen; ii++) {
                let newPoints = [];
                for (let i=1; i<line.length-1; i++) {
                    let point = [];
                    for (let j=0; j<2; j++) {
                        point.push(line[i][j]/2+line[i-1][j]/4+line[i+1][j]/4);
                    }
                    newPoints.push(point);
                }
                newPoints.push(line[line.length-1]);
                line = [line[0], ...newPoints];
            }
        }
        mctx.strokeStyle = brushColor.value;
        mctx.lineWidth = brushSize.value;
        mctx.beginPath();
        mctx.moveTo(...line.shift());
        while (line.length > 0) {
            mctx.lineTo(...line.shift());
        }
        mctx.stroke();
    }
}

function arrayHasItem(array, item){
    for (let i=0; i<array.length; i++) {
        if (array[i] == item) {
            return true;
        }
    }
    return false;
}
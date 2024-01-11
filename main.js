'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let a = 1;
let b = 0.1;
let c = 0.2;
let d = 0.1;
function updateSurface() {
    surface.BufferData(...CreateSurfaceData());
    draw()
}
function deg2rad(angle) {
    return angle * Math.PI / 180;
}

let light;
let textu = [0.5, 0.5];
window.onkeydown = (e) => {
    if (e.keyCode == 87) {
        textu[0] = Math.min(textu[0] + 0.01, 1);
    }
    else if (e.keyCode == 83) {
        textu[0] = Math.max(textu[0] - 0.01, 0);
    }
    else if (e.keyCode == 68) {
        textu[1] = Math.min(textu[1] + 0.01, 1);
    }
    else if (e.keyCode == 65) {
        textu[1] = Math.max(textu[1] - 0.01, 0);
    }
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, normals, textures) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    /* Draw the six faces of a cube, with different colors. */
    let col = hexToRgb(document.getElementById('col').value)
    let z = document.getElementById('z').value
    let r = document.getElementById('r').value
    gl.uniform4fv(shProgram.iColor, [...col, 1]);
    gl.uniform3fv(shProgram.iLightPos, [r * Math.sin(Date.now() * 0.001), r * Math.cos(Date.now() * 0.001), z]);
    gl.uniform2fv(shProgram.iTextu, textu);
    gl.uniform1f(shProgram.iAngle, document.getElementById('angle').value);

    surface.Draw();
    gl.uniform3fv(shProgram.iLightPos, [1000, Math.cos(Date.now() * 0.001), 0]);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(modelViewProjection,
        m4.translation(...ahv(textu[0]*Math.PI*4,textu[1]*Math.PI*2))));
    light.Draw();
}

setInterval(draw, 1000 / 30)

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return [
        parseInt(result[1], 16) / 256,
        parseInt(result[2], 16) / 256,
        parseInt(result[3], 16) / 256
    ]
}

function CreateSurfaceData() {
    a = parseFloat(document.getElementById('a').value);
    b = parseFloat(document.getElementById('b').value);
    c = parseFloat(document.getElementById('c').value);
    d = parseFloat(document.getElementById('d').value);
    let vertexList = [];
    let normalList = [];
    let textureList = [];
    let steps = 100;
    let uPlus = (Math.PI * 2) / steps;
    let vPlus = (Math.PI * 2) / steps;
    for (let u = 0; u < Math.PI * 4; u += uPlus) {
        for (let v = 0; v < Math.PI * 2; v += vPlus) {
            vertexList.push(...ahv(u, v));
            vertexList.push(...ahv(u + uPlus, v));
            vertexList.push(...ahv(u, v + vPlus));
            vertexList.push(...ahv(u, v + vPlus));
            vertexList.push(...ahv(u + uPlus, v));
            vertexList.push(...ahv(u + uPlus, v + vPlus));
            normalList.push(...ahvNormal(u, v));
            normalList.push(...ahvNormal(u + uPlus, v));
            normalList.push(...ahvNormal(u, v + vPlus));
            normalList.push(...ahvNormal(u, v + vPlus));
            normalList.push(...ahvNormal(u + uPlus, v));
            normalList.push(...ahvNormal(u + uPlus, v + vPlus));
            textureList.push((u) / (Math.PI * 4), (v) / (Math.PI * 2));
            textureList.push((u + uPlus) / (Math.PI * 4), (v) / (Math.PI * 2));
            textureList.push((u) / (Math.PI * 4), (v + vPlus) / (Math.PI * 2));
            textureList.push((u) / (Math.PI * 4), (v + vPlus) / (Math.PI * 2));
            textureList.push((u + uPlus) / (Math.PI * 4), (v) / (Math.PI * 2));
            textureList.push((u + uPlus) / (Math.PI * 4), (v + vPlus) / (Math.PI * 2));
        }
    }
    return [vertexList, normalList, textureList];
}

const { sin, cos, pow } = Math;
function ahv(u, v) {

    const x = (a + x0(v) * cos(b) + y0(v) * sin(b)) * cos(u)
    const y = (a + x0(v) * cos(b) + y0(v) * sin(b)) * sin(u)
    const z = d * u - x0(v) * sin(b) + y0(v) * cos(b);
    return [x, y, z]
}
function x0(v) {
    return c * pow(cos(v), 3)
}
function y0(v) {
    return c * pow(sin(v), 3)
}

let plus = 0.001
function ahvNormal(u, v) {
    let uv = ahv(u, v)
    let uPlus = ahv(u + plus, v)
    let vPlus = ahv(u, v + plus)
    const dU = [(uv[0] - uPlus[0]) / plus, (uv[1] - uPlus[1]) / plus, (uv[2] - uPlus[2]) / plus]
    const dV = [(uv[0] - vPlus[0]) / plus, (uv[1] - vPlus[1]) / plus, (uv[2] - uPlus[2]) / plus]
    return m4.normalize(m4.cross(dU, dV))
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLightPos = gl.getUniformLocation(prog, "lightPos");
    shProgram.iAngle = gl.getUniformLocation(prog, "angle");
    shProgram.iTextu = gl.getUniformLocation(prog, "textu");

    surface = new Model('Surface');
    surface.BufferData(...CreateSurfaceData());
    light = new Model('Surface');
    light.BufferData(...CreateSphereData());

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function CreateSphereData() {
    let vertexList = [];

    let u = 0,
        t = 0;
    while (u < Math.PI * 2) {
        while (t < Math.PI) {
            let v = getSphereVertex(u, t);
            let w = getSphereVertex(u + 0.1, t);
            let wv = getSphereVertex(u, t + 0.1);
            let ww = getSphereVertex(u + 0.1, t + 0.1);
            vertexList.push(...v, ...w, ...wv, ...wv, ...w, ...ww);
            t += 0.1;
        }
        t = 0;
        u += 0.1;
    }
    return [vertexList, vertexList, vertexList];
}
const radius = 0.05;
function getSphereVertex(long, lat) {
    return [
        radius * Math.cos(long) * Math.sin(lat),
        radius * Math.sin(long) * Math.sin(lat),
        radius * Math.cos(lat)
    ]
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        LoadTexture()
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://raw.githubusercontent.com/IzvZhe/Visualisation/cgw/texture.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        draw()
    }
}
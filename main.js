// Project: Ascii Shader
// Author: Jonathan Kang

import vertexShaderSrc from './vertex.glsl.js';
import fragmentShaderSrc from './fragment.glsl.js';

const resizing = 3.0;

/////////////////////////////////////////////////////
// Create the Program
function createProgram(gl, vshader, fshader){
  const program = gl.createProgram();
  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);
  gl.linkProgram(program);
  gl.useProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS) ) {
    let info = gl.getProgramInfoLog(program);
    console.log('Could not compile WebGL program:' + info);
  }

  return program;
};

/////////////////////////////////////////////////////
// Create Shader (vertex and fragment)
function createShader(gl, type, source){
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
    let info = gl.getShaderInfoLog(shader);
    console.log('Could not compile WebGL program:' + info);
  }
  return shader;
};

/////////////////////////////////////////////////////
// Pre-fills in 4 component vector of each particular ASCII character
// Basically: The basic vector created here is 4 quadrants of a square,
// And each quadrant finds the average "brightness/lightness" of a character
function preAscii(char, dimW, dimH, rects) {
  const offscreen = document.createElement('canvas'); //invisible element
  offscreen.width = dimW;
  offscreen.height = dimH;
  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
  // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
  const ctx = offscreen.getContext('2d');
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, dimW, dimH);
  ctx.fillStyle = "white";
  ctx.font = `${dimH}px monospace`;
  ctx.textBaseline = "top";
  ctx.fillText(char, 0, 0);
  
  //reads pixel data from canvas
  const pixel = ctx.getImageData(0, 0, dimW, dimH);
  const data = pixel.data;

  // returns 4-component vector of each ASCII character
  return rects.map(({ x, y, w, h }) => {
    let lightPix = 0;
    let total = 0;
    for(let pixelY = y; pixelY < y + h; pixelY++){
      for(let pixelX = x; pixelX < x + w; pixelX++){
        const i = (Math.floor(pixelY) * dimW + Math.floor(pixelX)) * 4;
        //basing lightPixel on red channel, R = G = B in this instance (White = (255,255,255))
        lightPix += data[i] / 255; //normalization
        total += 1
      };
    };
    return lightPix / total;
  });
};

/////////////////////////////////////////////////////
// Returns 4-component vector of the cell/pixel data
// Similar to preAscii's return function, except it's all based on all colors, not just red
function sampleImage(data, dimW, dimH, rects, imgW, cellX, cellY) {
  return rects.map(({ x, y, w, h }) => {
    let lightPix = 0;
    let total = 0;
    for(let pixelY = cellY + y; pixelY < cellY + y + h; pixelY++){
      for(let pixelX = cellX + x; pixelX < cellX + x + w; pixelX++){
        const i = (Math.floor(pixelY) * imgW + Math.floor(pixelX)) * 4;
        const r = data[i] / 255; //normalization
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        // https://en.wikipedia.org/wiki/Relative_luminance
        lightPix += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        total += 1;
      };
    };
    return lightPix / total;
  });
};

/////////////////////////////////////////////////////
// Initialization and Rendering
function initialize(){
  // screen setup
  const canvas = document.querySelector('canvas');
  canvas.width = canvas.clientWidth * resizing;
  canvas.height = canvas.clientHeight * resizing;
  const gl = canvas.getContext('webgl2');
  gl.viewport(0, 0, canvas.width, canvas.height);

  //create shaders
  const vshader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
  const fshader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);

  //create and link program
  const program = createProgram(gl, vshader, fshader);

  //create vertices buffers
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  //tab screen size adjustments
  const uRes = gl.getUniformLocation(program, 'u_resolution');
  const observer = new ResizeObserver(() => {
    canvas.width = canvas.clientWidth * resizing;
    canvas.height = canvas.clientHeight * resizing;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  });

  observer.observe(canvas);
  const uTime = gl.getUniformLocation(program, 'u_time');
  gl.uniform2f(uRes, canvas.width, canvas.height);

  //overall setup of shape vectors
  const chars = ' \'`1234567890-=~!@#$%^&*()_+[]\\{}|:";,./<>?qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
  //dimensions of cell
  const dimW = 10;
  const dimH = 13;

  //2x2 cells that define density of a letter
  const rects = [
    {x: 0,          y: 0,          w: dimW / 2,   h: dimH / 2},
    {x: dimW / 2,   y: 0,          w: dimW / 2,   h: dimH / 2},
    {x: 0,          y: dimH / 2,   w: dimW / 2,   h: dimH / 2},
    {x: dimW / 2,   y: dimH / 2,   w: dimW / 2,   h: dimH / 2},
  ];

  //fits the density of a letter into a 4-part vector
  const shapeVectors = {};
  for (const char of chars){
    shapeVectors[char] = preAscii(char, dimW, dimH, rects)
  }
  console.log(shapeVectors);

  const img = new Image();
  img.src = "faust.webp"; //currently hardcoded image to work with the ascii

  //////////////////////////////////////////////////////////////////////////
  //runs function when the image is fully loaded
  //deals with drawing image onto the canvas
  img.onload = function() {

    //creates pixel data from the img
    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = img.naturalWidth;
    imgCanvas.height = img.naturalHeight;
    const ctx = imgCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // extracts data (the RGBA array) into the data of each pixel
    const imgData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
    const data = imgData.data;

    // checks for cell row and column count that applies to image
    const imgY = Math.floor(img.naturalHeight / dimH);
    const imgX = Math.floor(img.naturalWidth / dimW);

    //renderGrid is a 2D array of characters imitating the visualization of ASCII characters
    //later converst into the "pre" element but first collects the closest characters
    const renderGrid = [];
    for (let r = 0; r < imgY; r++){
      renderGrid.push([]);
      for (let c = 0; c < imgX; c++) {
        const cellX = c * dimW;
        const cellY = r * dimH;

        //samplingVector takes the 4 components of the pixel data/cell for later comparison with a char's shapeVector
        const samplingVector = sampleImage(data, dimW, dimH, rects, img.naturalWidth, cellX, cellY);
        let smallest = Infinity
        let bestChar = '';
        //checks the closest neighbor character that applies to the particular cell
        for (const [char, shapeVector] of Object.entries(shapeVectors)) {
          let dist = 0;
          // checks each of the 4 components to see what's the closest neighbor
          for (let i = 0; i < samplingVector.length; i++) {
            dist += Math.pow(shapeVector[i] - samplingVector[i], 2);
          };
          if (dist < smallest) {
            smallest = dist;
            bestChar = char;
          };
        };
        // best fit character for the cell
        renderGrid[r][c] = bestChar;
      };
    };

    // pastes all data onto the pre element (which is visible on the website)
    const pre = document.querySelector('pre');
    let rowString = "";
    for (let r = 0; r < renderGrid.length; r++){
      for (let c = 0; c < renderGrid[0].length; c++){
        rowString += renderGrid[r][c];
      }
      rowString += "\n";
    }
    pre.textContent = rowString;
  };

  //to render everything frame by frame
  function render(t) {
    gl.uniform1f(uTime, t * 0.001);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
};

window.onload = initialize;
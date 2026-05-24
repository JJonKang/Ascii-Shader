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
// Shape
function preAscii(char, dimW, dimH, rects) {
  const offscreen = document.createElement('canvas');
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
  
  const pixel = ctx.getImageData(0, 0, dimW, dimH);
  const data = pixel.data;

  return rects.map(({ x, y, w, h }) => {
    let lightPix = 0;
    let total = 0;
    for(let pixelY = y; pixelY < y + h; pixelY++){
      for(let pixelX = x; pixelX < x + w; pixelX++){
        const i = (Math.floor(pixelY) * dimW + Math.floor(pixelX)) * 4;
        lightPix += data[i] / 255; //normalization
        total += 1
      };
    };
    return lightPix / total;
  });
};

/////////////////////////////////////////////////////
// Shape
function sampleImage(data, dimW, dimH, rects, imgW, cellX, cellY) {
  return rects.map(({ x, y, w, h }) => {
    let lightPix = 0;
    let total = 0;
    for(let pixelY = cellY + y; pixelY < cellY + y + h; pixelY++){
      for(let pixelX = cellX + x; pixelX < cellX + x + w; pixelX++){
        const i = (Math.floor(pixelY) * imgW + Math.floor(pixelX)) * 4;
        lightPix += data[i] / 255; //normalization
        total += 1
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
  console.log(chars)
  //dimensions of cell
  const dimW = 10;
  const dimH = 13;

  const rects = [
    {x: 0, y: 0, w: dimW / 2, h: dimH / 2},
    {x: dimW / 2, y: 0, w: dimW / 2, h: dimH / 2},
    {x: 0, y: dimH / 2, w: dimW / 2, h: dimH / 2},
    {x: dimW / 2, y: dimH / 2, w: dimW / 2, h: dimH / 2},
  ];

  const shapeVectors = {};
  for (const char of chars){
    shapeVectors[char] = preAscii(char, dimW, dimH, rects)
  }
  console.log(shapeVectors);

  const img = new Image();
  img.src = "download.jpg";
  img.onload = function() {
    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = img.naturalWidth;
    imgCanvas.height = img.naturalHeight;
    const ctx = imgCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
    const imgY = Math.floor(img.naturalHeight / dimH);
    const imgX = Math.floor(img.naturalWidth / dimW);
    for (let r = 0; r < imgY; r++){
      for (let c = 0; c < imgX; c++) {
        const cellX = c * dimW;
        const cellY = r * dimH;
        const samplingVector = sampleImage(data, dimW, dimH, rects, img.naturalWidth, cellX, cellY);
        let smallest = Infinity
        for (vectors of shapeVectors){
          smallest = Math.min(smallest, Math.pow(vectors[0] - samplingVector, 2) + Math.pow(vectors[1] - samplingVector, 2));
        }
      };
    };
  };

  function render(t) {
    gl.uniform1f(uTime, t * 0.001);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
};

window.onload = initialize;
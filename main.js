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
function preAscii(char, dimW, dimH, circles) {
  const offscreen = document.createElement('canvas');
  //offscreen.width = 
}


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
  for (char in chars){
    shapeVectors[char] = preAscii(char, dimW, dimH, rects)
  }
  console.log(shapeVectors);

  function render(t) {
    gl.uniform1f(uTime, t * 0.001);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
};

window.onload = initialize;
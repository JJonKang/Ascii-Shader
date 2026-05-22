export default `#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.y * 12.0;

  fragColor = vec4(uv, 0.0, 1.0);
}

`;
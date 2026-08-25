export default `#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D u_texture;
uniform sampler2D u_shapeVector;

out vec4 fragColor;


void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.y * 1.0;
  fragColor = texture(u_texture, uv);
}

`;
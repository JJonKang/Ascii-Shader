export default `#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

// dimensions
uniform float u_dimW;
uniform float u_dimH;
uniform float u_imageW;
uniform float u_imageH;
uniform float u_resizing;

uniform sampler2D u_texture; // the main source (eg. image)
uniform sampler2D u_shapeVector; // converter (the vectors for all characters from u_chars)
uniform int u_charsLength; //length of the chars available for ascii conversion
uniform sampler2D u_atlas; // text atlas texture

out vec4 fragColor;

float sampleSource(vec2 quad, float cellX, float cellY) {
  float sampleX = cellX * u_dimW + quad.x * u_dimW / 2.0 + u_dimW / 4.0;
  float sampleY = cellY * u_dimH + quad.y * u_dimH / 2.0 + u_dimH / 4.0;
  vec2 uv = vec2(sampleX / (u_resolution.x / u_resizing), sampleY / (u_resolution.y / u_resizing));  
  vec4 colors = texture(u_texture, uv);
  // https://en.wikipedia.org/wiki/Relative_luminance
  return 0.2126 * colors.r + 0.7152 * colors.g + 0.0722 * colors.b;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float cellX = floor(gl_FragCoord.x / u_dimW / u_resizing);
  float cellY = floor((u_resolution.y - gl_FragCoord.y) / u_dimH / u_resizing);

  // which quadrant the fragment is on
  vec2 posCell = mod(gl_FragCoord.xy, vec2(u_dimW, u_dimH));

  //samplingVector takes the 4 components of the fragment data/cell for later comparison with a char's u_shapeVector
  vec4 samplingVector = vec4(
    sampleSource(vec2(0.0, 0.0), cellX, cellY),
    sampleSource(vec2(1.0, 0.0), cellX, cellY),
    sampleSource(vec2(0.0, 1.0), cellX, cellY),
    sampleSource(vec2(1.0, 1.0), cellX, cellY)
  );

  // neat infinity trick https://stackoverflow.com/questions/10435253/glsl-infinity-constant
  float smallest = 1. / 0.;
  int bestChar = 0;
  //checks the closest neighbor character that applies to the particular cell
  for (int i = 0; i < u_charsLength; i++){
    float dist = 0.0;
    // checks each of the 4 components to see what's the closest neighbor
    vec4 shapeVec = texture(u_shapeVector, vec2((float(i) + 0.5) / float(u_charsLength), 0.5));
    vec4 diff = shapeVec - samplingVector;
    dist += dot(diff, diff);
    if (dist < smallest) {
      smallest = dist;
      bestChar = i;
    };
  };

  float atlasU = (float(bestChar) + posCell.x / u_dimW) / float(u_charsLength);
  float atlasV = 1.0 - posCell.y / u_dimH;
  fragColor = texture(u_atlas, vec2(atlasU, atlasV));
}

`;
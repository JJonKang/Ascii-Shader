export default `#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

// dimensions
uniform float u_dimW;
uniform float u_dimH;
uniform float u_imageW;
uniform float u_imageH;

uniform sampler2D u_texture; // the main source (eg. image)
uniform sampler2D u_shapeVector; // converter (the vectors for all characters from u_chars)
uniform int u_charsLength; //length of the chars available for ascii conversion

out vec4 fragColor;

float sampleSource(vec2 quad, float cellX, float cellY) {
  float sampleX = cellX * u_dimW + quad.x * u_dimW / 2.0 + u_dimW / 4.0;
  float sampleY = cellY * u_dimH + quad.y * u_dimH / 2.0 + u_dimH / 4.0;
  vec2 uv = vec2(sampleX / u_imageW, sampleY / u_imageH);
  vec4 colors = texture(u_texture, uv);
  // https://en.wikipedia.org/wiki/Relative_luminance
  return 0.2126 * colors.r + 0.7152 * colors.g + 0.0722 * colors.b;
};


void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float cellX = floor(gl_FragCoord.x / u_dimW);
  float cellY = floor(gl_FragCoord.y / u_dimH);

  // which quadrant the fragment is on
  vec2 posCell = mod(gl_FragCoord.xy, vec2(u_dimW, u_dimH));
  vec2 quadrant = step(vec2(u_dimW / 2.0, u_dimH / 2.0), posCell);

  //samplingVector takes the 4 components of the fragment data/cell for later comparison with a char's u_shapeVector
  float samplingVector[4];
  samplingVector[0] = sampleSource(vec2(0.0, 0.0), cellX, cellY);
  samplingVector[1] = sampleSource(vec2(1.0, 0.0), cellX, cellY);
  samplingVector[2] = sampleSource(vec2(0.0, 1.0), cellX, cellY);
  samplingVector[3] = sampleSource(vec2(1.0, 1.0), cellX, cellY);

  // neat infinity trick https://stackoverflow.com/questions/10435253/glsl-infinity-constant
  float smallest = 1. / 0.;
  // TODO: implement font atlas here for texturing characters onto the page
  //checks the closest neighbor character that applies to the particular cell
  for (int i = 0; i < u_charsLength; i++){
    float dist = 0;
    // checks each of the 4 components to see what's the closest neighbor
    vec4 shapeVec = texture(u_shapeVector, vec2((float(i) + 0.5) / float(u_charsLength), 0.5));
    for (int j = 0; j < 4; j++){
      float diff = shapeVec[j] - samplingVector[j];
      dist += pow(diff, 2.0);
    };
    if (dist < smallest) {
      smallest = dist;
      // more font atlas things
    };
  };

  fragColor = texture(u_texture, uv);
}

`;
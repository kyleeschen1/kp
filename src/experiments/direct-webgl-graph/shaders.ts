export const surfaceVertex = `#version 300 es
precision highp float;
layout(location=0) in vec3 position;
layout(location=1) in vec2 gradient;
uniform mat4 projection;
uniform float heightScale;
out vec3 normal;
out vec2 domain;
void main() {
  domain = position.xy;
  normal = vec3(-gradient * heightScale, 1.0);
  gl_Position = projection * vec4(position.xy, position.z * heightScale, 1.0);
}`;

export const surfaceFragment = `#version 300 es
precision highp float;
in vec3 normal;
in vec2 domain;
uniform vec3 surfaceColor;
uniform vec3 inkColor;
uniform vec3 eye;
uniform bool lit;
uniform bool mesh;
uniform vec3 background;
uniform float strength;
uniform vec2 yBounds;
out vec4 color;
void main() {
  vec3 n = normalize(normal);
  // The math-to-camera axis swap reverses winding; use the view vector for
  // two-sided lighting instead of relying on gl_FrontFacing's convention.
  if (dot(n, eye) < 0.0) n = -n;
  float diffuse = max(0.0, dot(n, normalize(vec3(-0.35, -0.55, 1.0))));
  float light = lit ? 0.43 + 0.57 * diffuse : 1.0;
  vec3 paint = pow(pow(surfaceColor, vec3(2.2)) * light, vec3(1.0 / 2.2));
  float wireMix = 0.0;
  if (mesh) {
    vec2 distanceToLine = abs(fract(domain - 0.5) - 0.5) / max(fwidth(domain), vec2(0.00001));
    float coverage = 1.0 - smoothstep(0.35, 1.2, min(distanceToLine.x, distanceToLine.y));
    wireMix = coverage * 0.38;
  }
  // Evaluate derivatives before divergent discard so the remaining mesh keeps
  // its ordinary wire coverage right up to each geometric clipping boundary.
  if (domain.y < yBounds.x || domain.y > yBounds.y) discard;
  vec3 fill = mix(background, paint, strength);
  vec3 wire = mix(background, inkColor, strength);
  color = vec4(mix(fill, wire, wireMix), 1.0);
}`;

// Native WebGL line width is implementation-dependent. These instanced quads
// keep reference lines a predictable CSS-pixel width across devices and zoom.
export const lineVertex = `#version 300 es
precision highp float;
layout(location=0) in vec3 start;
layout(location=1) in vec3 end;
layout(location=2) in float role;
uniform mat4 projection;
uniform vec2 viewport;
uniform float sectionY;
uniform float heightOffset;
uniform float heightScale;
out float edge;
flat out int colorRole;
void main() {
  vec2 corners[6] = vec2[6](vec2(0,-1), vec2(1,-1), vec2(0,1), vec2(0,1), vec2(1,-1), vec2(1,1));
  vec2 corner = corners[gl_VertexID];
  vec3 from = start, to = end;
  if (role > 3.5) { from.y = sectionY; to.y = sectionY; }
  if (role > 3.5 && role < 4.5) {
    from.z = (from.z + heightOffset) * heightScale;
    to.z = (to.z + heightOffset) * heightScale;
  }
  vec4 a = projection * vec4(from, 1.0);
  vec4 b = projection * vec4(to, 1.0);
  vec2 delta = (b.xy - a.xy) * viewport;
  vec2 perpendicular = vec2(-delta.y, delta.x) / max(length(delta), 0.0001);
  float halfWidth = role > 3.5 && role < 4.5 ? 2.8 : role == 0.0 || role == 6.0 ? 0.85 : 1.25;
  gl_Position = mix(a, b, corner.x);
  gl_Position.xy += perpendicular * corner.y * halfWidth * 2.0 / viewport;
  // Resolve coincident section/surface ink without changing the source geometry.
  if (role > 3.5) gl_Position.z -= 0.0002;
  edge = corner.y;
  colorRole = int(role);
}`;

export const lineFragment = `#version 300 es
precision highp float;
in float edge;
flat in int colorRole;
uniform vec3 gridColor;
uniform vec3 xColor;
uniform vec3 yColor;
uniform vec3 zColor;
uniform bool planes;
uniform bool section;
uniform float context;
uniform vec3 sectionColor;
uniform vec3 planeColor;
out vec4 color;
void main() {
  if ((!section && colorRole > 3) || (section && colorRole < 4)) discard;
  if (!planes && colorRole == 0) discard;
  vec3 paint = colorRole == 1 ? xColor : colorRole == 2 ? yColor : colorRole == 3 ? zColor : gridColor;
  if (colorRole == 4) paint = sectionColor;
  if (colorRole == 5) paint = planeColor;
  if (colorRole == 7) paint = xColor;
  if (colorRole == 8) paint = zColor;
  float coverage = 1.0 - smoothstep(0.45, 1.0, abs(edge));
  float alpha = colorRole == 0 ? 0.34 : colorRole == 6 ? 0.28 : colorRole == 5 ? 0.3 + 0.2 * context : 1.0;
  color = vec4(paint, coverage * alpha);
}`;

export const planeVertex = `#version 300 es
precision highp float;
uniform mat4 projection;
uniform float sectionY;
void main() {
  vec2 corners[6] = vec2[6](vec2(-3,-3), vec2(3,-3), vec2(-3,3), vec2(-3,3), vec2(3,-3), vec2(3,3));
  vec2 point = corners[gl_VertexID];
  gl_Position = projection * vec4(point.x, sectionY, point.y, 1.0);
}`;
export const planeFragment = `#version 300 es
precision highp float;
uniform vec3 planeColor;
uniform float context;
out vec4 color;
void main() { color = vec4(planeColor, 0.09 * context); }
`;

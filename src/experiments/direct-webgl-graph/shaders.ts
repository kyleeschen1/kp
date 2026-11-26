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
out vec4 color;
void main() {
  vec3 n = normalize(normal);
  // The math-to-camera axis swap reverses winding; use the view vector for
  // two-sided lighting instead of relying on gl_FrontFacing's convention.
  if (dot(n, eye) < 0.0) n = -n;
  float diffuse = max(0.0, dot(n, normalize(vec3(-0.35, -0.55, 1.0))));
  float light = lit ? 0.43 + 0.57 * diffuse : 1.0;
  vec3 paint = pow(pow(surfaceColor, vec3(2.2)) * light, vec3(1.0 / 2.2));
  if (mesh) {
    vec2 distanceToLine = abs(fract(domain - 0.5) - 0.5) / max(fwidth(domain), vec2(0.00001));
    float coverage = 1.0 - smoothstep(0.35, 1.2, min(distanceToLine.x, distanceToLine.y));
    paint = mix(paint, inkColor, coverage * 0.38);
  }
  color = vec4(paint, 1.0);
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
out float edge;
flat out int colorRole;
void main() {
  vec2 corners[6] = vec2[6](vec2(0,-1), vec2(1,-1), vec2(0,1), vec2(0,1), vec2(1,-1), vec2(1,1));
  vec2 corner = corners[gl_VertexID];
  vec4 a = projection * vec4(start, 1.0);
  vec4 b = projection * vec4(end, 1.0);
  vec2 delta = (b.xy - a.xy) * viewport;
  vec2 perpendicular = vec2(-delta.y, delta.x) / max(length(delta), 0.0001);
  float halfWidth = role > 0.5 ? 1.25 : 0.85;
  gl_Position = mix(a, b, corner.x);
  gl_Position.xy += perpendicular * corner.y * halfWidth * 2.0 / viewport;
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
out vec4 color;
void main() {
  if (!planes && colorRole == 0) discard;
  vec3 paint = colorRole == 1 ? xColor : colorRole == 2 ? yColor : colorRole == 3 ? zColor : gridColor;
  float coverage = 1.0 - smoothstep(0.45, 1.0, abs(edge));
  color = vec4(paint, coverage * (colorRole == 0 ? 0.34 : 1.0));
}`;

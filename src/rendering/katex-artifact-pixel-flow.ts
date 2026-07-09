import type { EasingName } from "./equation-motion-plan.ts";
import type {
  KatexTextureAtlas,
  KatexTokenRect
} from "./katex-transition-types.ts";

export interface KatexArtifactPixelFlowEndpoint {
  readonly tokenId: string;
  readonly rect: KatexTokenRect;
}

export interface KatexArtifactPixelFlowPlan {
  readonly id: string;
  readonly kind: "artifact-pixel-flow";
  readonly source: KatexArtifactPixelFlowEndpoint;
  readonly target: KatexArtifactPixelFlowEndpoint;
  readonly particleCount: number;
  readonly start: number;
  readonly end: number;
  readonly easing: EasingName;
}

export interface KatexArtifactPixelFlowMaskPoint {
  readonly x: number;
  readonly y: number;
  readonly alpha: number;
}

export interface KatexArtifactPixelFlowParticle {
  readonly sourceX: number;
  readonly sourceY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly alpha: number;
  readonly seed: number;
}

export interface KatexArtifactPixelFlowFrameParticle {
  readonly x: number;
  readonly y: number;
  readonly opacity: number;
  readonly pointSize: number;
}

export interface KatexArtifactPixelFlowFrame {
  readonly progress: number;
  readonly particles: readonly KatexArtifactPixelFlowFrameParticle[];
}

export interface KatexArtifactPixelFlowRenderer {
  readonly particleCount: number;
  render(progress: number): void;
  dispose(): void;
}

interface KatexArtifactPixelFlowProgramInfo {
  readonly program: WebGLProgram;
  readonly sourceLocation: number;
  readonly targetLocation: number;
  readonly alphaLocation: number;
  readonly seedLocation: number;
  readonly resolutionLocation: WebGLUniformLocation;
  readonly progressLocation: WebGLUniformLocation;
  readonly pixelRatioLocation: WebGLUniformLocation;
  readonly colorLocation: WebGLUniformLocation;
}

const MASK_ALPHA_THRESHOLD = 12;
const PARTICLE_FLOATS = 6;

export function sampleKatexArtifactPixelFlowProgress(
  plan: KatexArtifactPixelFlowPlan,
  progress: number
): number {
  const clampedProgress = clamp01(progress);

  if (plan.end <= plan.start) {
    return clampedProgress >= plan.end ? 1 : 0;
  }

  const localProgress = clamp01(
    (clampedProgress - plan.start) / (plan.end - plan.start)
  );

  return roundUnitProgress(easedProgress(plan.easing, localProgress));
}

export function pairKatexArtifactPixelFlowPoints(
  sourcePoints: readonly KatexArtifactPixelFlowMaskPoint[],
  targetPoints: readonly KatexArtifactPixelFlowMaskPoint[],
  particleCount: number
): readonly KatexArtifactPixelFlowParticle[] {
  if (sourcePoints.length === 0) {
    throw new Error("Cannot create artifact pixel flow without source points.");
  }

  if (targetPoints.length === 0) {
    throw new Error("Cannot create artifact pixel flow without target points.");
  }

  const count = Math.max(0, Math.floor(particleCount));
  const particles: KatexArtifactPixelFlowParticle[] = [];

  for (let index = 0; index < count; index += 1) {
    const source = sourcePoints[(index * 1543) % sourcePoints.length];
    const target = targetPoints[(index * 2657) % targetPoints.length];

    if (source === undefined || target === undefined) {
      continue;
    }

    particles.push({
      sourceX: source.x,
      sourceY: source.y,
      targetX: target.x,
      targetY: target.y,
      alpha: Math.max(source.alpha, target.alpha),
      seed: seededUnit(index)
    });
  }

  return particles;
}

export function createKatexArtifactPixelFlowFrame(
  plan: KatexArtifactPixelFlowPlan,
  particles: readonly KatexArtifactPixelFlowParticle[],
  progress: number
): KatexArtifactPixelFlowFrame {
  const localProgress = sampleKatexArtifactPixelFlowProgress(plan, progress);
  const pointSize = 2.2 + Math.sin(localProgress * Math.PI) * 0.7;

  return {
    progress: localProgress,
    particles: particles.map((particle) => ({
      x: lerp(particle.sourceX, particle.targetX, localProgress),
      y: lerp(particle.sourceY, particle.targetY, localProgress),
      opacity: clamp01(particle.alpha),
      pointSize
    }))
  };
}

export function createKatexArtifactPixelFlowParticles(
  plan: KatexArtifactPixelFlowPlan,
  atlas: KatexTextureAtlas
): readonly KatexArtifactPixelFlowParticle[] {
  const sourcePoints = sampleKatexArtifactPixelFlowMaskPoints(
    atlas,
    plan.source,
    plan.particleCount
  );
  const targetPoints = sampleKatexArtifactPixelFlowMaskPoints(
    atlas,
    plan.target,
    plan.particleCount
  );

  return pairKatexArtifactPixelFlowPoints(
    sourcePoints,
    targetPoints,
    plan.particleCount
  );
}

export function sampleKatexArtifactPixelFlowMaskPoints(
  atlas: KatexTextureAtlas,
  endpoint: KatexArtifactPixelFlowEndpoint,
  maxPoints: number
): readonly KatexArtifactPixelFlowMaskPoint[] {
  const region = atlas.regions.get(endpoint.tokenId);

  if (region === undefined) {
    throw new Error(`Could not find atlas region for ${endpoint.tokenId}.`);
  }

  const page = atlas.pages[region.page];

  if (page === undefined) {
    throw new Error(`Could not find atlas page for ${endpoint.tokenId}.`);
  }

  const context = page.getContext("2d", { willReadFrequently: true });

  if (context === null) {
    throw new Error("Could not read artifact texture atlas pixels.");
  }

  const imageData = context.getImageData(
    region.x,
    region.y,
    region.width,
    region.height
  );
  const candidates: KatexArtifactPixelFlowMaskPoint[] = [];
  const pixelRatio = atlas.pixelRatio;

  for (let y = 0; y < region.height; y += 1) {
    for (let x = 0; x < region.width; x += 1) {
      const alpha = imageData.data[(y * region.width + x) * 4 + 3] ?? 0;

      if (alpha <= MASK_ALPHA_THRESHOLD) {
        continue;
      }

      candidates.push({
        x:
          (endpoint.rect.left +
            ((x + 0.5) / region.width) * endpoint.rect.width) *
          pixelRatio,
        y:
          (endpoint.rect.top +
            ((y + 0.5) / region.height) * endpoint.rect.height) *
          pixelRatio,
        alpha: alpha / 255
      });
    }
  }

  if (candidates.length === 0) {
    throw new Error(`Could not sample opaque pixels for ${endpoint.tokenId}.`);
  }

  return evenlySamplePoints(candidates, maxPoints);
}

export function createKatexArtifactPixelFlowRenderer(
  canvas: HTMLCanvasElement,
  plan: KatexArtifactPixelFlowPlan,
  atlas: KatexTextureAtlas
): KatexArtifactPixelFlowRenderer {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: true
  });

  if (gl === null) {
    throw new Error("WebGL is unavailable for artifact pixel flow.");
  }

  let programInfo: KatexArtifactPixelFlowProgramInfo | undefined;
  let particleBuffer: WebGLBuffer | null = null;
  let disposed = false;

  try {
    programInfo = createProgram(gl);
    particleBuffer = gl.createBuffer();

    if (particleBuffer === null) {
      throw new Error("Could not create a WebGL buffer for artifact pixel flow.");
    }

    const particles = createKatexArtifactPixelFlowParticles(plan, atlas);

    syncParticleBuffer(gl, particleBuffer, particles);
  } catch (error) {
    if (particleBuffer !== null) {
      gl.deleteBuffer(particleBuffer);
    }

    if (programInfo !== undefined) {
      gl.deleteProgram(programInfo.program);
    }

    throw error;
  }

  const particleCount = Math.max(0, Math.floor(plan.particleCount));

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return {
    particleCount,
    render(progress) {
      if (disposed) {
        return;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (particleCount <= 0) {
        return;
      }

      gl.useProgram(programInfo.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
      bindParticleAttributes(gl, programInfo);
      gl.uniform2f(programInfo.resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(
        programInfo.progressLocation,
        sampleKatexArtifactPixelFlowProgress(plan, progress)
      );
      gl.uniform1f(programInfo.pixelRatioLocation, atlas.pixelRatio);
      gl.uniform3f(programInfo.colorLocation, 31 / 255, 99 / 255, 113 / 255);
      gl.drawArrays(gl.POINTS, 0, particleCount);
    },
    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      gl.deleteBuffer(particleBuffer);
      gl.deleteProgram(programInfo.program);
    }
  };
}

function syncParticleBuffer(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  particles: readonly KatexArtifactPixelFlowParticle[]
): void {
  const data = new Float32Array(particles.length * PARTICLE_FLOATS);

  particles.forEach((particle, index) => {
    const offset = index * PARTICLE_FLOATS;

    data[offset] = particle.sourceX;
    data[offset + 1] = particle.sourceY;
    data[offset + 2] = particle.targetX;
    data[offset + 3] = particle.targetY;
    data[offset + 4] = particle.alpha;
    data[offset + 5] = particle.seed;
  });

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
}

function bindParticleAttributes(
  gl: WebGLRenderingContext,
  programInfo: KatexArtifactPixelFlowProgramInfo
): void {
  const stride = PARTICLE_FLOATS * Float32Array.BYTES_PER_ELEMENT;

  gl.enableVertexAttribArray(programInfo.sourceLocation);
  gl.vertexAttribPointer(programInfo.sourceLocation, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(programInfo.targetLocation);
  gl.vertexAttribPointer(
    programInfo.targetLocation,
    2,
    gl.FLOAT,
    false,
    stride,
    2 * Float32Array.BYTES_PER_ELEMENT
  );
  gl.enableVertexAttribArray(programInfo.alphaLocation);
  gl.vertexAttribPointer(
    programInfo.alphaLocation,
    1,
    gl.FLOAT,
    false,
    stride,
    4 * Float32Array.BYTES_PER_ELEMENT
  );
  gl.enableVertexAttribArray(programInfo.seedLocation);
  gl.vertexAttribPointer(
    programInfo.seedLocation,
    1,
    gl.FLOAT,
    false,
    stride,
    5 * Float32Array.BYTES_PER_ELEMENT
  );
}

function createProgram(
  gl: WebGLRenderingContext
): KatexArtifactPixelFlowProgramInfo {
  let vertexShader: WebGLShader | undefined;
  let fragmentShader: WebGLShader | undefined;

  try {
    vertexShader = compileShader(
      gl,
      gl.VERTEX_SHADER,
      `
        attribute vec2 a_source;
        attribute vec2 a_target;
        attribute float a_alpha;
        attribute float a_seed;
        uniform vec2 u_resolution;
        uniform float u_progress;
        uniform float u_pixelRatio;
        varying float v_alpha;

        void main() {
          vec2 delta = a_target - a_source;
          float distance = length(delta);
          vec2 normal = distance <= 0.0001
            ? vec2(0.0, 0.0)
            : normalize(vec2(-delta.y, delta.x));
          float spread = sin(u_progress * 3.14159265359) *
            (a_seed - 0.5) * 10.0 * u_pixelRatio;
          vec2 position = mix(a_source, a_target, u_progress) + normal * spread;
          vec2 zeroToOne = position / u_resolution;
          vec2 clipSpace = zeroToOne * 2.0 - 1.0;

          gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
          gl_PointSize = (2.2 + sin(u_progress * 3.14159265359) * 0.8) *
            u_pixelRatio;
          v_alpha = a_alpha;
        }
      `
    );
    fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        uniform vec3 u_color;
        varying float v_alpha;

        void main() {
          vec2 centeredPoint = gl_PointCoord - vec2(0.5);
          float radius = length(centeredPoint);

          if (radius > 0.5) {
            discard;
          }

          float edge = smoothstep(0.5, 0.12, radius);
          gl_FragColor = vec4(u_color, v_alpha * edge * 0.92);
        }
      `
    );
  } catch (error) {
    if (vertexShader !== undefined) {
      gl.deleteShader(vertexShader);
    }

    if (fragmentShader !== undefined) {
      gl.deleteShader(fragmentShader);
    }

    throw error;
  }

  const program = gl.createProgram();

  if (program === null) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Could not create a WebGL program for artifact pixel flow.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message =
      gl.getProgramInfoLog(program) ?? "Unknown artifact pixel flow link error.";

    gl.deleteProgram(program);
    throw new Error(message);
  }

  try {
    return {
      program,
      sourceLocation: getAttribLocation(gl, program, "a_source"),
      targetLocation: getAttribLocation(gl, program, "a_target"),
      alphaLocation: getAttribLocation(gl, program, "a_alpha"),
      seedLocation: getAttribLocation(gl, program, "a_seed"),
      resolutionLocation: getUniformLocation(gl, program, "u_resolution"),
      progressLocation: getUniformLocation(gl, program, "u_progress"),
      pixelRatioLocation: getUniformLocation(gl, program, "u_pixelRatio"),
      colorLocation: getUniformLocation(gl, program, "u_color")
    };
  } catch (error) {
    gl.deleteProgram(program);
    throw error;
  }
}

function evenlySamplePoints(
  points: readonly KatexArtifactPixelFlowMaskPoint[],
  maxPoints: number
): readonly KatexArtifactPixelFlowMaskPoint[] {
  const count = Math.max(0, Math.floor(maxPoints));

  if (points.length <= count) {
    return points;
  }

  if (count === 0) {
    return [];
  }

  const step = points.length / count;
  const sampled: KatexArtifactPixelFlowMaskPoint[] = [];

  for (let index = 0; index < count; index += 1) {
    const point = points[Math.min(points.length - 1, Math.floor(index * step))];

    if (point !== undefined) {
      sampled.push(point);
    }
  }

  return sampled;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);

  if (shader === null) {
    throw new Error("Could not create a WebGL shader for artifact pixel flow.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message =
      gl.getShaderInfoLog(shader) ?? "Unknown artifact pixel flow shader error.";

    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function getAttribLocation(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string
): number {
  const location = gl.getAttribLocation(program, name);

  if (location < 0) {
    throw new Error(`Could not find WebGL attribute ${name}.`);
  }

  return location;
}

function getUniformLocation(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string
): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);

  if (location === null) {
    throw new Error(`Could not find WebGL uniform ${name}.`);
  }

  return location;
}

function easedProgress(easing: EasingName, progress: number): number {
  switch (easing) {
    case "linear":
      return progress;
    case "ease-in":
      return progress * progress;
    case "ease-out":
      return 1 - (1 - progress) * (1 - progress);
    case "ease-in-out":
      return (1 - Math.cos(Math.PI * progress)) / 2;
    default:
      return assertNever(easing);
  }
}

function seededUnit(index: number): number {
  const value = Math.sin((index + 1) * 12.9898) * 43758.5453123;

  return value - Math.floor(value);
}

function lerp(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}

function roundUnitProgress(value: number): number {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled artifact pixel flow easing: ${value}`);
}

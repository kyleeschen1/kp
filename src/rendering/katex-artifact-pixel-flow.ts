import type { EasingName } from "./equation-motion-plan.ts";
import type {
  KatexTextureAtlas,
  KatexTokenRect
} from "./katex-transition-types.ts";

export interface KatexArtifactPixelFlowEndpoint {
  readonly tokenId: string;
  readonly rect: KatexTokenRect;
}

export interface KatexArtifactPixelFlowSourceMotion {
  readonly kind: "anticipate-collapse-emitter";
  readonly anticipationOffset: {
    readonly x: number;
    readonly y: number;
  };
  readonly anticipationEnd: number;
  readonly pauseEnd: number;
  readonly collapseEnd: number;
  readonly minScale: number;
}

export interface KatexArtifactPixelFlowPathMotion {
  readonly kind: "filament-stream";
  readonly formStart: number;
  readonly filamentWidth: number;
}

export interface KatexArtifactPixelFlowTargetMotion {
  readonly kind: "late-radical-form";
  readonly formStart: number;
}

export interface KatexArtifactPixelFlowPlan {
  readonly id: string;
  readonly kind: "artifact-pixel-flow";
  readonly source: KatexArtifactPixelFlowEndpoint;
  readonly target: KatexArtifactPixelFlowEndpoint;
  readonly particleCount: number;
  readonly sourceMotion?: KatexArtifactPixelFlowSourceMotion | undefined;
  readonly pathMotion?: KatexArtifactPixelFlowPathMotion | undefined;
  readonly targetMotion?: KatexArtifactPixelFlowTargetMotion | undefined;
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
  readonly sourceMotionEnabledLocation: WebGLUniformLocation;
  readonly sourceMidpointLocation: WebGLUniformLocation;
  readonly anticipationOffsetLocation: WebGLUniformLocation;
  readonly anticipationEndLocation: WebGLUniformLocation;
  readonly pauseEndLocation: WebGLUniformLocation;
  readonly collapseEndLocation: WebGLUniformLocation;
  readonly minScaleLocation: WebGLUniformLocation;
  readonly pathMotionEnabledLocation: WebGLUniformLocation;
  readonly formStartLocation: WebGLUniformLocation;
  readonly filamentWidthLocation: WebGLUniformLocation;
  readonly targetMotionEnabledLocation: WebGLUniformLocation;
  readonly targetMidpointLocation: WebGLUniformLocation;
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
  const basePointSize = 2.2 + Math.sin(localProgress * Math.PI) * 0.7;

  return {
    progress: localProgress,
    particles: particles.map((particle) => {
      const pose = sampleParticleFramePose(plan, particle, localProgress);

      return {
        x: pose.x,
        y: pose.y,
        opacity: clamp01(particle.alpha * pose.opacityScale),
        pointSize: basePointSize * pose.pointSizeScale
      };
    })
  };
}

function sampleParticleFramePose(
  plan: KatexArtifactPixelFlowPlan,
  particle: KatexArtifactPixelFlowParticle,
  progress: number
): {
  readonly x: number;
  readonly y: number;
  readonly pointSizeScale: number;
  readonly opacityScale: number;
} {
  // The source/path/target phases encode anticipation, compression, transfer,
  // and formation while keeping the same reversible scrub clock.
  const sourceMotion = plan.sourceMotion;
  const pathMotion = plan.pathMotion;
  const targetMotion = plan.targetMotion;

  if (
    sourceMotion === undefined &&
    pathMotion === undefined &&
    targetMotion === undefined
  ) {
    return {
      x: lerp(particle.sourceX, particle.targetX, progress),
      y: lerp(particle.sourceY, particle.targetY, progress),
      pointSizeScale: 1,
      opacityScale: 1
    };
  }

  const sourceMidpoint = {
    x: endpointMidpointX(plan.source),
    y: endpointMidpointY(plan.source)
  };
  const targetMidpoint = {
    x: endpointMidpointX(plan.target),
    y: endpointMidpointY(plan.target)
  };
  const sourceAnticipated = sourceMotion === undefined
    ? { x: particle.sourceX, y: particle.sourceY }
    : {
        x: particle.sourceX + sourceMotion.anticipationOffset.x,
        y: particle.sourceY + sourceMotion.anticipationOffset.y
      };

  if (sourceMotion !== undefined && progress <= sourceMotion.anticipationEnd) {
    const anticipationProgress =
      sourceMotion.anticipationEnd <= 0
        ? 1
        : clamp01(progress / sourceMotion.anticipationEnd);
    const easedAnticipationProgress = easedProgress(
      "ease-in-out",
      anticipationProgress
    );

    return {
      x: lerp(particle.sourceX, sourceAnticipated.x, easedAnticipationProgress),
      y: lerp(particle.sourceY, sourceAnticipated.y, easedAnticipationProgress),
      pointSizeScale: 1,
      opacityScale: 1
    };
  }

  if (sourceMotion !== undefined && progress <= sourceMotion.pauseEnd) {
    return {
      x: sourceAnticipated.x,
      y: sourceAnticipated.y,
      pointSizeScale: 1,
      opacityScale: 1
    };
  }

  if (sourceMotion !== undefined && progress <= sourceMotion.collapseEnd) {
    const collapseProgress =
      sourceMotion.collapseEnd <= sourceMotion.pauseEnd
        ? 1
        : clamp01(
            (progress - sourceMotion.pauseEnd) /
              (sourceMotion.collapseEnd - sourceMotion.pauseEnd)
          );
    const easedCollapseProgress = easedProgress("ease-in-out", collapseProgress);

    return {
      x: lerp(sourceAnticipated.x, sourceMidpoint.x, easedCollapseProgress),
      y: lerp(sourceAnticipated.y, sourceMidpoint.y, easedCollapseProgress),
      pointSizeScale: lerp(1, sourceMotion.minScale, easedCollapseProgress),
      opacityScale: lerp(1, sourceMotion.minScale, easedCollapseProgress)
    };
  }

  const streamStart = sourceMotion?.collapseEnd ?? 0;
  const formStart = pathMotion?.formStart ?? targetMotion?.formStart ?? 1;
  const streamSource = sourceMotion === undefined
    ? { x: particle.sourceX, y: particle.sourceY }
    : sourceMidpoint;
  const filamentPoint = sampleFilamentPoint(
    streamSource,
    targetMidpoint,
    particle.seed,
    pathMotion?.filamentWidth ?? 0
  );
  const sourcePointScale = sourceMotion?.minScale ?? 1;
  const filamentPointScale =
    sourceMotion === undefined ? 1 : sourceMotion.minScale * 0.55;

  if (progress <= formStart) {
    const streamProgress =
      formStart <= streamStart
        ? 1
        : clamp01((progress - streamStart) / (formStart - streamStart));
    const easedStreamProgress = easedProgress("ease-in-out", streamProgress);

    return {
      x: lerp(streamSource.x, filamentPoint.x, easedStreamProgress),
      y: lerp(streamSource.y, filamentPoint.y, easedStreamProgress),
      pointSizeScale: lerp(sourcePointScale, filamentPointScale, streamProgress),
      opacityScale: lerp(sourcePointScale, filamentPointScale, streamProgress)
    };
  }

  const formProgress =
    formStart >= 1
      ? 1
      : clamp01((progress - formStart) / (1 - formStart));
  const easedFormProgress = easedProgress("ease-in-out", formProgress);

  return {
    x: lerp(filamentPoint.x, particle.targetX, easedFormProgress),
    y: lerp(filamentPoint.y, particle.targetY, easedFormProgress),
    pointSizeScale: lerp(filamentPointScale, 1, easedFormProgress),
    opacityScale: lerp(filamentPointScale, 1, easedFormProgress)
  };
}

function sampleFilamentPoint(
  source: { readonly x: number; readonly y: number },
  target: { readonly x: number; readonly y: number },
  seed: number,
  filamentWidth: number
): { readonly x: number; readonly y: number } {
  const deltaX = target.x - source.x;
  const deltaY = target.y - source.y;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance <= 0.0001 || filamentWidth <= 0) {
    return target;
  }

  const normalX = -deltaY / distance;
  const normalY = deltaX / distance;
  const offset = (seed - 0.5) * filamentWidth;

  return {
    x: target.x + normalX * offset,
    y: target.y + normalY * offset
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
      gl.uniform1f(
        programInfo.sourceMotionEnabledLocation,
        plan.sourceMotion === undefined ? 0 : 1
      );
      gl.uniform2f(
        programInfo.sourceMidpointLocation,
        endpointMidpointX(plan.source, atlas.pixelRatio),
        endpointMidpointY(plan.source, atlas.pixelRatio)
      );
      gl.uniform2f(
        programInfo.anticipationOffsetLocation,
        (plan.sourceMotion?.anticipationOffset.x ?? 0) * atlas.pixelRatio,
        (plan.sourceMotion?.anticipationOffset.y ?? 0) * atlas.pixelRatio
      );
      gl.uniform1f(
        programInfo.anticipationEndLocation,
        plan.sourceMotion?.anticipationEnd ?? 0
      );
      gl.uniform1f(
        programInfo.pauseEndLocation,
        plan.sourceMotion?.pauseEnd ?? 0
      );
      gl.uniform1f(
        programInfo.collapseEndLocation,
        plan.sourceMotion?.collapseEnd ?? 0
      );
      gl.uniform1f(
        programInfo.minScaleLocation,
        plan.sourceMotion?.minScale ?? 1
      );
      gl.uniform1f(
        programInfo.pathMotionEnabledLocation,
        plan.pathMotion === undefined ? 0 : 1
      );
      gl.uniform1f(
        programInfo.formStartLocation,
        plan.pathMotion?.formStart ?? plan.targetMotion?.formStart ?? 1
      );
      gl.uniform1f(
        programInfo.filamentWidthLocation,
        (plan.pathMotion?.filamentWidth ?? 0) * atlas.pixelRatio
      );
      gl.uniform1f(
        programInfo.targetMotionEnabledLocation,
        plan.targetMotion === undefined ? 0 : 1
      );
      gl.uniform2f(
        programInfo.targetMidpointLocation,
        endpointMidpointX(plan.target, atlas.pixelRatio),
        endpointMidpointY(plan.target, atlas.pixelRatio)
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
        uniform float u_sourceMotionEnabled;
        uniform vec2 u_sourceMidpoint;
        uniform vec2 u_anticipationOffset;
        uniform float u_anticipationEnd;
        uniform float u_pauseEnd;
        uniform float u_collapseEnd;
        uniform float u_minScale;
        uniform float u_pathMotionEnabled;
        uniform float u_formStart;
        uniform float u_filamentWidth;
        uniform float u_targetMotionEnabled;
        uniform vec2 u_targetMidpoint;
        uniform float u_pixelRatio;
        varying float v_alpha;
        varying float v_pointSizeScale;

        float clampUnit(float value) {
          return clamp(value, 0.0, 1.0);
        }

        float easeInOut(float value) {
          return (1.0 - cos(value * 3.14159265359)) / 2.0;
        }

        float streamStart() {
          return u_sourceMotionEnabled < 0.5 ? 0.0 : u_collapseEnd;
        }

        float streamEnd() {
          return u_pathMotionEnabled < 0.5 && u_targetMotionEnabled < 0.5
            ? 1.0
            : u_formStart;
        }

        vec2 streamSource() {
          return u_sourceMotionEnabled < 0.5 ? a_source : u_sourceMidpoint;
        }

        vec2 anticipatedSource() {
          return a_source + u_anticipationOffset;
        }

        vec2 filamentTarget() {
          vec2 delta = u_targetMidpoint - streamSource();
          float distance = length(delta);
          vec2 normal = distance <= 0.0001
            ? vec2(0.0, 0.0)
            : normalize(vec2(-delta.y, delta.x));

          return u_targetMidpoint + normal * ((a_seed - 0.5) * u_filamentWidth);
        }

        vec2 samplePosition() {
          if (u_sourceMotionEnabled < 0.5 && u_pathMotionEnabled < 0.5) {
            return mix(a_source, a_target, u_progress);
          }

          if (u_sourceMotionEnabled > 0.5 && u_progress <= u_anticipationEnd) {
            float anticipationProgress = u_anticipationEnd <= 0.0001
              ? 1.0
              : clampUnit(u_progress / u_anticipationEnd);

            return mix(a_source, anticipatedSource(), easeInOut(anticipationProgress));
          }

          if (u_sourceMotionEnabled > 0.5 && u_progress <= u_pauseEnd) {
            return anticipatedSource();
          }

          if (u_sourceMotionEnabled > 0.5 && u_progress <= u_collapseEnd) {
            float collapseProgress = u_collapseEnd <= u_pauseEnd
              ? 1.0
              : clampUnit(
                (u_progress - u_pauseEnd) / (u_collapseEnd - u_pauseEnd)
              );

            return mix(anticipatedSource(), u_sourceMidpoint, easeInOut(collapseProgress));
          }

          if (u_progress <= streamEnd()) {
            float flowProgress = streamEnd() <= streamStart()
              ? 1.0
              : clampUnit((u_progress - streamStart()) / (streamEnd() - streamStart()));

            return mix(streamSource(), filamentTarget(), easeInOut(flowProgress));
          }

          float formProgress = streamEnd() >= 1.0
            ? 1.0
            : clampUnit((u_progress - streamEnd()) / (1.0 - streamEnd()));

          return mix(filamentTarget(), a_target, easeInOut(formProgress));
        }

        float filamentScale() {
          return u_sourceMotionEnabled < 0.5 ? 1.0 : u_minScale * 0.55;
        }

        float samplePointSizeScale() {
          if (u_sourceMotionEnabled < 0.5 && u_pathMotionEnabled < 0.5) {
            return 1.0;
          }

          if (u_sourceMotionEnabled > 0.5 && u_progress <= u_pauseEnd) {
            return 1.0;
          }

          if (u_sourceMotionEnabled > 0.5 && u_progress <= u_collapseEnd) {
            float collapseProgress = u_collapseEnd <= u_pauseEnd
              ? 1.0
              : clampUnit(
                (u_progress - u_pauseEnd) / (u_collapseEnd - u_pauseEnd)
              );

            return mix(1.0, u_minScale, easeInOut(collapseProgress));
          }

          if (u_progress <= streamEnd()) {
            float streamProgress = streamEnd() <= streamStart()
              ? 1.0
              : clampUnit((u_progress - streamStart()) / (streamEnd() - streamStart()));

            return mix(u_minScale, filamentScale(), streamProgress);
          }

          float formProgress = streamEnd() >= 1.0
            ? 1.0
            : clampUnit((u_progress - streamEnd()) / (1.0 - streamEnd()));

          return mix(filamentScale(), 1.0, easeInOut(formProgress));
        }

        void main() {
          vec2 position = samplePosition();
          float pointSizeScale = samplePointSizeScale();
          vec2 zeroToOne = position / u_resolution;
          vec2 clipSpace = zeroToOne * 2.0 - 1.0;

          gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
          float pointSize =
            (2.2 + sin(u_progress * 3.14159265359) * 0.8 + a_seed * 0.12) *
            pointSizeScale *
            u_pixelRatio;
          gl_PointSize = max(pointSize, 1.2 * u_pixelRatio);
          v_alpha = a_alpha * pointSizeScale;
          v_pointSizeScale = pointSizeScale;
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
        varying float v_pointSizeScale;

        void main() {
          vec2 centeredPoint = gl_PointCoord - vec2(0.5);
          float radius = length(centeredPoint);

          if (radius > 0.5) {
            discard;
          }

          float edge = smoothstep(0.5, 0.12, radius);
          gl_FragColor = vec4(u_color, v_alpha * edge);
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
      sourceMotionEnabledLocation: getUniformLocation(
        gl,
        program,
        "u_sourceMotionEnabled"
      ),
      sourceMidpointLocation: getUniformLocation(gl, program, "u_sourceMidpoint"),
      anticipationOffsetLocation: getUniformLocation(
        gl,
        program,
        "u_anticipationOffset"
      ),
      anticipationEndLocation: getUniformLocation(
        gl,
        program,
        "u_anticipationEnd"
      ),
      pauseEndLocation: getUniformLocation(gl, program, "u_pauseEnd"),
      collapseEndLocation: getUniformLocation(gl, program, "u_collapseEnd"),
      minScaleLocation: getUniformLocation(gl, program, "u_minScale"),
      pathMotionEnabledLocation: getUniformLocation(
        gl,
        program,
        "u_pathMotionEnabled"
      ),
      formStartLocation: getUniformLocation(gl, program, "u_formStart"),
      filamentWidthLocation: getUniformLocation(
        gl,
        program,
        "u_filamentWidth"
      ),
      targetMotionEnabledLocation: getUniformLocation(
        gl,
        program,
        "u_targetMotionEnabled"
      ),
      targetMidpointLocation: getUniformLocation(gl, program, "u_targetMidpoint"),
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

function endpointMidpointX(
  endpoint: KatexArtifactPixelFlowEndpoint,
  scale = 1
): number {
  return (endpoint.rect.left + endpoint.rect.width / 2) * scale;
}

function endpointMidpointY(
  endpoint: KatexArtifactPixelFlowEndpoint,
  scale = 1
): number {
  return (endpoint.rect.top + endpoint.rect.height / 2) * scale;
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

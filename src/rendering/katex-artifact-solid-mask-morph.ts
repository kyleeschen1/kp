import type { EasingName } from "./equation-motion-plan.ts";
import type {
  KatexAtlasRegion,
  KatexTextureAtlas,
  KatexTokenRect
} from "./katex-transition-types.ts";

export interface KatexArtifactSolidMaskMorphEndpoint {
  readonly tokenId: string;
  readonly rect: KatexTokenRect;
}

export interface KatexArtifactSolidMaskMorphPlan {
  readonly id: string;
  readonly kind: "artifact-solid-mask-morph";
  readonly source: KatexArtifactSolidMaskMorphEndpoint;
  readonly target: KatexArtifactSolidMaskMorphEndpoint;
  readonly start: number;
  readonly end: number;
  readonly easing: EasingName;
  readonly maximumDistancePx: number;
  readonly edgeSoftnessPx: number;
  readonly boundsPaddingPx: number;
  readonly sourceTravelFraction: number;
  readonly sourceArcHeightPx: number;
  readonly shapeLeadFraction: number;
  readonly targetGrowthOriginXFraction: number;
  readonly targetGrowthOriginYFraction: number;
  readonly targetGrowthSoftnessPx: number;
  readonly bridgeExpansionPx: number;
  readonly endpointBlendFraction: number;
  readonly color: {
    readonly red: number;
    readonly green: number;
    readonly blue: number;
  };
}

export interface KatexArtifactSolidMaskMorphRenderer {
  readonly bounds: KatexTokenRect;
  render(progress: number): void;
  dispose(): void;
}

interface SolidMaskProgramInfo {
  readonly program: WebGLProgram;
  readonly positionLocation: number;
  readonly texCoordLocation: number;
  readonly resolutionLocation: WebGLUniformLocation;
  readonly fieldTextureLocation: WebGLUniformLocation;
  readonly progressLocation: WebGLUniformLocation;
  readonly maximumDistanceLocation: WebGLUniformLocation;
  readonly edgeSoftnessLocation: WebGLUniformLocation;
  readonly sourceShiftLocation: WebGLUniformLocation;
  readonly sourceArcOffsetLocation: WebGLUniformLocation;
  readonly arcProgressLocation: WebGLUniformLocation;
  readonly shapeProgressLocation: WebGLUniformLocation;
  readonly fieldSizeLocation: WebGLUniformLocation;
  readonly targetGrowthOriginLocation: WebGLUniformLocation;
  readonly targetGrowthMaximumRadiusLocation: WebGLUniformLocation;
  readonly targetGrowthSoftnessLocation: WebGLUniformLocation;
  readonly bridgeExpansionLocation: WebGLUniformLocation;
  readonly endpointBlendLocation: WebGLUniformLocation;
  readonly colorLocation: WebGLUniformLocation;
}

export function sampleKatexArtifactSolidMaskMorphProgress(
  plan: Pick<
    KatexArtifactSolidMaskMorphPlan,
    "start" | "end" | "easing"
  >,
  progress: number
): number {
  const clampedProgress = clamp01(progress);
  if (plan.end <= plan.start) {
    return clampedProgress >= plan.end ? 1 : 0;
  }
  const localProgress = clamp01(
    (clampedProgress - plan.start) / (plan.end - plan.start)
  );
  return easedProgress(plan.easing, localProgress);
}

export function sampleKatexArtifactSolidMaskMorphFrame(
  plan: Pick<
    KatexArtifactSolidMaskMorphPlan,
    "start" | "end" | "easing" | "shapeLeadFraction"
  >,
  progress: number
): {
  readonly travelProgress: number;
  readonly shapeProgress: number;
  readonly arcProgress: number;
} {
  const travelProgress = sampleKatexArtifactSolidMaskMorphProgress(
    plan,
    progress
  );
  const arcProgress = quadraticArcProgress(travelProgress);
  return {
    travelProgress,
    // Shape formation leads position without changing either exact endpoint.
    shapeProgress: clamp01(
      travelProgress + plan.shapeLeadFraction * arcProgress
    ),
    arcProgress
  };
}

export function createSignedDistanceField(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  maximumDistance: number
): Float32Array {
  if (
    width <= 0 ||
    height <= 0 ||
    alpha.length !== width * height ||
    !Number.isFinite(maximumDistance) ||
    maximumDistance <= 0
  ) {
    throw new Error("Solid-mask morph requires valid mask dimensions.");
  }

  const foregroundSeed = new Float64Array(alpha.length);
  const backgroundSeed = new Float64Array(alpha.length);
  let foregroundCount = 0;

  for (let index = 0; index < alpha.length; index += 1) {
    const foreground = (alpha[index] ?? 0) >= 128;
    foregroundSeed[index] = foreground ? 0 : distanceInfinity;
    backgroundSeed[index] = foreground ? distanceInfinity : 0;
    if (foreground) foregroundCount += 1;
  }

  if (foregroundCount === 0 || foregroundCount === alpha.length) {
    throw new Error("Solid-mask morph requires both ink and transparent pixels.");
  }

  const distanceToForeground = squaredEuclideanDistanceTransform(
    foregroundSeed,
    width,
    height
  );
  const distanceToBackground = squaredEuclideanDistanceTransform(
    backgroundSeed,
    width,
    height
  );
  const field = new Float32Array(alpha.length);

  for (let index = 0; index < field.length; index += 1) {
    const signedDistance =
      Math.sqrt(distanceToForeground[index] ?? distanceInfinity) -
      Math.sqrt(distanceToBackground[index] ?? distanceInfinity);
    field[index] = Math.max(
      -maximumDistance,
      Math.min(maximumDistance, signedDistance)
    );
  }

  return field;
}

export function createKatexArtifactSolidMaskMorphRenderer(
  canvas: HTMLCanvasElement,
  plan: KatexArtifactSolidMaskMorphPlan,
  atlas: KatexTextureAtlas
): KatexArtifactSolidMaskMorphRenderer {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: false
  });
  if (gl === null) {
    throw new Error("WebGL is unavailable for the KaTeX solid-mask morph.");
  }

  const fields = createSolidMaskFields(plan, atlas);
  const programInfo = createProgram(gl);
  const texture = createFieldTexture(
    gl,
    fields.width,
    fields.height,
    fields.pixels
  );
  const buffer = gl.createBuffer();
  if (buffer === null) {
    gl.deleteTexture(texture);
    gl.deleteProgram(programInfo.program);
    throw new Error("Could not create the solid-mask morph buffer.");
  }

  const pixelRatio = atlas.pixelRatio;
  const vertices = new Float32Array([
    fields.bounds.left * pixelRatio,
    fields.bounds.top * pixelRatio,
    0,
    0,
    (fields.bounds.left + fields.bounds.width) * pixelRatio,
    fields.bounds.top * pixelRatio,
    1,
    0,
    fields.bounds.left * pixelRatio,
    (fields.bounds.top + fields.bounds.height) * pixelRatio,
    0,
    1,
    (fields.bounds.left + fields.bounds.width) * pixelRatio,
    (fields.bounds.top + fields.bounds.height) * pixelRatio,
    1,
    1
  ]);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const sourceCenter = rectCenter(plan.source.rect);
  const targetCenter = rectCenter(plan.target.rect);
  const sourceShift = {
    x: (
      (targetCenter.x - sourceCenter.x) /
      Math.max(1, fields.bounds.width)
    ) * plan.sourceTravelFraction,
    y: (
      (targetCenter.y - sourceCenter.y) /
      Math.max(1, fields.bounds.height)
    ) * plan.sourceTravelFraction
  };
  const sourceToTarget = {
    x: targetCenter.x - sourceCenter.x,
    y: targetCenter.y - sourceCenter.y
  };
  const sourceToTargetLength = Math.hypot(
    sourceToTarget.x,
    sourceToTarget.y
  );
  const sourceArcOffset = sourceToTargetLength <= 0
    ? { x: 0, y: 0 }
    : {
        x: (
          -sourceToTarget.y / sourceToTargetLength *
          plan.sourceArcHeightPx
        ) / Math.max(1, fields.bounds.width),
        y: (
          sourceToTarget.x / sourceToTargetLength *
          plan.sourceArcHeightPx
        ) / Math.max(1, fields.bounds.height)
      };
  const targetGrowth = resolveTargetGrowthGeometry({
    target: plan.target.rect,
    bounds: fields.bounds,
    originXFraction: plan.targetGrowthOriginXFraction,
    originYFraction: plan.targetGrowthOriginYFraction
  });
  let disposed = false;

  return {
    bounds: fields.bounds,
    render(progress) {
      if (disposed) return;
      const frame = sampleKatexArtifactSolidMaskMorphFrame(
        plan,
        progress
      );

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(programInfo.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      bindVertexAttributes(gl, programInfo);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(programInfo.fieldTextureLocation, 0);
      gl.uniform2f(
        programInfo.resolutionLocation,
        canvas.width,
        canvas.height
      );
      gl.uniform1f(
        programInfo.progressLocation,
        frame.travelProgress
      );
      gl.uniform1f(
        programInfo.shapeProgressLocation,
        frame.shapeProgress
      );
      gl.uniform1f(
        programInfo.arcProgressLocation,
        frame.arcProgress
      );
      gl.uniform2f(
        programInfo.fieldSizeLocation,
        fields.bounds.width,
        fields.bounds.height
      );
      gl.uniform2f(
        programInfo.targetGrowthOriginLocation,
        targetGrowth.originX,
        targetGrowth.originY
      );
      gl.uniform1f(
        programInfo.targetGrowthMaximumRadiusLocation,
        targetGrowth.maximumRadius
      );
      gl.uniform1f(
        programInfo.targetGrowthSoftnessLocation,
        plan.targetGrowthSoftnessPx
      );
      gl.uniform1f(
        programInfo.maximumDistanceLocation,
        plan.maximumDistancePx * pixelRatio
      );
      gl.uniform1f(
        programInfo.edgeSoftnessLocation,
        plan.edgeSoftnessPx * pixelRatio
      );
      gl.uniform2f(
        programInfo.sourceShiftLocation,
        sourceShift.x,
        sourceShift.y
      );
      gl.uniform2f(
        programInfo.sourceArcOffsetLocation,
        sourceArcOffset.x,
        sourceArcOffset.y
      );
      gl.uniform1f(
        programInfo.bridgeExpansionLocation,
        plan.bridgeExpansionPx * pixelRatio
      );
      gl.uniform1f(
        programInfo.endpointBlendLocation,
        plan.endpointBlendFraction
      );
      gl.uniform3f(
        programInfo.colorLocation,
        plan.color.red,
        plan.color.green,
        plan.color.blue
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      gl.deleteBuffer(buffer);
      gl.deleteTexture(texture);
      gl.deleteProgram(programInfo.program);
    }
  };
}

function createSolidMaskFields(
  plan: KatexArtifactSolidMaskMorphPlan,
  atlas: KatexTextureAtlas
): {
  readonly bounds: KatexTokenRect;
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
} {
  const padding = plan.maximumDistancePx + plan.boundsPaddingPx;
  const bounds = unionRects(plan.source.rect, plan.target.rect, padding);
  const width = Math.max(1, Math.ceil(bounds.width * atlas.pixelRatio));
  const height = Math.max(1, Math.ceil(bounds.height * atlas.pixelRatio));
  const sourceAlpha = captureEndpointAlpha(
    plan.source,
    bounds,
    width,
    height,
    atlas
  );
  const targetAlpha = captureEndpointAlpha(
    plan.target,
    bounds,
    width,
    height,
    atlas
  );
  const maximumDistance = plan.maximumDistancePx * atlas.pixelRatio;
  const sourceField = createSignedDistanceField(
    sourceAlpha,
    width,
    height,
    maximumDistance
  );
  const targetField = createSignedDistanceField(
    targetAlpha,
    width,
    height,
    maximumDistance
  );
  const pixels = new Uint8Array(width * height * 4);

  for (let index = 0; index < sourceField.length; index += 1) {
    const pixelOffset = index * 4;
    pixels[pixelOffset] = encodeDistance(
      sourceField[index] ?? maximumDistance,
      maximumDistance
    );
    pixels[pixelOffset + 1] = encodeDistance(
      targetField[index] ?? maximumDistance,
      maximumDistance
    );
    pixels[pixelOffset + 2] = sourceAlpha[index] ?? 0;
    pixels[pixelOffset + 3] = targetAlpha[index] ?? 0;
  }

  return { bounds, width, height, pixels };
}

function captureEndpointAlpha(
  endpoint: KatexArtifactSolidMaskMorphEndpoint,
  bounds: KatexTokenRect,
  width: number,
  height: number,
  atlas: KatexTextureAtlas
): Uint8ClampedArray {
  const region = requiredRegion(atlas, endpoint.tokenId);
  const page = atlas.pages[region.page];
  if (page === undefined) {
    throw new Error(`Missing atlas page for ${endpoint.tokenId}.`);
  }
  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const context = mask.getContext("2d");
  if (context === null) {
    throw new Error("Could not create a solid-mask capture context.");
  }
  const pixelRatio = atlas.pixelRatio;
  context.drawImage(
    page,
    region.x,
    region.y,
    region.width,
    region.height,
    (endpoint.rect.left - bounds.left) * pixelRatio,
    (endpoint.rect.top - bounds.top) * pixelRatio,
    endpoint.rect.width * pixelRatio,
    endpoint.rect.height * pixelRatio
  );
  const rgba = context.getImageData(0, 0, width, height).data;
  const alpha = new Uint8ClampedArray(width * height);
  for (let index = 0; index < alpha.length; index += 1) {
    alpha[index] = rgba[index * 4 + 3] ?? 0;
  }
  return alpha;
}

function requiredRegion(
  atlas: KatexTextureAtlas,
  tokenId: string
): KatexAtlasRegion {
  const region = atlas.regions.get(tokenId);
  if (region === undefined) {
    throw new Error(`Missing solid-mask atlas region for ${tokenId}.`);
  }
  return region;
}

const distanceInfinity = 1_000_000_000;

function squaredEuclideanDistanceTransform(
  seeds: Float64Array,
  width: number,
  height: number
): Float64Array {
  const vertical = new Float64Array(seeds.length);
  const output = new Float64Array(seeds.length);
  const inputLine = new Float64Array(Math.max(width, height));
  const outputLine = new Float64Array(Math.max(width, height));

  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      inputLine[y] = seeds[y * width + x] ?? distanceInfinity;
    }
    distanceTransformLine(inputLine, outputLine, height);
    for (let y = 0; y < height; y += 1) {
      vertical[y * width + x] = outputLine[y] ?? distanceInfinity;
    }
  }

  for (let y = 0; y < height; y += 1) {
    const offset = y * width;
    for (let x = 0; x < width; x += 1) {
      inputLine[x] = vertical[offset + x] ?? distanceInfinity;
    }
    distanceTransformLine(inputLine, outputLine, width);
    for (let x = 0; x < width; x += 1) {
      output[offset + x] = outputLine[x] ?? distanceInfinity;
    }
  }

  return output;
}

function distanceTransformLine(
  input: Float64Array,
  output: Float64Array,
  length: number
): void {
  const locations = new Int32Array(length);
  const boundaries = new Float64Array(length + 1);
  let envelopeIndex = 0;
  locations[0] = 0;
  boundaries[0] = Number.NEGATIVE_INFINITY;
  boundaries[1] = Number.POSITIVE_INFINITY;

  for (let position = 1; position < length; position += 1) {
    let intersection = parabolaIntersection(
      input,
      position,
      locations[envelopeIndex] ?? 0
    );
    while (intersection <= (boundaries[envelopeIndex] ?? 0)) {
      envelopeIndex -= 1;
      intersection = parabolaIntersection(
        input,
        position,
        locations[envelopeIndex] ?? 0
      );
    }
    envelopeIndex += 1;
    locations[envelopeIndex] = position;
    boundaries[envelopeIndex] = intersection;
    boundaries[envelopeIndex + 1] = Number.POSITIVE_INFINITY;
  }

  envelopeIndex = 0;
  for (let position = 0; position < length; position += 1) {
    while ((boundaries[envelopeIndex + 1] ?? 0) < position) {
      envelopeIndex += 1;
    }
    const location = locations[envelopeIndex] ?? 0;
    const delta = position - location;
    output[position] = delta * delta + (input[location] ?? distanceInfinity);
  }
}

function parabolaIntersection(
  input: Float64Array,
  right: number,
  left: number
): number {
  return (
    ((input[right] ?? distanceInfinity) + right * right) -
    ((input[left] ?? distanceInfinity) + left * left)
  ) / (2 * right - 2 * left);
}

function encodeDistance(distance: number, maximumDistance: number): number {
  return Math.round(
    clamp01((distance / maximumDistance + 1) / 2) * 255
  );
}

function createFieldTexture(
  gl: WebGLRenderingContext,
  width: number,
  height: number,
  pixels: Uint8Array
): WebGLTexture {
  const texture = gl.createTexture();
  if (texture === null) {
    throw new Error("Could not create the solid-mask field texture.");
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixels
  );
  return texture;
}

function createProgram(gl: WebGLRenderingContext): SolidMaskProgramInfo {
  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;
      void main() {
        vec2 unit = a_position / u_resolution;
        vec2 clip = unit * 2.0 - 1.0;
        gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `
  );
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      uniform sampler2D u_fieldTexture;
      uniform float u_progress;
      uniform float u_shapeProgress;
      uniform float u_arcProgress;
      uniform vec2 u_fieldSize;
      uniform vec2 u_targetGrowthOrigin;
      uniform float u_targetGrowthMaximumRadius;
      uniform float u_targetGrowthSoftness;
      uniform float u_maximumDistance;
      uniform float u_edgeSoftness;
      uniform vec2 u_sourceShift;
      uniform vec2 u_sourceArcOffset;
      uniform float u_bridgeExpansion;
      uniform float u_endpointBlend;
      uniform vec3 u_color;
      varying vec2 v_texCoord;
      void main() {
        vec2 sourceUv = v_texCoord -
          u_sourceShift * u_progress -
          u_sourceArcOffset * u_arcProgress;
        vec4 sourceSample = texture2D(u_fieldTexture, sourceUv);
        vec4 targetSample = texture2D(u_fieldTexture, v_texCoord);
        float sourceDistance = (sourceSample.r * 2.0 - 1.0) *
          u_maximumDistance;
        float targetDistance = (targetSample.g * 2.0 - 1.0) *
          u_maximumDistance;
        float morphDistance = mix(
          sourceDistance,
          targetDistance,
          u_shapeProgress
        ) - u_bridgeExpansion * sin(3.14159265 * u_shapeProgress);
        float fieldAlpha = 1.0 - smoothstep(
          -u_edgeSoftness,
          u_edgeSoftness,
          morphDistance
        );
        float sourceEndpoint = 1.0 - smoothstep(
          0.0,
          u_endpointBlend,
          u_shapeProgress
        );
        float targetEndpoint = smoothstep(
          1.0 - u_endpointBlend,
          1.0,
          u_shapeProgress
        );
        float alpha = mix(fieldAlpha, sourceSample.b, sourceEndpoint);
        float targetGrowthDistance = distance(
          v_texCoord * u_fieldSize,
          u_targetGrowthOrigin
        );
        float targetGrowthRadius =
          u_targetGrowthMaximumRadius * u_shapeProgress;
        float targetGrowthMask = 1.0 - smoothstep(
          targetGrowthRadius,
          targetGrowthRadius + u_targetGrowthSoftness,
          targetGrowthDistance
        );
        float targetGrowthAuthority = smoothstep(
          0.0,
          u_endpointBlend,
          u_shapeProgress
        );
        alpha = max(
          alpha,
          targetSample.a * targetGrowthMask * targetGrowthAuthority
        );
        alpha = mix(alpha, targetSample.a, targetEndpoint);
        gl_FragColor = vec4(u_color, alpha);
      }
    `
  );
  const program = gl.createProgram();
  if (program === null) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Could not create the solid-mask morph program.");
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ??
      "Unknown solid-mask WebGL program link error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return {
    program,
    positionLocation: requiredAttribute(gl, program, "a_position"),
    texCoordLocation: requiredAttribute(gl, program, "a_texCoord"),
    resolutionLocation: requiredUniform(gl, program, "u_resolution"),
    fieldTextureLocation: requiredUniform(gl, program, "u_fieldTexture"),
    progressLocation: requiredUniform(gl, program, "u_progress"),
    shapeProgressLocation: requiredUniform(gl, program, "u_shapeProgress"),
    arcProgressLocation: requiredUniform(gl, program, "u_arcProgress"),
    fieldSizeLocation: requiredUniform(gl, program, "u_fieldSize"),
    targetGrowthOriginLocation: requiredUniform(
      gl,
      program,
      "u_targetGrowthOrigin"
    ),
    targetGrowthMaximumRadiusLocation: requiredUniform(
      gl,
      program,
      "u_targetGrowthMaximumRadius"
    ),
    targetGrowthSoftnessLocation: requiredUniform(
      gl,
      program,
      "u_targetGrowthSoftness"
    ),
    maximumDistanceLocation: requiredUniform(
      gl,
      program,
      "u_maximumDistance"
    ),
    edgeSoftnessLocation: requiredUniform(gl, program, "u_edgeSoftness"),
    sourceShiftLocation: requiredUniform(gl, program, "u_sourceShift"),
    sourceArcOffsetLocation: requiredUniform(
      gl,
      program,
      "u_sourceArcOffset"
    ),
    bridgeExpansionLocation: requiredUniform(
      gl,
      program,
      "u_bridgeExpansion"
    ),
    endpointBlendLocation: requiredUniform(
      gl,
      program,
      "u_endpointBlend"
    ),
    colorLocation: requiredUniform(gl, program, "u_color")
  };
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (shader === null) {
    throw new Error("Could not create a solid-mask morph shader.");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ??
      "Unknown solid-mask shader compile error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function bindVertexAttributes(
  gl: WebGLRenderingContext,
  programInfo: SolidMaskProgramInfo
): void {
  const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
  gl.enableVertexAttribArray(programInfo.positionLocation);
  gl.vertexAttribPointer(
    programInfo.positionLocation,
    2,
    gl.FLOAT,
    false,
    stride,
    0
  );
  gl.enableVertexAttribArray(programInfo.texCoordLocation);
  gl.vertexAttribPointer(
    programInfo.texCoordLocation,
    2,
    gl.FLOAT,
    false,
    stride,
    2 * Float32Array.BYTES_PER_ELEMENT
  );
}

function requiredAttribute(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string
): number {
  const location = gl.getAttribLocation(program, name);
  if (location < 0) {
    throw new Error(`Missing solid-mask shader attribute ${name}.`);
  }
  return location;
}

function requiredUniform(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string
): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);
  if (location === null) {
    throw new Error(`Missing solid-mask shader uniform ${name}.`);
  }
  return location;
}

function unionRects(
  source: KatexTokenRect,
  target: KatexTokenRect,
  padding: number
): KatexTokenRect {
  const left = Math.min(source.left, target.left) - padding;
  const top = Math.min(source.top, target.top) - padding;
  const right = Math.max(
    source.left + source.width,
    target.left + target.width
  ) + padding;
  const bottom = Math.max(
    source.top + source.height,
    target.top + target.height
  ) + padding;
  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
}

function rectCenter(rect: KatexTokenRect): { readonly x: number; readonly y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
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
      return progress * progress * (3 - 2 * progress);
    default:
      return assertNever(easing);
  }
}

function quadraticArcProgress(progress: number): number {
  return 4 * progress * (1 - progress);
}

function resolveTargetGrowthGeometry(input: {
  readonly target: KatexTokenRect;
  readonly bounds: KatexTokenRect;
  readonly originXFraction: number;
  readonly originYFraction: number;
}): {
  readonly originX: number;
  readonly originY: number;
  readonly maximumRadius: number;
} {
  const absoluteOrigin = {
    x: input.target.left + input.target.width * input.originXFraction,
    y: input.target.top + input.target.height * input.originYFraction
  };
  const corners = [
    { x: input.target.left, y: input.target.top },
    { x: input.target.left + input.target.width, y: input.target.top },
    { x: input.target.left, y: input.target.top + input.target.height },
    {
      x: input.target.left + input.target.width,
      y: input.target.top + input.target.height
    }
  ];
  return {
    originX: absoluteOrigin.x - input.bounds.left,
    originY: absoluteOrigin.y - input.bounds.top,
    maximumRadius: Math.max(
      ...corners.map((corner) => Math.hypot(
        corner.x - absoluteOrigin.x,
        corner.y - absoluteOrigin.y
      ))
    )
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function assertNever(value: never): never {
  throw new Error(`Unhandled solid-mask morph easing ${value}.`);
}

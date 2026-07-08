export interface EquationCancelParticleFrame {
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;
  readonly origin: {
    readonly x: number;
    readonly y: number;
  };
  readonly progress: number;
  readonly opacity: number;
  readonly particleCount: number;
}

export interface EquationCancelParticleRenderer {
  render(frame: EquationCancelParticleFrame): void;
  dispose(): void;
}

interface EquationCancelParticleProgramInfo {
  readonly program: WebGLProgram;
  readonly indexLocation: number;
  readonly resolutionLocation: WebGLUniformLocation;
  readonly originLocation: WebGLUniformLocation;
  readonly progressLocation: WebGLUniformLocation;
  readonly opacityLocation: WebGLUniformLocation;
  readonly pixelRatioLocation: WebGLUniformLocation;
  readonly colorLocation: WebGLUniformLocation;
}

export function createEquationCancelParticleRenderer(
  canvas: HTMLCanvasElement
): EquationCancelParticleRenderer {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: true
  });

  if (gl === null) {
    throw new Error("WebGL is unavailable for equation cancellation particles.");
  }

  let programInfo: EquationCancelParticleProgramInfo | undefined;
  let indexBuffer: WebGLBuffer | null = null;
  let indexBufferCount = 0;
  let disposed = false;

  try {
    programInfo = createProgram(gl);
    indexBuffer = gl.createBuffer();

    if (indexBuffer === null) {
      throw new Error("Could not create a WebGL buffer for cancellation particles.");
    }
  } catch (error) {
    if (indexBuffer !== null) {
      gl.deleteBuffer(indexBuffer);
    }

    if (programInfo !== undefined) {
      gl.deleteProgram(programInfo.program);
    }

    throw error;
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return {
    render(frame) {
      if (disposed) {
        return;
      }

      gl.viewport(0, 0, frame.width, frame.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (frame.opacity <= 0 || frame.particleCount <= 0) {
        return;
      }

      syncIndexBuffer(gl, indexBuffer, frame.particleCount, indexBufferCount);
      indexBufferCount = frame.particleCount;

      gl.useProgram(programInfo.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
      gl.enableVertexAttribArray(programInfo.indexLocation);
      gl.vertexAttribPointer(programInfo.indexLocation, 1, gl.FLOAT, false, 0, 0);
      gl.uniform2f(programInfo.resolutionLocation, frame.width, frame.height);
      gl.uniform2f(programInfo.originLocation, frame.origin.x, frame.origin.y);
      gl.uniform1f(programInfo.progressLocation, clamp(frame.progress, 0, 1));
      gl.uniform1f(programInfo.opacityLocation, clamp(frame.opacity, 0, 1));
      gl.uniform1f(programInfo.pixelRatioLocation, frame.pixelRatio);
      gl.uniform3f(programInfo.colorLocation, 31 / 255, 99 / 255, 113 / 255);
      gl.drawArrays(gl.POINTS, 0, frame.particleCount);
    },
    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      gl.deleteBuffer(indexBuffer);
      gl.deleteProgram(programInfo.program);
    }
  };
}

function syncIndexBuffer(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  particleCount: number,
  existingParticleCount: number
): void {
  if (particleCount === existingParticleCount) {
    return;
  }

  const indices = new Float32Array(particleCount);

  for (let index = 0; index < particleCount; index += 1) {
    indices[index] = index;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

function createProgram(
  gl: WebGLRenderingContext
): EquationCancelParticleProgramInfo {
  let vertexShader: WebGLShader | undefined;
  let fragmentShader: WebGLShader | undefined;

  try {
    vertexShader = compileShader(
      gl,
      gl.VERTEX_SHADER,
      `
        attribute float a_index;
        uniform vec2 u_resolution;
        uniform vec2 u_origin;
        uniform float u_progress;
        uniform float u_pixelRatio;
        varying float v_alphaShape;

        float random(float value) {
          return fract(sin(value) * 43758.5453123);
        }

        void main() {
          float angle = random(a_index * 12.9898 + 78.233) * 6.28318530718;
          float spread = (9.0 + mod(a_index, 6.0) * 3.2) * u_pixelRatio;
          float drift = spread * (1.0 - pow(1.0 - u_progress, 2.0));
          vec2 position = u_origin + vec2(cos(angle), sin(angle)) * drift;
          vec2 zeroToOne = position / u_resolution;
          vec2 clipSpace = zeroToOne * 2.0 - 1.0;

          gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
          gl_PointSize = mix(4.5, 1.4, u_progress) * u_pixelRatio;
          v_alphaShape = 1.0;
        }
      `
    );
    fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        uniform float u_opacity;
        uniform vec3 u_color;
        varying float v_alphaShape;

        void main() {
          vec2 centeredPoint = gl_PointCoord - vec2(0.5);
          float radius = length(centeredPoint);

          if (radius > 0.5) {
            discard;
          }

          float edge = smoothstep(0.5, 0.18, radius);
          gl_FragColor = vec4(u_color, u_opacity * edge * v_alphaShape);
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
    throw new Error("Could not create a WebGL program for cancellation particles.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message =
      gl.getProgramInfoLog(program) ?? "Unknown cancellation particle link error.";

    gl.deleteProgram(program);
    throw new Error(message);
  }

  try {
    return {
      program,
      indexLocation: getAttribLocation(gl, program, "a_index"),
      resolutionLocation: getUniformLocation(gl, program, "u_resolution"),
      originLocation: getUniformLocation(gl, program, "u_origin"),
      progressLocation: getUniformLocation(gl, program, "u_progress"),
      opacityLocation: getUniformLocation(gl, program, "u_opacity"),
      pixelRatioLocation: getUniformLocation(gl, program, "u_pixelRatio"),
      colorLocation: getUniformLocation(gl, program, "u_color")
    };
  } catch (error) {
    gl.deleteProgram(program);
    throw error;
  }
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);

  if (shader === null) {
    throw new Error("Could not create a WebGL shader for cancellation particles.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message =
      gl.getShaderInfoLog(shader) ?? "Unknown cancellation particle shader error.";

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

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

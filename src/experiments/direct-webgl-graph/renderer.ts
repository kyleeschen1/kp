import { acquireKpWebglContextLease } from "../../rendering/webgl-context-lease-pool.ts";
import { createGridGeometry, createPilotProjection, createSaddleGeometry, type PilotView } from "./model.ts";
import { lineFragment, lineVertex, surfaceFragment, surfaceVertex } from "./shaders.ts";

export type RGB = readonly [number, number, number];
export interface PilotColors {
  readonly background: RGB; readonly ink: RGB; readonly grid: RGB;
  readonly surface: RGB; readonly x: RGB; readonly y: RGB; readonly z: RGB;
}
export interface PilotRenderer {
  draw(view: PilotView, width: number, height: number, colors: PilotColors): void;
  inspect(): { frames: number; uploads: number; vertices: number; triangles: number; bufferBytes: number; submitP95Ms: number };
  dispose(): void;
}
export type PilotRendererResult = { status: "ready"; renderer: PilotRenderer } | { status: "unavailable"; reason: string };

export function createPilotRenderer(canvas: HTMLCanvasElement, onLost: () => void): PilotRendererResult {
  let dead = false;
  const acquired = acquireKpWebglContextLease({
    canvas, contextKind: "webgl2",
    attributes: { antialias: true, alpha: false, depth: true, powerPreference: "low-power" },
    onContextLost: () => { dead = true; onLost(); }
  });
  if (acquired.status !== "acquired") return { status: "unavailable", reason: acquired.status === "capacity"
    ? "The two-context graphics budget is in use. Close the comparison and retry."
    : "WebGL 2 is unavailable in this browser. The static mathematical view is still available." };
  const gl = acquired.lease.context;
  if (!("createVertexArray" in gl)) {
    acquired.lease.release();
    return { status: "unavailable", reason: "This experiment requires WebGL 2." };
  }
  const programs: WebGLProgram[] = [], shaders: WebGLShader[] = [];
  const buffers: WebGLBuffer[] = [], arrays: WebGLVertexArrayObject[] = [];
  const destroy = () => {
    if (!gl.isContextLost()) {
      arrays.forEach((item) => gl.deleteVertexArray(item));
      buffers.forEach((item) => gl.deleteBuffer(item));
      programs.forEach((item) => gl.deleteProgram(item));
      shaders.forEach((item) => gl.deleteShader(item));
    }
    acquired.lease.release();
    dead = true;
  };
  try {
    const shader = (type: number, source: string) => {
      const item = gl.createShader(type);
      if (!item) throw new Error("Cannot allocate a GPU shader.");
      shaders.push(item); gl.shaderSource(item, source); gl.compileShader(item);
      if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(item) ?? "Shader compilation failed.");
      return item;
    };
    const program = (vertex: string, fragment: string) => {
      const item = gl.createProgram();
      if (!item) throw new Error("Cannot allocate a GPU program.");
      programs.push(item); gl.attachShader(item, shader(gl.VERTEX_SHADER, vertex));
      gl.attachShader(item, shader(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(item);
      if (!gl.getProgramParameter(item, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(item) ?? "Shader linking failed.");
      return item;
    };
    const vao = () => {
      const item = gl.createVertexArray();
      if (!item) throw new Error("Cannot allocate a GPU vertex array.");
      arrays.push(item); gl.bindVertexArray(item); return item;
    };
    const upload = (target: number, data: Float32Array | Uint16Array) => {
      const item = gl.createBuffer();
      if (!item) throw new Error("Cannot allocate a GPU buffer.");
      buffers.push(item); gl.bindBuffer(target, item); gl.bufferData(target, data, gl.STATIC_DRAW);
    };
    const attr = (location: number, size: number, stride: number, offset: number, divisor = 0) => {
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
      gl.vertexAttribDivisor(location, divisor);
    };
    const surfaceProgram = program(surfaceVertex, surfaceFragment);
    const lineProgram = program(lineVertex, lineFragment);
    const geometry = createSaddleGeometry();
    const grid = createGridGeometry();
    const surfaceArray = vao();
    upload(gl.ARRAY_BUFFER, geometry.vertices); upload(gl.ELEMENT_ARRAY_BUFFER, geometry.indices);
    attr(0, 3, 20, 0); attr(1, 2, 20, 12);
    const lineArray = vao(); upload(gl.ARRAY_BUFFER, grid);
    attr(0, 3, 28, 0, 1); attr(1, 3, 28, 12, 1); attr(2, 1, 28, 24, 1);
    gl.bindVertexArray(null);
    const uniforms = (owner: WebGLProgram, names: readonly string[]) => new Map(names.map((name) => {
      const location = gl.getUniformLocation(owner, name);
      if (location === null) throw new Error(`Missing shader uniform: ${name}`);
      return [name, location];
    }));
    const surface = uniforms(surfaceProgram, ["projection", "heightScale", "surfaceColor", "inkColor", "eye", "lit", "mesh"]);
    const lines = uniforms(lineProgram, ["projection", "viewport", "gridColor", "xColor", "yColor", "zColor", "planes"]);
    const rgb = (location: WebGLUniformLocation, value: RGB) => gl.uniform3f(location, ...value);
    const costs: number[] = [];
    let frames = 0;
    const bufferBytes = geometry.vertices.byteLength + geometry.indices.byteLength + grid.byteLength;
    return { status: "ready", renderer: {
      draw(view, width, height, colors) {
        if (dead) return;
        const start = performance.now();
        const projection = createPilotProjection(view, width, height);
        const ratio = Math.min(window.devicePixelRatio || 1, 2, 4096 / Math.max(width, height));
        const pixelWidth = Math.max(1, Math.round(width * ratio));
        const pixelHeight = Math.max(1, Math.round(height * ratio));
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
          canvas.width = pixelWidth; canvas.height = pixelHeight;
        }
        gl.viewport(0, 0, pixelWidth, pixelHeight);
        gl.clearColor(...colors.background, 1); gl.depthMask(true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        if (view.example === "saddle") {
          gl.useProgram(surfaceProgram); gl.bindVertexArray(surfaceArray);
          gl.uniformMatrix4fv(surface.get("projection")!, false, projection.matrix);
          gl.uniform1f(surface.get("heightScale")!, 4 / view.denominator);
          rgb(surface.get("surfaceColor")!, colors.surface); rgb(surface.get("inkColor")!, colors.ink);
          gl.uniform3fv(surface.get("eye")!, projection.eye);
          gl.uniform1i(surface.get("lit")!, Number(view.lit)); gl.uniform1i(surface.get("mesh")!, Number(view.mesh));
          gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
        }
        gl.useProgram(lineProgram); gl.bindVertexArray(lineArray);
        gl.uniformMatrix4fv(lines.get("projection")!, false, projection.matrix);
        gl.uniform2f(lines.get("viewport")!, width, height);
        gl.uniform1i(lines.get("planes")!, Number(view.example === "grid" || view.planes));
        rgb(lines.get("gridColor")!, colors.grid); rgb(lines.get("xColor")!, colors.x);
        rgb(lines.get("yColor")!, colors.y); rgb(lines.get("zColor")!, colors.z);
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, grid.length / 7);
        gl.depthMask(true); gl.bindVertexArray(null);
        frames += 1; costs.push(performance.now() - start);
        if (costs.length > 240) costs.shift();
      },
      inspect() {
        const sorted = [...costs].sort((a, b) => a - b);
        return { frames, uploads: buffers.length, vertices: geometry.vertexCount,
          triangles: geometry.indices.length / 3, bufferBytes,
          submitP95Ms: sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? 0 };
      },
      dispose: destroy
    } };
  } catch (error) {
    destroy();
    return { status: "unavailable", reason: error instanceof Error ? error.message : "GPU initialization failed." };
  }
}

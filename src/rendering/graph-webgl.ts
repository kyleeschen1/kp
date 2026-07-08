export const GRAPH_3D_WEBGL_RENDERER_KIND = "graph-3d-webgl";

export interface Graph3DWebGLRendererDescriptor {
  backend: "three";
  kind: typeof GRAPH_3D_WEBGL_RENDERER_KIND;
  status: "available";
}

export function createGraph3DWebGLRendererDescriptor(): Graph3DWebGLRendererDescriptor {
  return {
    backend: "three",
    kind: GRAPH_3D_WEBGL_RENDERER_KIND,
    status: "available"
  };
}

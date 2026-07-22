export interface KpReaderRuntimeRouteDescriptor {
  readonly route: `/reader/${string}/`;
  readonly documentId: string;
  readonly documentVersion: string;
}

/** Binds compiled page identity to the canonical route used by URL codecs. */
export function createKpReaderRuntimeRouteDescriptor(input: {
  readonly href: string | URL;
  readonly documentId: string;
  readonly documentVersion: string;
}): KpReaderRuntimeRouteDescriptor {
  const route = new URL(input.href).pathname;
  if (!route.startsWith("/reader/") || !route.endsWith("/")) {
    throw new Error(`Reader runtime route ${route} must start with /reader/ and end with /.`);
  }
  if (input.documentId.trim() === "" || input.documentVersion.trim() === "") {
    throw new Error("Reader runtime route requires document identity and version.");
  }
  return {
    route: route as `/reader/${string}/`,
    documentId: input.documentId,
    documentVersion: input.documentVersion
  };
}

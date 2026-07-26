export interface KpGlyphReviewGalleryMode {
  markReady(): void;
}

/**
 * Gallery framing is presentation-only and stays outside the experiment
 * controller so review embedding cannot expand compositor lifecycle authority.
 */
export function createKpGlyphReviewGalleryMode(
  searchParams: URLSearchParams,
  root: HTMLElement
): KpGlyphReviewGalleryMode {
  const artifact = searchParams.get("reviewGallery");
  const enabled =
    artifact === "fraction" ||
    artifact === "cohort" ||
    artifact === "radical";
  if (enabled) root.dataset["kpReviewGalleryArtifact"] = artifact;
  return Object.freeze({
    markReady() {
      if (enabled) root.dataset["kpReviewGalleryReady"] = "true";
    }
  });
}

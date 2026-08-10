import {
  defineKpCanonicalEquationHostProvenance
} from "../canonical-equation-host-provenance.ts";

export const fractionCompositionCanonicalHostProvenance =
  defineKpCanonicalEquationHostProvenance({
    kind: "kp-canonical-equation-host-provenance",
    schemaVersion: "kp.canonical-equation-host-provenance.v1",
    animationId: "animation.fraction-composition.two-thirds-solve",
    representation: {
      id:
        "learner-experience.fraction-composition-scroll-lesson." +
        "animation.fraction-composition.two-thirds-solve",
      kind: "reader",
      href: "/reader/fraction-composition/",
      role: "canonical-host"
    },
    runtime: {
      family: "reader-canonical-equation",
      lessonDescriptorId: "fraction-composition"
    }
  });

import { runKpSemanticStateScaleProbe } from
  "../fixtures/semantic-state-authoring/scale-probe.ts";

const result = runKpSemanticStateScaleProbe();
const concreteLeaves: number = result.counts.concreteLeaves;
const derivedLeaves: number = result.counts.derivedLeaves;
const cacheHits: number = result.evaluation.cache.hits;
void concreteLeaves;
void derivedLeaves;
void cacheHits;

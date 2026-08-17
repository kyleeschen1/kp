import "./semantic-animation-workbench.css";

import type { KpEditorAnimationDescriptor } from "./animation-descriptor.ts";
import {
  createKpSemanticAnimationWorkbenchIndex
} from "./semantic-animation-workbench-data.ts";
import {
  queryKpSemanticAnimationWorkbench
} from "./semantic-animation-workbench-query.ts";
import {
  resolveKpAnimationWorkbenchRepresentation
} from "./semantic-animation-workbench-representation-selection.ts";
import {
  projectKpWorkbenchRoadmapAnimationLinks
} from "./semantic-animation-workbench-roadmap-links.ts";
import {
  listKpWorkbenchRoadmapTopics,
  queryKpWorkbenchRoadmap,
  type KpWorkbenchRoadmapQuery
} from "./semantic-animation-workbench-roadmap-query.ts";
import {
  projectKpWorkbenchRoadmap
} from "./semantic-animation-workbench-roadmap.ts";
import {
  discoverKpActiveApprovedPlan
} from "./semantic-animation-workbench-roadmap-source.ts";
import type {
  KpSemanticAnimationWorkbenchRouteState
} from "./semantic-animation-workbench-route.ts";
import {
  renderKpSemanticAnimationWorkbenchResults,
  renderKpSemanticAnimationWorkbenchShell
} from "./semantic-animation-workbench-shell.ts";

export const kpSemanticAnimationWorkbenchIndex =
  createKpSemanticAnimationWorkbenchIndex();
const roadmap = projectKpWorkbenchRoadmap(discoverKpActiveApprovedPlan());
const roadmapAnimationLinks = projectKpWorkbenchRoadmapAnimationLinks({
  roadmap,
  index: kpSemanticAnimationWorkbenchIndex
});

export function renderKpSemanticAnimationWorkbenchView(input: {
  readonly route: KpSemanticAnimationWorkbenchRouteState;
  readonly descriptors: readonly KpEditorAnimationDescriptor[];
}): {
  readonly html: string;
  readonly selectedEntry:
    | (typeof kpSemanticAnimationWorkbenchIndex.entries)[number]
    | undefined;
} {
  const results = queryKpSemanticAnimationWorkbench(
    kpSemanticAnimationWorkbenchIndex,
    input.route.query
  );
  const selectedEntry =
    kpSemanticAnimationWorkbenchIndex.entries.find(
      ({ identity }) => identity.animationId === input.route.animationId
    ) ?? results[0]?.entry;
  const selectedAnimationId = selectedEntry?.identity.animationId;
  const representationSelection = selectedEntry === undefined
    ? {}
    : resolveKpAnimationWorkbenchRepresentation({
        entry: selectedEntry,
        ...(input.route.representationId === undefined
          ? {}
          : { requestedRepresentationId: input.route.representationId }),
        descriptors: input.descriptors
      });
  const roadmapQuery = toRoadmapQuery(input.route);
  return {
    html: renderKpSemanticAnimationWorkbenchShell({
      query: input.route.query,
      results,
      ...(selectedAnimationId === undefined ? {} : { selectedAnimationId }),
      ...(representationSelection.descriptor === undefined
        ? {}
        : { selectedDescriptor: representationSelection.descriptor }),
      ...(representationSelection.relationship === undefined
        ? {}
        : {
            selectedRepresentationId:
              representationSelection.relationship.representationId
          }),
      ...(representationSelection.playbackRelationship === undefined
        ? {}
        : {
            selectedPlaybackRepresentationId:
              representationSelection.playbackRelationship.representationId
          }),
      roadmap,
      roadmapRows: queryKpWorkbenchRoadmap(roadmap.rows, roadmapQuery),
      roadmapQuery,
      roadmapTopics: listKpWorkbenchRoadmapTopics(roadmap.rows),
      roadmapAnimationLinks
    }),
    selectedEntry
  };
}

export function renderKpSemanticAnimationWorkbenchQueryResults(
  query: string,
  selectedAnimationId: string | undefined
): string {
  return renderKpSemanticAnimationWorkbenchResults(
    queryKpSemanticAnimationWorkbench(kpSemanticAnimationWorkbenchIndex, query),
    selectedAnimationId
  );
}

function toRoadmapQuery(
  route: KpSemanticAnimationWorkbenchRouteState
): KpWorkbenchRoadmapQuery {
  return {
    sortBy: route.roadmap.sortBy,
    direction: route.roadmap.direction,
    ...(route.roadmap.topic === undefined
      ? {}
      : { topics: [route.roadmap.topic] }),
    ...(route.roadmap.horizon === undefined
      ? {}
      : { horizons: [route.roadmap.horizon] }),
    ...(route.roadmap.state === undefined
      ? {}
      : { states: [route.roadmap.state] })
  };
}

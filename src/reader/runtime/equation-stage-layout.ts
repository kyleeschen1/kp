export type KpEquationStageLayoutPolicy =
  | "single-row"
  | "semantic-two-row-stage";

export interface KpEquationStageRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface KpEquationStageMeasurementIdentity {
  readonly revision: number;
  readonly coordinateSpaceId: string;
}

export function createKpEquationStageMeasurementIdentity(input: {
  readonly revision: number;
  readonly coordinateSpaceId: string;
}): KpEquationStageMeasurementIdentity {
  if (!Number.isInteger(input.revision) || input.revision < 0) {
    throw new Error("Equation stage measurement revision must be a non-negative integer.");
  }
  if (input.coordinateSpaceId.trim() === "") {
    throw new Error("Equation stage coordinate-space id must be non-empty.");
  }
  return Object.freeze({
    revision: input.revision,
    coordinateSpaceId: input.coordinateSpaceId
  });
}

export function assertKpEquationStageMeasurementIdentity(
  expected: KpEquationStageMeasurementIdentity,
  actual: KpEquationStageMeasurementIdentity,
  label: string
): void {
  if (
    expected.revision !== actual.revision ||
    expected.coordinateSpaceId !== actual.coordinateSpaceId
  ) {
    throw new Error(
      `${label} measurement identity mismatch: expected ` +
      `${expected.coordinateSpaceId}@${expected.revision}, received ` +
      `${actual.coordinateSpaceId}@${actual.revision}.`
    );
  }
}

export interface KpEquationStageRowIntent<
  TRole extends string = string
> {
  readonly id: string;
  readonly envelopeIds: readonly string[];
  readonly role: TRole;
}

export interface KpEquationStagePhaseIntent<
  TRow extends KpEquationStageRowIntent = KpEquationStageRowIntent
> {
  readonly nodeId: string;
  readonly policy: KpEquationStageLayoutPolicy;
  readonly rows: readonly TRow[];
  readonly lineChangeReason?: "viewport-semantic-staging" | undefined;
}

export interface KpEquationStageLayoutIntent<
  TPhase extends KpEquationStagePhaseIntent = KpEquationStagePhaseIntent
> {
  readonly executionState: "intent";
  readonly phases: readonly TPhase[];
  readonly geometryAuthority: "native-measurement";
  readonly operationSpecificCoordinates: false;
}

export interface KpEquationStageMeasuredEnvelope {
  readonly id: string;
  readonly transitionId: string;
  readonly endpointObjectId: string;
  readonly memberOwnerIds: readonly string[];
  readonly rect: KpEquationStageRect;
  readonly baselineY: number;
  readonly emSizePx: number;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
}

export interface KpEquationStageEnvelopeDefinition {
  readonly id: string;
  readonly transitionId: string;
  readonly endpointObjectId: string;
  readonly memberOwnerIds: readonly string[];
}

export interface KpEquationStageEnvelopeObservation {
  readonly id: string;
  readonly transitionId: string;
  readonly endpointObjectId: string;
  readonly memberOwnerIds: readonly string[];
  readonly rect: KpEquationStageRect;
  readonly baselineY: number;
  readonly emSizePx: number;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
}

export interface KpCertifiedEquationStageRow {
  readonly id: string;
  readonly envelopeIds: readonly string[];
  readonly rect: KpEquationStageRect;
  readonly translateX: number;
  readonly translateY: number;
  readonly baselinePolicy: "preserve-native";
}

const measuredEquationStageInputAuthority: unique symbol =
  Symbol("kp.measured-equation-stage-input");
const certifiedEquationStageLayoutAuthority: unique symbol =
  Symbol("kp.certified-equation-stage-layout");
const appliedEquationStageLayoutAuthority: unique symbol =
  Symbol("kp.applied-equation-stage-layout");

export interface KpMeasuredEquationStageInput {
  readonly schemaVersion: "kp.measured-equation-stage-input.v1";
  readonly executionState: "measured";
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly intent: KpEquationStagePhaseIntent;
  readonly envelopes: readonly KpEquationStageMeasuredEnvelope[];
  readonly [measuredEquationStageInputAuthority]: true;
}

export interface KpCertifiedEquationStageLayout {
  readonly schemaVersion: "kp.certified-equation-stage-layout.v1";
  readonly executionState: "certified";
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly policy: KpEquationStageLayoutPolicy;
  readonly measuredInput: KpMeasuredEquationStageInput;
  readonly rows: readonly KpCertifiedEquationStageRow[];
  readonly stageBounds: KpEquationStageRect;
  readonly minimumGutterPx: number;
  readonly [certifiedEquationStageLayoutAuthority]: true;
}

export interface KpAppliedEquationStageLayout<
  TCertificate extends KpCertifiedEquationStageLayout =
    KpCertifiedEquationStageLayout
> {
  readonly schemaVersion: "kp.applied-equation-stage-layout.v1";
  readonly executionState: "applied";
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly certificate: TCertificate;
  readonly appliedRowIds: readonly string[];
  readonly appliedNativeMemberIds: readonly string[];
  readonly nativeRows: readonly KpEquationStageNativeRowBinding[];
  readonly applicationId: string;
  readonly [appliedEquationStageLayoutAuthority]: true;
}

export interface KpEquationStageNativeMemberBinding {
  readonly ownerId: string;
  readonly element: HTMLElement;
}

export interface KpEquationStageNativeRowBinding {
  readonly rowId: string;
  readonly members: readonly KpEquationStageNativeMemberBinding[];
}

export function compileKpMeasuredEquationStageInput(input: {
  readonly intent: KpEquationStagePhaseIntent;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly definitions: readonly KpEquationStageEnvelopeDefinition[];
  readonly observations: readonly KpEquationStageEnvelopeObservation[];
}): KpMeasuredEquationStageInput {
  const measurementIdentity =
    createKpEquationStageMeasurementIdentity(input.measurementIdentity);
  assertNonEmptyId(input.intent.nodeId, "Equation stage phase");
  const rowIds = input.intent.rows.map(({ id }) => id);
  assertUniqueIds(rowIds, "Equation stage row");
  const requestedEnvelopeIds = input.intent.rows.flatMap((row) => {
    if (row.envelopeIds.length === 0) {
      throw new Error(`Equation stage row ${row.id} has no envelopes.`);
    }
    return row.envelopeIds;
  });
  assertUniqueIds(requestedEnvelopeIds, "Equation stage row envelope");
  const definitions = indexEnvelopes(input.definitions, "definition");
  const observations = indexEnvelopes(input.observations, "observation");
  const envelopes = requestedEnvelopeIds.map((id) => {
    const definition = definitions.get(id);
    if (definition === undefined) {
      throw new Error(`Equation stage envelope ${id} has no semantic definition.`);
    }
    const observation = observations.get(id);
    if (observation === undefined) {
      throw new Error(`Equation stage envelope ${id} has no native observation.`);
    }
    if (
      definition.transitionId !== input.intent.nodeId ||
      observation.transitionId !== input.intent.nodeId
    ) {
      throw new Error(
        `Equation stage envelope ${id} crosses transition ${input.intent.nodeId}.`
      );
    }
    if (definition.endpointObjectId !== observation.endpointObjectId) {
      throw new Error(`Equation stage envelope ${id} changed endpoint ownership.`);
    }
    const expectedMembers = validatedMemberIds(
      definition.memberOwnerIds,
      `Equation stage envelope ${id} definition`
    );
    const observedMembers = validatedMemberIds(
      observation.memberOwnerIds,
      `Equation stage envelope ${id} observation`
    );
    if (!sameMembers(expectedMembers, observedMembers)) {
      throw new Error(
        `Equation stage envelope ${id} is partially active or has foreign members.`
      );
    }
    assertKpEquationStageMeasurementIdentity(
      measurementIdentity,
      observation.measurementIdentity,
      `Equation stage envelope ${id}`
    );
    assertStageRect(observation.rect, `Equation stage envelope ${id}`);
    if (
      !Number.isFinite(observation.baselineY) ||
      !Number.isFinite(observation.emSizePx) ||
      observation.emSizePx <= 0
    ) {
      throw new Error(
        `Equation stage envelope ${id} must have finite baseline and positive em size.`
      );
    }
    return Object.freeze({
      id,
      transitionId: input.intent.nodeId,
      endpointObjectId: definition.endpointObjectId,
      memberOwnerIds: Object.freeze([...expectedMembers]),
      rect: Object.freeze({ ...observation.rect }),
      baselineY: observation.baselineY,
      emSizePx: observation.emSizePx,
      measurementIdentity
    });
  });

  return Object.freeze({
    schemaVersion: "kp.measured-equation-stage-input.v1" as const,
    executionState: "measured" as const,
    measurementIdentity,
    intent: input.intent,
    envelopes: Object.freeze(envelopes),
    [measuredEquationStageInputAuthority]: true as const
  });
}

export function certifyKpSingleRowEquationStageLayout(
  measuredInput: KpMeasuredEquationStageInput
): KpCertifiedEquationStageLayout {
  if (
    measuredInput.intent.policy !== "single-row" ||
    measuredInput.intent.rows.length !== 1
  ) {
    throw new Error(
      "Single-row equation stage certification requires exactly one declared row."
    );
  }
  const intentRow = measuredInput.intent.rows[0]!;
  const envelopesById = new Map(
    measuredInput.envelopes.map((envelope) => [envelope.id, envelope])
  );
  const rowEnvelopes = intentRow.envelopeIds.map((id) => {
    const envelope = envelopesById.get(id);
    if (envelope === undefined) {
      throw new Error(`Single-row equation stage is missing envelope ${id}.`);
    }
    assertKpEquationStageMeasurementIdentity(
      measuredInput.measurementIdentity,
      envelope.measurementIdentity,
      `Single-row equation stage envelope ${id}`
    );
    return envelope;
  });
  const rect = unionStageRects(rowEnvelopes.map(({ rect }) => rect));
  const row = Object.freeze({
    id: intentRow.id,
    envelopeIds: Object.freeze([...intentRow.envelopeIds]),
    rect,
    // One shared zero transform retains every endpoint's native KaTeX
    // baseline and internal spacing while still producing certified occupancy.
    translateX: 0,
    translateY: 0,
    baselinePolicy: "preserve-native" as const
  });
  return Object.freeze({
    schemaVersion: "kp.certified-equation-stage-layout.v1" as const,
    executionState: "certified" as const,
    measurementIdentity: measuredInput.measurementIdentity,
    policy: "single-row" as const,
    measuredInput,
    rows: Object.freeze([row]),
    stageBounds: rect,
    minimumGutterPx: 0,
    [certifiedEquationStageLayoutAuthority]: true as const
  });
}

export function certifyKpTwoRowEquationStageLayout(
  measuredInput: KpMeasuredEquationStageInput
): KpCertifiedEquationStageLayout {
  if (
    measuredInput.intent.policy !== "semantic-two-row-stage" ||
    measuredInput.intent.rows.length !== 2
  ) {
    throw new Error(
      "Two-row equation stage certification requires exactly two staged rows."
    );
  }
  const envelopesById = new Map(
    measuredInput.envelopes.map((envelope) => [envelope.id, envelope])
  );
  const intrinsic = measuredInput.intent.rows.map((intentRow) => {
    const envelopes = intentRow.envelopeIds.map((id) => {
      const envelope = envelopesById.get(id);
      if (envelope === undefined) {
        throw new Error(`Two-row equation stage is missing envelope ${id}.`);
      }
      assertKpEquationStageMeasurementIdentity(
        measuredInput.measurementIdentity,
        envelope.measurementIdentity,
        `Two-row equation stage envelope ${id}`
      );
      return envelope;
    });
    return {
      intent: intentRow,
      envelopes,
      rect: unionStageRects(envelopes.map(({ rect }) => rect))
    };
  });
  const allEnvelopes = intrinsic.flatMap(({ envelopes }) => envelopes);
  const measuredEm = Math.max(...allEnvelopes.map(({ emSizePx }) => emSizePx));
  const measuredInk = Math.max(...allEnvelopes.map(({ rect }) => rect.height));
  // Em provides the readable rhythm; the ink term protects unusually tall
  // notation without introducing glyph- or operation-specific dimensions.
  const minimumGutterPx = Math.max(measuredEm * 0.75, measuredInk * 0.15);
  const intrinsicBounds = unionStageRects(intrinsic.map(({ rect }) => rect));
  const centerX = intrinsicBounds.left + intrinsicBounds.width / 2;
  const centerY = intrinsicBounds.top + intrinsicBounds.height / 2;
  const stackHeight =
    intrinsic.reduce((height, { rect }) => height + rect.height, 0) +
    minimumGutterPx;
  let nextTop = centerY - stackHeight / 2;
  const rows = intrinsic.map(({ intent, rect }) => {
    const translateX = centerX - (rect.left + rect.width / 2);
    const translateY = nextTop - rect.top;
    const placedRect = translateStageRect(rect, translateX, translateY);
    nextTop = placedRect.top + placedRect.height + minimumGutterPx;
    return Object.freeze({
      id: intent.id,
      envelopeIds: Object.freeze([...intent.envelopeIds]),
      rect: placedRect,
      translateX,
      translateY,
      baselinePolicy: "preserve-native" as const
    });
  });
  const stageBounds = unionStageRects(rows.map(({ rect }) => rect));
  return Object.freeze({
    schemaVersion: "kp.certified-equation-stage-layout.v1" as const,
    executionState: "certified" as const,
    measurementIdentity: measuredInput.measurementIdentity,
    policy: "semantic-two-row-stage" as const,
    measuredInput,
    rows: Object.freeze(rows),
    stageBounds,
    minimumGutterPx,
    [certifiedEquationStageLayoutAuthority]: true as const
  });
}

export function applyKpCertifiedEquationStageLayout<
  TCertificate extends KpCertifiedEquationStageLayout
>(input: {
  readonly certificate: TCertificate;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly rows: readonly KpEquationStageNativeRowBinding[];
}): KpAppliedEquationStageLayout<TCertificate> {
  assertKpEquationStageMeasurementIdentity(
    input.certificate.measurementIdentity,
    input.measurementIdentity,
    "Equation stage DOM application"
  );
  const expectedRows = new Map(
    input.certificate.rows.map((row) => [row.id, row])
  );
  if (
    input.rows.length !== expectedRows.size ||
    new Set(input.rows.map(({ rowId }) => rowId)).size !== input.rows.length
  ) {
    throw new Error(
      "Equation stage DOM application must bind every certified row exactly once."
    );
  }
  const envelopes = new Map(
    input.certificate.measuredInput.envelopes.map((envelope) => [
      envelope.id,
      envelope
    ])
  );
  const seenElements = new Set<HTMLElement>();
  const seenOwnerIds = new Set<string>();
  const staged = input.rows.flatMap((binding) => {
    const row = expectedRows.get(binding.rowId);
    if (row === undefined) {
      throw new Error(
        `Equation stage DOM application names unknown row ${binding.rowId}.`
      );
    }
    const expectedMembers = new Set(row.envelopeIds.flatMap((envelopeId) => {
      const envelope = envelopes.get(envelopeId);
      if (envelope === undefined) {
        throw new Error(
          `Equation stage DOM application is missing envelope ${envelopeId}.`
        );
      }
      return envelope.memberOwnerIds;
    }));
    const actualMembers = binding.members.map(({ ownerId }) => ownerId);
    if (
      binding.members.length !== expectedMembers.size ||
      new Set(actualMembers).size !== actualMembers.length ||
      actualMembers.some((ownerId) => !expectedMembers.has(ownerId))
    ) {
      throw new Error(
        `Equation stage DOM row ${binding.rowId} must bind its exact native members.`
      );
    }
    return binding.members.map(({ ownerId, element }) => {
      if (seenOwnerIds.has(ownerId)) {
        throw new Error(
          `Equation stage DOM application repeats native owner ${ownerId}.`
        );
      }
      seenOwnerIds.add(ownerId);
      if (!element.isConnected) {
        throw new Error(
          `Equation stage native member ${ownerId} is not connected.`
        );
      }
      if (seenElements.has(element)) {
        throw new Error(
          `Equation stage DOM application repeats native element ${ownerId}.`
        );
      }
      seenElements.add(element);
      const owned =
        element.dataset["kpEquationStageLayoutAuthority"] === "applied-v1";
      if (
        !owned &&
        element.style.translate !== "" &&
        element.style.translate !== "none"
      ) {
        throw new Error(
          `Equation stage native member ${ownerId} already owns CSS translation.`
        );
      }
      return {
        ownerId,
        element,
        row,
        previous: {
          translate: element.style.translate,
          authority: element.dataset["kpEquationStageLayoutAuthority"],
          application: element.dataset["kpEquationStageLayoutApplication"],
          row: element.dataset["kpEquationStageLayoutRow"],
          revision: element.dataset["kpEquationStageLayoutRevision"],
          coordinateSpace:
            element.dataset["kpEquationStageLayoutCoordinateSpace"]
        }
      };
    });
  });
  const applicationId = [
    input.measurementIdentity.coordinateSpaceId,
    input.measurementIdentity.revision,
    input.certificate.measuredInput.intent.nodeId
  ].join("@");
  try {
    for (const { element, row } of staged) {
      element.style.translate =
        `${cssPixel(row.translateX)} ${cssPixel(row.translateY)}`;
      element.dataset["kpEquationStageLayoutAuthority"] = "applied-v1";
      element.dataset["kpEquationStageLayoutApplication"] = applicationId;
      element.dataset["kpEquationStageLayoutRow"] = row.id;
      element.dataset["kpEquationStageLayoutRevision"] =
        String(input.measurementIdentity.revision);
      element.dataset["kpEquationStageLayoutCoordinateSpace"] =
        input.measurementIdentity.coordinateSpaceId;
    }
    for (const { ownerId, element, row } of staged) {
      if (
        !cssTranslationMatches(
          element.style.translate,
          row.translateX,
          row.translateY
        ) ||
        element.dataset["kpEquationStageLayoutApplication"] !== applicationId
      ) {
        throw new Error(
          `Equation stage native member ${ownerId} rejected its row transform ` +
          `(expected ${row.translateX},${row.translateY}; observed ` +
          `${element.style.translate || "<empty>"}; application ` +
          `${element.dataset["kpEquationStageLayoutApplication"] ?? "<none>"}).`
        );
      }
    }
  } catch (error) {
    for (const { element, previous } of staged) {
      element.style.translate = previous.translate;
      restoreData(
        element,
        "kpEquationStageLayoutAuthority",
        previous.authority
      );
      restoreData(
        element,
        "kpEquationStageLayoutApplication",
        previous.application
      );
      restoreData(element, "kpEquationStageLayoutRow", previous.row);
      restoreData(
        element,
        "kpEquationStageLayoutRevision",
        previous.revision
      );
      restoreData(
        element,
        "kpEquationStageLayoutCoordinateSpace",
        previous.coordinateSpace
      );
    }
    throw error;
  }
  return Object.freeze({
    schemaVersion: "kp.applied-equation-stage-layout.v1" as const,
    executionState: "applied" as const,
    measurementIdentity: input.certificate.measurementIdentity,
    certificate: input.certificate,
    appliedRowIds: Object.freeze(
      input.certificate.rows.map(({ id }) => id)
    ),
    appliedNativeMemberIds: Object.freeze(
      staged.map(({ ownerId }) => ownerId)
    ),
    nativeRows: Object.freeze(input.rows.map(({ rowId, members }) =>
      Object.freeze({ rowId, members: Object.freeze([...members]) })
    )),
    applicationId,
    [appliedEquationStageLayoutAuthority]: true as const
  });
}

export function assertKpAppliedEquationStageLayout(
  applied: KpAppliedEquationStageLayout,
  expected: KpEquationStageMeasurementIdentity,
  label: string
): void {
  assertKpEquationStageMeasurementIdentity(
    expected,
    applied.measurementIdentity,
    label
  );
  if (applied.appliedRowIds.length !== applied.certificate.rows.length) {
    throw new Error(`${label} is missing applied row proof.`);
  }
}

export function resetKpAppliedEquationStageLayout(root: ParentNode): void {
  for (const element of root.querySelectorAll<HTMLElement>(
    '[data-kp-equation-stage-layout-authority="applied-v1"]'
  )) {
    element.style.translate = "";
    delete element.dataset["kpEquationStageLayoutAuthority"];
    delete element.dataset["kpEquationStageLayoutApplication"];
    delete element.dataset["kpEquationStageLayoutRow"];
    delete element.dataset["kpEquationStageLayoutRevision"];
    delete element.dataset["kpEquationStageLayoutCoordinateSpace"];
  }
}

// These states are deliberately opaque: later compiler, certifier, and DOM
// application functions own the only runtime paths that can create them.

function indexEnvelopes<T extends { readonly id: string }>(
  values: readonly T[],
  kind: "definition" | "observation"
): ReadonlyMap<string, T> {
  const result = new Map<string, T>();
  for (const value of values) {
    assertNonEmptyId(value.id, `Equation stage envelope ${kind}`);
    if (result.has(value.id)) {
      throw new Error(`Equation stage envelope repeats ${kind} ${value.id}.`);
    }
    result.set(value.id, value);
  }
  return result;
}

function validatedMemberIds(
  values: readonly string[],
  label: string
): readonly string[] {
  if (values.length === 0) throw new Error(`${label} has no native members.`);
  for (const value of values) assertNonEmptyId(value, `${label} member`);
  assertUniqueIds(values, `${label} member`);
  return values;
}

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightMembers = new Set(right);
  return left.every((member) => rightMembers.has(member));
}

function assertUniqueIds(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} ids must be unique.`);
  }
}

function assertNonEmptyId(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} id must be non-empty.`);
}

function assertStageRect(rect: KpEquationStageRect, label: string): void {
  if (
    ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    throw new Error(`${label} must have finite positive native geometry.`);
  }
}

function unionStageRects(
  rects: readonly KpEquationStageRect[]
): Readonly<KpEquationStageRect> {
  if (rects.length === 0) {
    throw new Error("Equation stage row requires measured envelope geometry.");
  }
  const left = Math.min(...rects.map(({ left }) => left));
  const top = Math.min(...rects.map(({ top }) => top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return Object.freeze({
    left,
    top,
    width: right - left,
    height: bottom - top
  });
}

function translateStageRect(
  rect: KpEquationStageRect,
  translateX: number,
  translateY: number
): Readonly<KpEquationStageRect> {
  return Object.freeze({
    left: rect.left + translateX,
    top: rect.top + translateY,
    width: rect.width,
    height: rect.height
  });
}

function restoreData(
  element: HTMLElement,
  key: string,
  value: string | undefined
): void {
  if (value === undefined) delete element.dataset[key];
  else element.dataset[key] = value;
}

function cssTranslationMatches(
  value: string,
  expectedX: number,
  expectedY: number
): boolean {
  const components = value.trim().split(/\s+/);
  const x = Number.parseFloat(components[0] ?? "");
  const y = components.length < 2
    ? 0
    : Number.parseFloat(components[1] ?? "");
  return Number.isFinite(x) &&
    Number.isFinite(y) &&
    Math.abs(x - expectedX) <= 0.000501 &&
    Math.abs(y - expectedY) <= 0.000501;
}

function cssPixel(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error("Equation stage CSS translation must be finite.");
  }
  // CSSOM executes lengths at a 0.001px serialization resolution and rejects
  // JavaScript scientific notation. Quantize the proof boundary deliberately
  // so intermediate responsive widths cannot turn valid geometry into invalid
  // or apparently mismatched CSS.
  const normalized = Math.round(value * 1_000) / 1_000;
  return `${Object.is(normalized, -0) ? "0.000" : normalized.toFixed(3)}px`;
}

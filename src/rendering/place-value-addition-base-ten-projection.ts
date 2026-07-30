import {
  certifyKpPlaceValueSemanticFoundation,
  isKpVerifiedPlaceValueSemanticFoundation,
  type KpVerifiedPlaceValueSemanticFoundation
} from "../architecture/place-value-addition-semantic-foundation.ts";
import type {
  KpPlaceValueAdditionState
} from "../semantic/place-value-addition-trace.ts";

declare const kpPlaceValueBaseTenProjectionBrand: unique symbol;

const sealedBaseTenProjections = new WeakSet<object>();

export type KpBaseTenDenomination = "hundred" | "ten" | "one";

export interface KpPlaceValueBaseTenBlock {
  readonly id: string;
  readonly denomination: KpBaseTenDenomination;
  readonly exactUnitCount: 100 | 10 | 1;
  readonly provenance:
    | "first-addend"
    | "second-addend"
    | "ones-exchange"
    | "tens-exchange";
  readonly parentBlockIds: readonly string[];
}

export interface KpPlaceValueBaseTenPlacement {
  readonly blockId: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface KpPlaceValueBaseTenFrame {
  readonly stateId: KpPlaceValueAdditionState["id"];
  readonly blockIds: readonly string[];
  readonly placements: readonly KpPlaceValueBaseTenPlacement[];
  readonly exactUnitCount: 434;
}

export interface KpPlaceValueBaseTenExchange {
  readonly id: "exchange.ones-to-tens" | "exchange.tens-to-hundreds";
  readonly from: "one" | "ten";
  readonly to: "ten" | "hundred";
  readonly consumedBlockIds: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ];
  readonly producedBlockId: string;
  readonly consumedExactUnitCount: 10 | 100;
  readonly producedExactUnitCount: 10 | 100;
}

export interface KpPlaceValueBaseTenProjection {
  readonly schemaVersion: "kp.place-value-addition-base-ten-projection.v1";
  readonly animationId: KpVerifiedPlaceValueSemanticFoundation["animationId"];
  readonly traceId: KpVerifiedPlaceValueSemanticFoundation["trace"]["id"];
  readonly status: "ready-for-session-binding";
  readonly promotionStatus: "not-promoted";
  readonly authority: "projection-only";
  readonly rendering: "deterministic-svg";
  readonly blocks: readonly KpPlaceValueBaseTenBlock[];
  readonly exchanges: readonly [
    KpPlaceValueBaseTenExchange,
    KpPlaceValueBaseTenExchange
  ];
  readonly frames: readonly KpPlaceValueBaseTenFrame[];
  readonly homePlacements: readonly KpPlaceValueBaseTenPlacement[];
  readonly intrinsicViewBox: {
    readonly minX: 0;
    readonly minY: 0;
    readonly width: 248;
    readonly height: 100;
  };
  readonly domPolicy: {
    readonly persistentObjectInventory: true;
    readonly rebuildPerFrame: false;
    readonly opacityPolicy: "opaque";
    readonly webglRequired: false;
  };
  readonly [kpPlaceValueBaseTenProjectionBrand]: true;
}

const layout = Object.freeze({
  hundred: Object.freeze({
    x: 0,
    y: 0,
    width: 48,
    height: 48,
    gap: 4,
    columns: 2
  }),
  ten: Object.freeze({
    x: 108,
    y: 0,
    width: 48,
    height: 5,
    gap: 4,
    columns: 2
  }),
  one: Object.freeze({
    x: 216,
    y: 0,
    width: 5,
    height: 5,
    gap: 4,
    columns: 4
  })
});

export function compileKpPlaceValueBaseTenProjection(
  foundation: KpVerifiedPlaceValueSemanticFoundation =
    certifyKpPlaceValueSemanticFoundation()
): KpPlaceValueBaseTenProjection {
  if (!isKpVerifiedPlaceValueSemanticFoundation(foundation)) {
    throw new Error(
      "Base-ten projection requires the sealed place-value semantic foundation."
    );
  }
  const initial = Object.freeze([
    ...blocks("first.hundreds", 2, "hundred", "first-addend"),
    ...blocks("first.tens", 7, "ten", "first-addend"),
    ...blocks("first.ones", 8, "one", "first-addend"),
    ...blocks("second.hundreds", 1, "hundred", "second-addend"),
    ...blocks("second.tens", 5, "ten", "second-addend"),
    ...blocks("second.ones", 6, "one", "second-addend")
  ]);
  const consumedOnes = Object.freeze([
    ...initial
      .filter(({ id }) => id.startsWith("block.first.ones."))
      .map(({ id }) => id),
    "block.second.ones.0",
    "block.second.ones.1"
  ] as [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ]);
  const carriedTen = exchangeBlock(
    "block.exchange.ones-to-tens",
    "ten",
    "ones-exchange",
    consumedOnes
  );
  const afterOnes = Object.freeze([
    ...initial.filter(({ id }) => !consumedOnes.includes(id)),
    carriedTen
  ]);
  const consumedTens = Object.freeze([
    ...initial
      .filter(({ id }) => id.startsWith("block.first.tens."))
      .map(({ id }) => id),
    "block.second.tens.0",
    "block.second.tens.1",
    carriedTen.id
  ] as [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ]);
  const carriedHundred = exchangeBlock(
    "block.exchange.tens-to-hundreds",
    "hundred",
    "tens-exchange",
    consumedTens
  );
  const settled = Object.freeze([
    ...afterOnes.filter(({ id }) => !consumedTens.includes(id)),
    carriedHundred
  ]);
  const catalog = Object.freeze([...initial, carriedTen, carriedHundred]);
  assertUnique(catalog.map(({ id }) => id), "base-ten block");

  const inventoryByStage = {
    established: initial,
    "ones-evaluated": initial,
    "ones-exchanged": afterOnes,
    "tens-evaluated": afterOnes,
    "tens-exchanged": settled,
    "hundreds-evaluated": settled,
    settled
  } as const;
  const frames = Object.freeze(foundation.trace.states.map((state) => {
    const inventory = inventoryByStage[state.stage];
    const placements = pack(inventory);
    const exactUnitCount = inventory.reduce(
      (sum, block) => sum + block.exactUnitCount,
      0
    );
    if (exactUnitCount !== 434) {
      throw new Error(
        `Base-ten frame ${state.id} does not conserve 434 units.`
      );
    }
    return Object.freeze({
      stateId: state.id,
      blockIds: Object.freeze(inventory.map(({ id }) => id)),
      placements,
      exactUnitCount: 434 as const
    });
  }));
  const homePlacements = Object.freeze(catalog.map((block) => {
    const placement = frames
      .flatMap(({ placements }) => placements)
      .find(({ blockId }) => blockId === block.id);
    if (placement === undefined) {
      throw new Error(`Base-ten block ${block.id} lacks a home placement.`);
    }
    return placement;
  }));
  const exchanges = Object.freeze([
    Object.freeze({
      id: "exchange.ones-to-tens" as const,
      from: "one" as const,
      to: "ten" as const,
      consumedBlockIds: consumedOnes,
      producedBlockId: carriedTen.id,
      consumedExactUnitCount: 10 as const,
      producedExactUnitCount: 10 as const
    }),
    Object.freeze({
      id: "exchange.tens-to-hundreds" as const,
      from: "ten" as const,
      to: "hundred" as const,
      consumedBlockIds: consumedTens,
      producedBlockId: carriedHundred.id,
      consumedExactUnitCount: 100 as const,
      producedExactUnitCount: 100 as const
    })
  ] as const);
  const projection = Object.freeze({
    schemaVersion: "kp.place-value-addition-base-ten-projection.v1" as const,
    animationId: foundation.animationId,
    traceId: foundation.trace.id,
    status: "ready-for-session-binding" as const,
    promotionStatus: "not-promoted" as const,
    authority: "projection-only" as const,
    rendering: "deterministic-svg" as const,
    blocks: catalog,
    exchanges,
    frames,
    homePlacements,
    intrinsicViewBox: Object.freeze({
      minX: 0 as const,
      minY: 0 as const,
      width: 248 as const,
      height: 100 as const
    }),
    domPolicy: Object.freeze({
      persistentObjectInventory: true as const,
      rebuildPerFrame: false as const,
      opacityPolicy: "opaque" as const,
      webglRequired: false as const
    })
  });
  sealedBaseTenProjections.add(projection);
  return projection as unknown as KpPlaceValueBaseTenProjection;
}

export function sampleKpPlaceValueBaseTenFrame(
  projection: KpPlaceValueBaseTenProjection,
  stateId: KpPlaceValueAdditionState["id"]
): KpPlaceValueBaseTenFrame {
  if (!isKpPlaceValueBaseTenProjection(projection)) {
    throw new Error("Base-ten sampling requires compiler-owned projection.");
  }
  const frame = projection.frames.find((candidate) =>
    candidate.stateId === stateId
  );
  if (frame === undefined) {
    throw new Error(`Unknown base-ten state ${stateId}.`);
  }
  return frame;
}

export function isKpPlaceValueBaseTenProjection(
  value: unknown
): value is KpPlaceValueBaseTenProjection {
  return typeof value === "object" &&
    value !== null &&
    sealedBaseTenProjections.has(value);
}

function blocks(
  prefix: string,
  count: number,
  denomination: KpBaseTenDenomination,
  provenance: "first-addend" | "second-addend"
): readonly KpPlaceValueBaseTenBlock[] {
  return Object.freeze(Array.from({ length: count }, (_, index) =>
    Object.freeze({
      id: `block.${prefix}.${index}`,
      denomination,
      exactUnitCount: exactUnits(denomination),
      provenance,
      parentBlockIds: Object.freeze([] as string[])
    })
  ));
}

function exchangeBlock(
  id: string,
  denomination: "ten" | "hundred",
  provenance: "ones-exchange" | "tens-exchange",
  parentBlockIds: readonly string[]
): KpPlaceValueBaseTenBlock {
  return Object.freeze({
    id,
    denomination,
    exactUnitCount: exactUnits(denomination),
    provenance,
    parentBlockIds
  });
}

function exactUnits(denomination: KpBaseTenDenomination): 100 | 10 | 1 {
  switch (denomination) {
    case "hundred":
      return 100;
    case "ten":
      return 10;
    case "one":
      return 1;
  }
}

function pack(
  inventory: readonly KpPlaceValueBaseTenBlock[]
): readonly KpPlaceValueBaseTenPlacement[] {
  return Object.freeze((["hundred", "ten", "one"] as const).flatMap(
    (denomination) => {
      const policy = layout[denomination];
      return inventory
        .filter((block) => block.denomination === denomination)
        .map((block, index) => Object.freeze({
          blockId: block.id,
          x:
            policy.x +
            (index % policy.columns) * (policy.width + policy.gap),
          y:
            policy.y +
            Math.floor(index / policy.columns) *
              (policy.height + policy.gap),
          width: policy.width,
          height: policy.height
        }));
    }
  ));
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} IDs must be unique.`);
  }
}

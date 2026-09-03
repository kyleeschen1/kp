import {
  compileKpSemanticStateSchema
} from "../../src/semantic-state/authoring-schema-compiler.ts";
import {
  createKpSemanticStateHandleSet
} from "../../src/semantic-state/authoring-state-handles.ts";
import {
  materializeKpSemanticStateInitialSnapshot
} from "../../src/semantic-state/authoring-state-materializer.ts";
import {
  kpStateGroup,
  kpStateOptional,
  kpStateValue
} from "../../src/semantic-state/authoring-schema.ts";

interface SupplyCurve {
  readonly kind: "supply";
  readonly intercept: number;
  readonly slope: number;
}

const compiled = compileKpSemanticStateSchema("lesson.handle-types", kpStateGroup({
  market: kpStateGroup({
    supply: kpStateValue<SupplyCurve>({
      kind: "supply",
      intercept: 2,
      slope: 1
    })
  }),
  revenue: kpStateOptional<number>()
}));
const handles = createKpSemanticStateHandleSet(compiled);
const view = handles.pin(materializeKpSemanticStateInitialSnapshot(compiled));

const supply: SupplyCurve = view.market.supply.read();
const revenue: number = view.revenue.read();
const supplySlot = handles.refs.market.supply.slotId;
void supply;
void revenue;
void supplySlot;

// @ts-expect-error Stable dependency references do not read ambient state.
handles.refs.market.supply.read();

// @ts-expect-error A pinned supply read retains its domain discriminant.
const wrongKind: "demand" = view.market.supply.read().kind;
void wrongKind;

// @ts-expect-error Values recovered from immutable versions remain readonly.
view.market.supply.read().intercept = 4;

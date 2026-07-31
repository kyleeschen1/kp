import {
  bindKpPlaceValueWrittenMotionProxy,
  compileKpPlaceValueOnesWrittenOwnership
} from "../../src/rendering/place-value-addition-written-ownership.ts";

const ownership = compileKpPlaceValueOnesWrittenOwnership();
const contributionSelector = bindKpPlaceValueWrittenMotionProxy(
  ownership.contributionProxies[0]
);
const catalystSelector = bindKpPlaceValueWrittenMotionProxy(
  ownership.catalystProxy
);

// @ts-expect-error Persistent written cells can never enter a moving binding.
bindKpPlaceValueWrittenMotionProxy(ownership.persistentCells[0]);
// @ts-expect-error The stationary plus is context, not moving catalyst paint.
bindKpPlaceValueWrittenMotionProxy(ownership.persistentCells[2]);

void [contributionSelector, catalystSelector];

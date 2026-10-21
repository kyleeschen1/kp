import example from "../../examples/algebra/fraction-chain.json" with { type: "json" };

export function createFractionChainAuthorExample() {
  return { ...structuredClone(example), moves: example.moves.map(({ hint: _hint, ...move }) => ({ ...move })) };
}

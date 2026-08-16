import {
  defineConceptRoomTheme,
  linearEquationExemplarTheme
} from "../../src/app-adapters/concept-room-theme.ts";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Expect<Value extends true> = Value;

export type ThemeIdStaysLiteral = Expect<Equal<
  typeof linearEquationExemplarTheme.id,
  "kp.concept-room.linear-equation-exemplar.v1"
>>;

export type MathFamilyStaysKaTeX = Expect<Equal<
  typeof linearEquationExemplarTheme.tokens.typography.mathFamily,
  "KaTeX_Main"
>>;

defineConceptRoomTheme({
  id: "invalid.missing-focus-role",
  // @ts-expect-error every semantic style role requires an explicit binding
  roles: {
    "equation.expression": { className: "equation" },
    "equation.operation": { className: "operation" },
    "diagram.balance": { className: "balance" }
  }
});

defineConceptRoomTheme({
  id: "invalid.motion-value",
  roles: linearEquationExemplarTheme.roles,
  tokens: {
    ...linearEquationExemplarTheme.tokens,
    motion: {
      ...linearEquationExemplarTheme.tokens.motion,
      // @ts-expect-error motion channels are numeric sampled-duration values
      actMs: "slow"
    }
  }
});

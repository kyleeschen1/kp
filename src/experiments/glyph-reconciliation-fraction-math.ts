export function createKpGlyphReconciliationFractionMath(input: {
  readonly sourceDenominatorEntityIds: readonly [string, string];
  readonly targetDenominatorEntityId: string;
  readonly sourceDenominatorMotionIds: readonly [string, string];
  readonly targetDenominatorMotionId: string;
}): { readonly source: string; readonly target: string } {
  const source = semantic({
    entityId: "fraction.expression",
    groupId: "group.fraction.source",
    latex:
      semantic({
        entityId: "fraction.left",
        groupId: "group.fraction.source.left",
        latex: fraction(
          semantic({
            entityId: "symbol.x",
            groupId: "group.fraction.source.left.numerator",
            latex: "x"
          }),
          semantic({
            entityId: input.sourceDenominatorEntityIds[0],
            groupId: "group.fraction.source.left.denominator",
            latex: motion(input.sourceDenominatorMotionIds[0], "2")
          })
        )
      }) +
      semantic({
        entityId: "operator.add",
        groupId: "group.fraction.source.operator",
        latex: "+"
      }) +
      semantic({
        entityId: "fraction.right",
        groupId: "group.fraction.source.right",
        latex: fraction(
          semantic({
            entityId: "symbol.y",
            groupId: "group.fraction.source.right.numerator",
            latex: "y"
          }),
          semantic({
            entityId: input.sourceDenominatorEntityIds[1],
            groupId: "group.fraction.source.right.denominator",
            latex: motion(input.sourceDenominatorMotionIds[1], "2")
          })
        )
      })
  });
  const target = semantic({
    entityId: "fraction.expression",
    groupId: "group.fraction.target",
    latex: semantic({
      entityId: "fraction.merged",
      groupId: "group.fraction.target.merged",
      latex: fraction(
        semantic({
          entityId: "fraction.merged.numerator",
          groupId: "group.fraction.target.merged.numerator",
          latex:
            semantic({
              entityId: "symbol.x",
              groupId: "group.fraction.target.merged.numerator.x",
              latex: "x"
            }) +
            semantic({
              entityId: "operator.add",
              groupId: "group.fraction.target.merged.numerator.operator",
              latex: "+"
            }) +
            semantic({
              entityId: "symbol.y",
              groupId: "group.fraction.target.merged.numerator.y",
              latex: "y"
            })
        }),
        semantic({
          entityId: input.targetDenominatorEntityId,
          groupId: "group.fraction.target.merged.denominator",
          latex: motion(input.targetDenominatorMotionId, "2")
        })
      )
    })
  });
  return Object.freeze({ source, target });
}

function semantic(input: {
  readonly entityId: string;
  readonly groupId: string;
  readonly latex: string;
}): string {
  return String.raw`\htmlData{kp-semantic-entity-id=${input.entityId},kp-presentation-group-id=${input.groupId}}{${input.latex}}`;
}

function motion(id: string, latex: string): string {
  return String.raw`\htmlData{kp-motion-id=${id}}{${latex}}`;
}

function fraction(numerator: string, denominator: string): string {
  return String.raw`\frac{${numerator}}{${denominator}}`;
}

import {
  createKpSymbolicManipulationFamily,
  type KpSymbolicManipulationFamily
} from "../symbolic-manipulation-family.ts";
import {
  createKpSemanticTransformationDefinition
} from "../../semantic/asset-transformation.ts";
import {
  createKpSymbolicManipulationFamilyPackDeclaration,
  symbolicManipulationFamilyRowId
} from "../symbolic-manipulation-family-pack.ts";

export function createLinearAlgebraVectorAddScaleFamily():
  KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.vector-addition",
    "definition.symbolic.linear-algebra.scalar-multiplication",
    "definition.symbolic.linear-algebra.component-decomposition",
    "definition.symbolic.linear-algebra.graphical-vector-composition"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.vector-add-scale",
    title: "Vector add and scale",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "vector.before",
        objectType: "vector-expression",
        title: "Vector expression before operation",
        selectorRoles: [
          { id: "vector.left", kind: "vector" },
          { id: "vector.right", kind: "vector" },
          { id: "scalar", kind: "scalar" },
          { id: "component", kind: "component" },
          { id: "origin", kind: "point" },
          { id: "tip", kind: "point" }
        ]
      },
      {
        id: "vector.after",
        objectType: "vector-expression",
        title: "Vector expression after operation",
        selectorRoles: [
          { id: "vector.result", kind: "vector" },
          { id: "scaled.vector", kind: "vector" },
          { id: "component", kind: "component" },
          { id: "origin", kind: "point" },
          { id: "tip", kind: "point" },
          { id: "parallelogram.edge", kind: "graph-edge" }
        ]
      }
    ],
    transformationDefinitions: [
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.vector-addition",
        transformType: "vectorAddition",
        title: "Add vectors",
        sourceObjectRoles: ["vector.before"],
        targetObjectRoles: ["vector.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "Vectors share a coordinate space and can be added componentwise."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.vector-addition",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "vector.before",
            sourceSelectorRole: "vector.left",
            targetObjectRole: "vector.after",
            targetSelectorRole: "vector.result",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "vector.before",
            sourceSelectorRole: "vector.right",
            targetObjectRole: "vector.after",
            targetSelectorRole: "vector.result",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "vector.before",
            sourceSelectorRole: "origin",
            targetObjectRole: "vector.after",
            targetSelectorRole: "origin",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "vector.before",
            sourceSelectorRole: "tip",
            targetObjectRole: "vector.after",
            targetSelectorRole: "tip",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "vector.before",
            sourceSelectorRole: "component",
            targetObjectRole: "vector.after",
            targetSelectorRole: "component",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createVectorDefinition({
        id: "definition.symbolic.linear-algebra.scalar-multiplication",
        transformType: "scalarMultiplication",
        title: "Scale a vector",
        lawId: "law.linear-algebra.scalar-multiplication",
        preserves: ["value", "structure"],
        assumption:
          "Scalar multiplication scales each component in the represented vector space."
      }),
      createVectorDefinition({
        id: "definition.symbolic.linear-algebra.component-decomposition",
        transformType: "componentDecomposition",
        title: "Decompose a vector into components",
        lawId: "law.linear-algebra.component-decomposition",
        preserves: ["value", "structure"],
        assumption:
          "Component decomposition uses the represented coordinate basis."
      }),
      createVectorDefinition({
        id: "definition.symbolic.linear-algebra.graphical-vector-composition",
        transformType: "graphicalVectorComposition",
        title: "Compose vectors graphically",
        lawId: "law.graph.vector-composition",
        preserves: ["value", "presentation"],
        assumption:
          "Graphical composition uses equivalent translated arrows in the same vector space."
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.vector.tip-to-tail",
        motifKind: "tip-to-tail",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.vector-addition",
          "definition.symbolic.linear-algebra.graphical-vector-composition"
        ],
        summary:
          "Vector arrows move tip-to-tail while component identities remain tied to the symbolic result."
      },
      {
        id: "motif.linear-algebra.vector.scalar-stretch",
        motifKind: "scalar-stretch",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.scalar-multiplication"
        ],
        summary:
          "Scalar multiplication stretches or reverses the vector arrow while preserving origin/component provenance."
      },
      {
        id: "motif.linear-algebra.vector.component-lift",
        motifKind: "component-lift",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.component-decomposition"
        ],
        summary:
          "Component entries lift into coordinate-axis arrows and can fold back into vector notation."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.vector-add-scale.basic",
        animationId: "animation.graph.vector.linear-map-scale",
        availability: "concrete",
        renderTargetKinds: ["graph"],
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.scalar-multiplication"
        ],
        summary:
          "The scale-matrix graph sample stretches a vector while preserving component provenance."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.vector-add-scale.arrow-composition",
        title: "Vector operations correspond to arrow geometry",
        representationKind: "vector-graph",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.vector-arrow-composition",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.graph.vector.linear-map-scale"],
        summary:
          "Vector addition and scaling preserve the represented vector while changing arrow placement or length."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-vector-add-scale",
        fixtureFamilyId: "generated.linear-algebra-vector-add-scale",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated vector traces can map component arithmetic, scaling, and graph arrow composition to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.vector-add-scale.predict",
        kind: "predict-next",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.vector-addition",
          "definition.symbolic.linear-algebra.scalar-multiplication"
        ],
        summary:
          "Predict-next cards can ask for the resulting vector or graphical arrow placement."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.vector-add-scale"
      ),
      tags: [
        "vector",
        "scale",
        "graph",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for vector addition, scalar multiplication, and component persistence.",
      searchSummary:
        "vector addition scalar multiplication scale components parallelogram graph arrows tip tail",
      graphEquivalentKinds: "vector-graph"
    }
  });
}

function createVectorDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly ("value" | "structure" | "presentation")[];
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["vector.before"],
    targetObjectRoles: ["vector.after"],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "vector.before",
        sourceSelectorRole: "component",
        targetObjectRole: "vector.after",
        targetSelectorRole: "component",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "vector.before",
        sourceSelectorRole: "origin",
        targetObjectRole: "vector.after",
        targetSelectorRole: "origin",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "vector.before",
        sourceSelectorRole: "tip",
        targetObjectRole: "vector.after",
        targetSelectorRole: "tip",
        preserves: ["identity", "role"]
      }
    ]
  });
}

export function createLinearAlgebraDotProjectionFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.dot-product",
    "definition.symbolic.linear-algebra.vector-projection",
    "definition.symbolic.linear-algebra.orthogonality-test",
    "definition.symbolic.linear-algebra.angle-from-dot"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.dot-projection",
    title: "Dot product and projection",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "dot.before",
        objectType: "dot-product-expression",
        title: "Dot product expression before interpretation",
        selectorRoles: [
          { id: "vector.left", kind: "vector" },
          { id: "vector.right", kind: "vector" },
          { id: "component.left", kind: "component" },
          { id: "component.right", kind: "component" },
          { id: "angle", kind: "angle" },
          { id: "length.left", kind: "length" },
          { id: "length.right", kind: "length" }
        ]
      },
      {
        id: "dot.after",
        objectType: "dot-product-interpretation",
        title: "Dot product geometric interpretation",
        selectorRoles: [
          { id: "scalar.result", kind: "scalar" },
          { id: "projection.vector", kind: "vector" },
          { id: "orthogonal.component", kind: "vector" },
          { id: "angle", kind: "angle" },
          { id: "length.left", kind: "length" },
          { id: "length.right", kind: "length" }
        ]
      }
    ],
    transformationDefinitions: [
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.dot-product",
        transformType: "dotProduct",
        title: "Compute a dot product",
        sourceObjectRoles: ["dot.before"],
        targetObjectRoles: ["dot.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "Vectors are in the same inner-product space."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.dot-product",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "dot.before",
            sourceSelectorRole: "vector.left",
            targetObjectRole: "dot.after",
            targetSelectorRole: "scalar.result",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "dot.before",
            sourceSelectorRole: "vector.right",
            targetObjectRole: "dot.after",
            targetSelectorRole: "scalar.result",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "dot.before",
            sourceSelectorRole: "angle",
            targetObjectRole: "dot.after",
            targetSelectorRole: "angle",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "dot.before",
            sourceSelectorRole: "length.left",
            targetObjectRole: "dot.after",
            targetSelectorRole: "length.left",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "dot.before",
            sourceSelectorRole: "length.right",
            targetObjectRole: "dot.after",
            targetSelectorRole: "length.right",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createDotProjectionDefinition({
        id: "definition.symbolic.linear-algebra.vector-projection",
        transformType: "vectorProjection",
        title: "Project one vector onto another",
        lawId: "law.linear-algebra.vector-projection",
        assumption:
          "The projection target vector is non-zero in the represented inner-product space."
      }),
      createDotProjectionDefinition({
        id: "definition.symbolic.linear-algebra.orthogonality-test",
        transformType: "orthogonalityTest",
        title: "Test orthogonality by dot product",
        lawId: "law.linear-algebra.orthogonality",
        assumption:
          "Zero dot product indicates orthogonality under the represented inner product."
      }),
      createDotProjectionDefinition({
        id: "definition.symbolic.linear-algebra.angle-from-dot",
        transformType: "angleFromDotProduct",
        title: "Recover angle information from a dot product",
        lawId: "law.linear-algebra.dot-angle",
        assumption:
          "Both vector lengths are non-zero when recovering an angle from the dot product."
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.dot.component-pair-sum",
        motifKind: "component-pair-sum",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.dot-product"
        ],
        summary:
          "Component pairs align, multiply, and accumulate into a scalar dot-product result."
      },
      {
        id: "motif.linear-algebra.dot.projection-drop",
        motifKind: "projection-drop",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.vector-projection",
          "definition.symbolic.linear-algebra.orthogonality-test"
        ],
        summary:
          "One vector drops perpendicularly onto another while the orthogonal component remains explicit."
      },
      {
        id: "motif.linear-algebra.dot.angle-sweep",
        motifKind: "angle-sweep",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.angle-from-dot"
        ],
        summary:
          "Angle and length tokens sweep into the geometric dot-product interpretation."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.dot-projection.basic",
        animationId: "animation.dot-projection.basic",
        availability: "concrete",
        renderTargetKinds: ["graph"],
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.dot-product",
          "definition.symbolic.linear-algebra.vector-projection"
        ],
        summary:
          "The dot/projection graph computes the scalar result while animating the exact perpendicular drop."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.dot-projection.geometry",
        title: "Dot product corresponds to projection geometry",
        representationKind: "vector-graph",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.dot-projection-geometry",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.dot-projection.basic"],
        summary:
          "Dot product, projection, orthogonality, and angle interpretations preserve the same vector relationship."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-dot-projection",
        fixtureFamilyId: "generated.linear-algebra-dot-projection",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated vector traces can map dot products, projections, orthogonality, and angle steps to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.dot-projection.relationship",
        kind: "relationship",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.dot-product",
          "definition.symbolic.linear-algebra.vector-projection",
          "definition.symbolic.linear-algebra.angle-from-dot"
        ],
        summary:
          "Relationship cards can ask how scalar dot products, projections, and angles encode the same relationship."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.dot-projection"
      ),
      tags: [
        "dot-product",
        "projection",
        "orthogonality",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for dot products, projections, orthogonality, and angle/length interpretations.",
      searchSummary:
        "dot product projection orthogonal angle length scalar component vector graph",
      graphEquivalentKinds: "vector-graph"
    }
  });
}

function createDotProjectionDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["dot.before"],
    targetObjectRoles: ["dot.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "dot.before",
        sourceSelectorRole: "vector.left",
        targetObjectRole: "dot.after",
        targetSelectorRole: "projection.vector",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "dot.before",
        sourceSelectorRole: "vector.right",
        targetObjectRole: "dot.after",
        targetSelectorRole: "projection.vector",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "dot.before",
        sourceSelectorRole: "angle",
        targetObjectRole: "dot.after",
        targetSelectorRole: "angle",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "dot.before",
        sourceSelectorRole: "length.left",
        targetObjectRole: "dot.after",
        targetSelectorRole: "length.left",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "dot.before",
        sourceSelectorRole: "length.right",
        targetObjectRole: "dot.after",
        targetSelectorRole: "length.right",
        preserves: ["identity", "role"]
      }
    ]
  });
}

export function createLinearAlgebraMatrixVectorFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.matrix-vector-multiply",
    "definition.symbolic.linear-algebra.row-dot-products",
    "definition.symbolic.linear-algebra.apply-linear-map"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.matrix-vector",
    title: "Matrix-vector multiplication",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "matrixVector.before",
        objectType: "matrix-vector-expression",
        title: "Matrix-vector expression before multiplication",
        selectorRoles: [
          { id: "matrix", kind: "matrix" },
          { id: "matrix.row", kind: "matrix-row" },
          { id: "matrix.entry", kind: "matrix-entry" },
          { id: "vector", kind: "vector" },
          { id: "vector.entry", kind: "vector-entry" }
        ]
      },
      {
        id: "matrixVector.after",
        objectType: "matrix-vector-result",
        title: "Matrix-vector result",
        selectorRoles: [
          { id: "result.vector", kind: "vector" },
          { id: "result.entry", kind: "vector-entry" },
          { id: "row.dot.product", kind: "dot-product" },
          { id: "linear.map", kind: "linear-map" },
          { id: "transformed.vector", kind: "vector" }
        ]
      }
    ],
    transformationDefinitions: [
      createMatrixVectorDefinition({
        id: "definition.symbolic.linear-algebra.matrix-vector-multiply",
        transformType: "matrixVectorMultiply",
        title: "Multiply a matrix by a vector",
        lawId: "law.linear-algebra.matrix-vector",
        preserves: ["value", "structure"],
        assumption:
          "Matrix columns and vector dimension are compatible for multiplication."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.row-dot-products",
        transformType: "rowDotProducts",
        title: "Compute matrix-vector rows as dot products",
        sourceObjectRoles: ["matrixVector.before"],
        targetObjectRoles: ["matrixVector.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "Each result component is the dot product of one matrix row and the input vector."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.matrix-row-dot",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "matrixVector.before",
            sourceSelectorRole: "matrix.row",
            targetObjectRole: "matrixVector.after",
            targetSelectorRole: "row.dot.product",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "matrixVector.before",
            sourceSelectorRole: "matrix.entry",
            targetObjectRole: "matrixVector.after",
            targetSelectorRole: "row.dot.product",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "matrixVector.before",
            sourceSelectorRole: "vector.entry",
            targetObjectRole: "matrixVector.after",
            targetSelectorRole: "row.dot.product",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "matrixVector.before",
            sourceSelectorRole: "vector",
            targetObjectRole: "matrixVector.after",
            targetSelectorRole: "result.vector",
            preserves: ["value", "role"]
          }
        ]
      }),
      createMatrixVectorDefinition({
        id: "definition.symbolic.linear-algebra.apply-linear-map",
        transformType: "applyLinearMap",
        title: "Apply the matrix as a linear map",
        lawId: "law.linear-algebra.linear-map-application",
        preserves: ["value", "presentation"],
        assumption:
          "The matrix represents a linear map from input vectors to transformed output vectors."
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.matrix-vector.row-dot-sweep",
        motifKind: "row-dot-sweep",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.row-dot-products",
          "definition.symbolic.linear-algebra.matrix-vector-multiply"
        ],
        summary:
          "Each matrix row sweeps across vector entries to form one persistent result entry."
      },
      {
        id: "motif.linear-algebra.matrix-vector.linear-map-apply",
        motifKind: "linear-map-apply",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.apply-linear-map"
        ],
        summary:
          "The matrix expression projects into a graph transform of the input vector."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.matrix-vector.basic",
        animationId:
          "animation.generated.linear-algebra.matrix-vector.two-by-two",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.matrix-vector-multiply"
        ],
        summary:
          "Generated matrix-vector sample multiplies a two-by-two matrix by a vector and preserves each result component."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.matrix-vector.linear-map",
        title: "Matrix-vector multiplication applies a linear map",
        representationKind: "linear-map",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.matrix-vector-linear-map",
            level: "strict"
          }
        ],
        sampleAssetIds: [
          "animation.generated.linear-algebra.matrix-vector.two-by-two"
        ],
        summary:
          "Matrix-vector multiplication preserves the linear-map relation between input and transformed output vectors."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-matrix-vector",
        fixtureFamilyId: "generated.linear-algebra-matrix-vector",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated matrix-vector traces can map row dot products and graph linear-map application to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.matrix-vector.row-dot",
        kind: "predict-next",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.row-dot-products",
          "definition.symbolic.linear-algebra.matrix-vector-multiply"
        ],
        summary:
          "Predict-next cards can ask which row dot product creates each result entry."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.matrix-vector"
      ),
      tags: [
        "matrix",
        "vector",
        "linear-map",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for matrix-vector multiplication as row dot products and linear-map equivalents.",
      searchSummary:
        "matrix vector multiplication row dot products linear map transform graph",
      graphEquivalentKinds: "linear-map"
    }
  });
}

function createMatrixVectorDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly ("value" | "structure" | "presentation")[];
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["matrixVector.before"],
    targetObjectRoles: ["matrixVector.after"],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "matrixVector.before",
        sourceSelectorRole: "matrix",
        targetObjectRole: "matrixVector.after",
        targetSelectorRole: "linear.map",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "matrixVector.before",
        sourceSelectorRole: "vector",
        targetObjectRole: "matrixVector.after",
        targetSelectorRole: "transformed.vector",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "matrixVector.before",
        sourceSelectorRole: "matrix.entry",
        targetObjectRole: "matrixVector.after",
        targetSelectorRole: "result.entry",
        preserves: ["value", "role"]
      }
    ]
  });
}

export function createLinearAlgebraMatrixMatrixCompositionFamily():
  KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.matrix-matrix-multiply",
    "definition.symbolic.linear-algebra.cell-dot-products",
    "definition.symbolic.linear-algebra.compose-linear-maps"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.matrix-matrix-composition",
    title: "Matrix-matrix composition",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "matrixMatrix.before",
        objectType: "matrix-matrix-expression",
        title: "Matrix-matrix expression before multiplication",
        selectorRoles: [
          { id: "left.matrix", kind: "matrix" },
          { id: "left.row", kind: "matrix-row" },
          { id: "left.entry", kind: "matrix-entry" },
          { id: "right.matrix", kind: "matrix" },
          { id: "right.column", kind: "matrix-column" },
          { id: "right.entry", kind: "matrix-entry" }
        ]
      },
      {
        id: "matrixMatrix.after",
        objectType: "matrix-matrix-result",
        title: "Matrix-matrix result",
        selectorRoles: [
          { id: "result.matrix", kind: "matrix" },
          { id: "result.entry", kind: "matrix-entry" },
          { id: "cell.dot.product", kind: "dot-product" },
          { id: "left.linear.map", kind: "linear-map" },
          { id: "right.linear.map", kind: "linear-map" },
          { id: "composed.linear.map", kind: "linear-map-composition" }
        ]
      }
    ],
    transformationDefinitions: [
      createMatrixMatrixDefinition({
        id: "definition.symbolic.linear-algebra.matrix-matrix-multiply",
        transformType: "matrixMatrixMultiply",
        title: "Multiply two matrices",
        lawId: "law.linear-algebra.matrix-matrix",
        preserves: ["value", "structure"],
        assumption:
          "The left matrix column count equals the right matrix row count."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.cell-dot-products",
        transformType: "cellDotProducts",
        title: "Compute each result cell as a row-column dot product",
        sourceObjectRoles: ["matrixMatrix.before"],
        targetObjectRoles: ["matrixMatrix.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "Each result entry is the dot product of one left row and one right column."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.matrix-cell-dot",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "matrixMatrix.before",
            sourceSelectorRole: "left.row",
            targetObjectRole: "matrixMatrix.after",
            targetSelectorRole: "cell.dot.product",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "matrixMatrix.before",
            sourceSelectorRole: "right.column",
            targetObjectRole: "matrixMatrix.after",
            targetSelectorRole: "cell.dot.product",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "matrixMatrix.before",
            sourceSelectorRole: "left.entry",
            targetObjectRole: "matrixMatrix.after",
            targetSelectorRole: "cell.dot.product",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "matrixMatrix.before",
            sourceSelectorRole: "right.entry",
            targetObjectRole: "matrixMatrix.after",
            targetSelectorRole: "cell.dot.product",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "matrixMatrix.before",
            sourceSelectorRole: "left.matrix",
            targetObjectRole: "matrixMatrix.after",
            targetSelectorRole: "result.matrix",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "matrixMatrix.before",
            sourceSelectorRole: "right.matrix",
            targetObjectRole: "matrixMatrix.after",
            targetSelectorRole: "result.matrix",
            preserves: ["value", "role"]
          }
        ]
      }),
      createMatrixMatrixDefinition({
        id: "definition.symbolic.linear-algebra.compose-linear-maps",
        transformType: "composeLinearMaps",
        title: "Compose the two matrices as linear maps",
        lawId: "law.linear-algebra.linear-map-composition",
        preserves: ["value", "presentation"],
        assumption:
          "Matrix multiplication represents order-sensitive composition of the represented linear maps."
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.matrix-matrix.cell-dot-grid",
        motifKind: "cell-dot-grid",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.cell-dot-products",
          "definition.symbolic.linear-algebra.matrix-matrix-multiply"
        ],
        summary:
          "Each output cell is staged as a row-column dot product in a reusable grid beat."
      },
      {
        id: "motif.linear-algebra.matrix-matrix.map-composition",
        motifKind: "linear-map-composition",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.compose-linear-maps"
        ],
        summary:
          "The right map applies first, then the left map, matching the composed matrix order."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.matrix-matrix.basic",
        animationId:
          "animation.generated.linear-algebra.matrix-matrix.two-by-two",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.matrix-matrix-multiply"
        ],
        summary:
          "Generated matrix-matrix sample multiplies two two-by-two matrices and preserves the product matrix."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.matrix-matrix.linear-map-composition",
        title: "Matrix multiplication composes linear maps",
        representationKind: "linear-map-composition",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.matrix-matrix-linear-map-composition",
            level: "strict"
          }
        ],
        sampleAssetIds: [
          "animation.generated.linear-algebra.matrix-matrix.two-by-two"
        ],
        summary:
          "Matrix-matrix multiplication preserves the order-sensitive composition of the two linear maps."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-matrix-matrix",
        fixtureFamilyId: "generated.linear-algebra-matrix-matrix",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated matrix multiplication traces can map each result entry to row-column dot products and graph composition."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.matrix-matrix.cell",
        kind: "predict-next",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.cell-dot-products",
          "definition.symbolic.linear-algebra.matrix-matrix-multiply"
        ],
        summary:
          "Predict-next cards can ask which row and column create a selected result cell."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.matrix-matrix-composition"
      ),
      tags: [
        "matrix",
        "composition",
        "dot-product",
        "linear-map",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for matrix multiplication as composed dot-product subanimations and linear-map composition.",
      searchSummary:
        "matrix multiplication dot products composition columns rows higher order animation linear map graph",
      graphEquivalentKinds: "linear-map-composition",
      composition: "matrix multiplication as composed dot products"
    }
  });
}

function createMatrixMatrixDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly ("value" | "structure" | "presentation")[];
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["matrixMatrix.before"],
    targetObjectRoles: ["matrixMatrix.after"],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "matrixMatrix.before",
        sourceSelectorRole: "left.matrix",
        targetObjectRole: "matrixMatrix.after",
        targetSelectorRole: "left.linear.map",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "matrixMatrix.before",
        sourceSelectorRole: "right.matrix",
        targetObjectRole: "matrixMatrix.after",
        targetSelectorRole: "right.linear.map",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "matrixMatrix.before",
        sourceSelectorRole: "left.entry",
        targetObjectRole: "matrixMatrix.after",
        targetSelectorRole: "result.entry",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "matrixMatrix.before",
        sourceSelectorRole: "right.entry",
        targetObjectRole: "matrixMatrix.after",
        targetSelectorRole: "result.entry",
        preserves: ["value", "role"]
      }
    ]
  });
}

export function createLinearAlgebraRowOperationsFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.row-swap",
    "definition.symbolic.linear-algebra.row-scale",
    "definition.symbolic.linear-algebra.row-replacement"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.row-operations",
    title: "Row operations",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "rowOperation.before",
        objectType: "augmented-matrix-or-system",
        title: "Augmented matrix or system before an elementary row operation",
        selectorRoles: [
          { id: "matrix", kind: "matrix" },
          { id: "row", kind: "matrix-row" },
          { id: "row.entry", kind: "matrix-entry" },
          { id: "equation.system", kind: "equation-system" },
          { id: "solution.set", kind: "solution-set" },
          { id: "determinant", kind: "determinant" }
        ]
      },
      {
        id: "rowOperation.after",
        objectType: "row-operation-result",
        title: "Result after an elementary row operation",
        selectorRoles: [
          { id: "matrix", kind: "matrix" },
          { id: "row", kind: "matrix-row" },
          { id: "row.entry", kind: "matrix-entry" },
          { id: "equivalent.system", kind: "equation-system" },
          { id: "solution.set", kind: "solution-set" },
          { id: "determinant.factor", kind: "determinant-factor" },
          { id: "operation.annotation", kind: "annotation" }
        ]
      }
    ],
    transformationDefinitions: [
      createRowOperationDefinition({
        id: "definition.symbolic.linear-algebra.row-swap",
        transformType: "rowSwap",
        title: "Swap two rows",
        lawId: "law.linear-algebra.row-swap",
        assumption:
          "Swapping two equations preserves the solution set and flips determinant sign."
      }),
      createRowOperationDefinition({
        id: "definition.symbolic.linear-algebra.row-scale",
        transformType: "rowScale",
        title: "Scale a row by a nonzero scalar",
        lawId: "law.linear-algebra.row-scale",
        assumption:
          "Scaling an equation by a nonzero scalar preserves the solution set and scales determinant value."
      }),
      createRowOperationDefinition({
        id: "definition.symbolic.linear-algebra.row-replacement",
        transformType: "rowReplacement",
        title: "Replace a row by itself plus a multiple of another row",
        lawId: "law.linear-algebra.row-replacement",
        assumption:
          "Adding a multiple of one equation to another preserves both the solution set and determinant."
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.row-operation.swap-slide",
        motifKind: "row-swap-slide",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.row-swap"
        ],
        summary:
          "Selected rows exchange positions while row identities remain visible through the swap."
      },
      {
        id: "motif.linear-algebra.row-operation.scale-pulse",
        motifKind: "row-scale-pulse",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.row-scale"
        ],
        summary:
          "A nonzero scalar focus propagates across each entry in the selected row."
      },
      {
        id: "motif.linear-algebra.row-operation.replacement-compose",
        motifKind: "row-replacement-compose",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.row-replacement"
        ],
        summary:
          "A scaled source row is composed into a target row without changing the solution set."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.row-operations.basic",
        animationId: "animation.row-operations.basic",
        renderTargetKinds: ["equation", "matrix", "graph"],
        transformationDefinitionIds: definitionIds,
        summary:
          "Basic row-operation sample links matrix row edits to equivalent systems and determinant annotations."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.row-operations.solution-set",
        title: "Elementary row operations preserve solution sets",
        representationKind: "solution-set",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.row-operations-solution-set",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.row-operations.basic"],
        summary:
          "Row operations can be shown as equivalent-system moves while the represented solution set persists."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-row-operations",
        fixtureFamilyId: "generated.linear-algebra-row-operations",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated elimination traces can map each elementary row operation to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.row-operations.effect",
        kind: "relationship",
        transformationDefinitionIds: definitionIds,
        summary:
          "Relationship cards can ask how each row operation affects solution sets and determinants."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.row-operations"
      ),
      tags: [
        "row-operation",
        "system",
        "determinant",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for row swap, row scale, and row replacement with solution-set provenance and determinant impact metadata.",
      searchSummary:
        "row operations swap scale replacement gaussian elimination determinant system equations solution set",
      graphEquivalentKinds: "solution-set",
      determinantImpact:
        "swap flips sign, scale multiplies determinant, replacement preserves determinant"
    }
  });
}

function createRowOperationDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["rowOperation.before"],
    targetObjectRoles: ["rowOperation.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "rowOperation.before",
        sourceSelectorRole: "row",
        targetObjectRole: "rowOperation.after",
        targetSelectorRole: "row",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "rowOperation.before",
        sourceSelectorRole: "row.entry",
        targetObjectRole: "rowOperation.after",
        targetSelectorRole: "row.entry",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "rowOperation.before",
        sourceSelectorRole: "equation.system",
        targetObjectRole: "rowOperation.after",
        targetSelectorRole: "equivalent.system",
        preserves: ["value", "structure"]
      },
      {
        sourceObjectRole: "rowOperation.before",
        sourceSelectorRole: "solution.set",
        targetObjectRole: "rowOperation.after",
        targetSelectorRole: "solution.set",
        preserves: ["identity", "value"]
      },
      {
        sourceObjectRole: "rowOperation.before",
        sourceSelectorRole: "determinant",
        targetObjectRole: "rowOperation.after",
        targetSelectorRole: "determinant.factor",
        preserves: ["value", "role"]
      }
    ]
  });
}

export function createLinearAlgebraDeterminantInverseFamily():
  KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.determinant-compute",
    "definition.symbolic.linear-algebra.determinant-area-volume",
    "definition.symbolic.linear-algebra.matrix-inverse",
    "definition.symbolic.linear-algebra.inverse-undo-linear-map"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.determinant-inverse",
    title: "Determinant and inverse",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "determinantInverse.before",
        objectType: "linear-map-or-matrix",
        title: "Matrix or linear map before determinant and inverse analysis",
        selectorRoles: [
          { id: "matrix", kind: "matrix" },
          { id: "matrix.entry", kind: "matrix-entry" },
          { id: "determinant", kind: "determinant" },
          { id: "input.vector", kind: "vector" },
          { id: "unit.area", kind: "area" },
          { id: "unit.volume", kind: "volume" }
        ]
      },
      {
        id: "determinantInverse.after",
        objectType: "determinant-inverse-result",
        title: "Determinant scale and inverse result",
        selectorRoles: [
          { id: "determinant.value", kind: "scalar" },
          { id: "area.volume.scale", kind: "scale-factor" },
          { id: "inverse.matrix", kind: "matrix" },
          { id: "output.vector", kind: "vector" },
          { id: "identity.map", kind: "linear-map" },
          { id: "orientation", kind: "orientation" }
        ]
      }
    ],
    transformationDefinitions: [
      createDeterminantInverseDefinition({
        id: "definition.symbolic.linear-algebra.determinant-compute",
        transformType: "determinantCompute",
        title: "Compute the determinant",
        lawId: "law.linear-algebra.determinant",
        preserves: ["value", "structure"],
        assumption:
          "The determinant is computed from a square matrix and produces a scalar value."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.determinant-area-volume",
        transformType: "determinantAreaVolumeScale",
        title: "View determinant as area or volume scale",
        sourceObjectRoles: ["determinantInverse.before"],
        targetObjectRoles: ["determinantInverse.after"],
        preserves: ["value", "presentation"],
        assumptions: [
          "The determinant magnitude gives area or volume scale, and its sign records orientation."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.determinant-area-volume",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "matrix",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "area.volume.scale",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "determinant",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "determinant.value",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "unit.area",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "area.volume.scale",
            preserves: ["presentation", "role"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "unit.volume",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "area.volume.scale",
            preserves: ["presentation", "role"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "determinant",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "orientation",
            preserves: ["value", "role"]
          }
        ]
      }),
      createDeterminantInverseDefinition({
        id: "definition.symbolic.linear-algebra.matrix-inverse",
        transformType: "matrixInverse",
        title: "Construct the inverse matrix",
        lawId: "law.linear-algebra.matrix-inverse",
        preserves: ["value", "structure"],
        assumption:
          "The matrix has nonzero determinant, so an inverse matrix exists."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.inverse-undo-linear-map",
        transformType: "inverseUndoLinearMap",
        title: "Use the inverse to undo a linear map",
        sourceObjectRoles: ["determinantInverse.before"],
        targetObjectRoles: ["determinantInverse.after"],
        preserves: ["value", "presentation"],
        assumptions: [
          "Composing an invertible matrix with its inverse returns the identity map."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.inverse-linear-map",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "matrix",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "inverse.matrix",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "determinant",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "inverse.matrix",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "input.vector",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "output.vector",
            preserves: ["identity", "value"]
          },
          {
            sourceObjectRole: "determinantInverse.before",
            sourceSelectorRole: "matrix",
            targetObjectRole: "determinantInverse.after",
            targetSelectorRole: "identity.map",
            preserves: ["structure", "role"]
          }
        ]
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.determinant.area-volume-scale",
        motifKind: "area-volume-scale",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.determinant-area-volume",
          "definition.symbolic.linear-algebra.determinant-compute"
        ],
        summary:
          "A unit area or volume deforms under the matrix while determinant magnitude is tracked as scale."
      },
      {
        id: "motif.linear-algebra.determinant.orientation-flip",
        motifKind: "orientation-flip",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.determinant-area-volume"
        ],
        summary:
          "Negative determinant cases surface orientation reversal as presentation, not token identity."
      },
      {
        id: "motif.linear-algebra.inverse.map-undo",
        motifKind: "linear-map-undo",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.matrix-inverse",
          "definition.symbolic.linear-algebra.inverse-undo-linear-map"
        ],
        summary:
          "The inverse map runs the transformed vector back through the identity reference frame."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.determinant-inverse.basic",
        animationId: "animation.determinant-inverse.basic",
        renderTargetKinds: ["equation", "matrix", "graph"],
        transformationDefinitionIds: definitionIds,
        summary:
          "Basic determinant-inverse sample links determinant scale to inverse undoing on the graph."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.determinant.area-volume-scaling",
        title: "Determinant measures area or volume scaling",
        representationKind: "area-volume-scaling",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.determinant-area-volume",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.determinant-inverse.basic"],
        summary:
          "The determinant value is represented as signed area or volume scale under the linear map."
      },
      {
        id: "graph.linear-algebra.inverse.linear-map-undo",
        title: "An inverse matrix undoes a linear map",
        representationKind: "linear-map",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.inverse-linear-map-undo",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.determinant-inverse.basic"],
        summary:
          "The inverse graph view composes a matrix with its inverse to return to the identity map."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-determinant-inverse",
        fixtureFamilyId: "generated.linear-algebra-determinant-inverse",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated determinant and inverse traces can expose scale, orientation, and nonzero determinant checks."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.determinant-inverse.relationship",
        kind: "relationship",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.determinant-area-volume",
          "definition.symbolic.linear-algebra.inverse-undo-linear-map"
        ],
        summary:
          "Relationship cards can ask how determinant scale predicts invertibility and inverse behavior."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.determinant-inverse"
      ),
      tags: [
        "determinant",
        "inverse",
        "area-volume",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for determinants as area/volume scaling and inverses as undoing linear maps.",
      searchSummary:
        "determinant inverse area volume scaling orientation undo linear map graph nonzero",
      graphEquivalentKinds: "linear-map area-volume-scaling",
      invertibilityCondition: "matrix inverse requires nonzero determinant"
    }
  });
}

function createDeterminantInverseDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly ("value" | "structure" | "presentation")[];
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["determinantInverse.before"],
    targetObjectRoles: ["determinantInverse.after"],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "determinantInverse.before",
        sourceSelectorRole: "matrix",
        targetObjectRole: "determinantInverse.after",
        targetSelectorRole: "determinant.value",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "determinantInverse.before",
        sourceSelectorRole: "matrix.entry",
        targetObjectRole: "determinantInverse.after",
        targetSelectorRole: "determinant.value",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "determinantInverse.before",
        sourceSelectorRole: "determinant",
        targetObjectRole: "determinantInverse.after",
        targetSelectorRole: "determinant.value",
        preserves: ["value", "role"]
      }
    ]
  });
}

export function createLinearAlgebraBasisEigenFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.linear-algebra.change-basis",
    "definition.symbolic.linear-algebra.coordinate-transform",
    "definition.symbolic.linear-algebra.eigenvector-relation",
    "definition.symbolic.linear-algebra.diagonalization-starter"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.linear-algebra.basis-eigen",
    title: "Basis change and eigen examples",
    domain: "linear-algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "basisEigen.before",
        objectType: "basis-or-linear-map",
        title: "Basis, coordinates, and linear map before transformation",
        selectorRoles: [
          { id: "matrix", kind: "matrix" },
          { id: "basis", kind: "basis" },
          { id: "basis.vector", kind: "vector" },
          { id: "coordinate.vector", kind: "coordinate-vector" },
          { id: "eigenvector", kind: "vector" },
          { id: "eigenvalue", kind: "scalar" }
        ]
      },
      {
        id: "basisEigen.after",
        objectType: "basis-eigen-result",
        title: "Basis and eigen result",
        selectorRoles: [
          { id: "changed.basis", kind: "basis" },
          { id: "coordinate.vector", kind: "coordinate-vector" },
          { id: "transformed.vector", kind: "vector" },
          { id: "eigenline", kind: "line" },
          { id: "scaled.eigenvector", kind: "vector" },
          { id: "diagonal.matrix", kind: "matrix" }
        ]
      }
    ],
    transformationDefinitions: [
      createBasisEigenDefinition({
        id: "definition.symbolic.linear-algebra.change-basis",
        transformType: "changeBasis",
        title: "Change basis",
        lawId: "law.linear-algebra.change-basis",
        preserves: ["value", "structure"],
        assumption:
          "The new basis is invertible, so the represented vector or map is preserved under coordinate relabeling."
      }),
      createBasisEigenDefinition({
        id: "definition.symbolic.linear-algebra.coordinate-transform",
        transformType: "coordinateTransform",
        title: "Transform coordinates between bases",
        lawId: "law.linear-algebra.coordinate-transform",
        preserves: ["value", "presentation"],
        assumption:
          "Coordinate entries change representation while the underlying vector value persists."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.linear-algebra.eigenvector-relation",
        transformType: "eigenvectorRelation",
        title: "Relate eigenvectors and eigenvalues",
        sourceObjectRoles: ["basisEigen.before"],
        targetObjectRoles: ["basisEigen.after"],
        preserves: ["identity", "structure"],
        assumptions: [
          "An eigenvector is nonzero and remains on its span under the linear map."
        ],
        lawRefs: [
          {
            id: "law.linear-algebra.eigenvector",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "basisEigen.before",
            sourceSelectorRole: "matrix",
            targetObjectRole: "basisEigen.after",
            targetSelectorRole: "scaled.eigenvector",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "basisEigen.before",
            sourceSelectorRole: "eigenvector",
            targetObjectRole: "basisEigen.after",
            targetSelectorRole: "eigenline",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "basisEigen.before",
            sourceSelectorRole: "eigenvalue",
            targetObjectRole: "basisEigen.after",
            targetSelectorRole: "scaled.eigenvector",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "basisEigen.before",
            sourceSelectorRole: "eigenvector",
            targetObjectRole: "basisEigen.after",
            targetSelectorRole: "transformed.vector",
            preserves: ["identity", "value"]
          }
        ]
      }),
      createBasisEigenDefinition({
        id: "definition.symbolic.linear-algebra.diagonalization-starter",
        transformType: "diagonalizationStarter",
        title: "Use eigenvectors to form a diagonalization starter",
        lawId: "law.linear-algebra.diagonalization",
        preserves: ["value", "structure"],
        assumption:
          "The example has enough independent eigenvectors to expose a diagonal matrix representation."
      })
    ],
    visualMotifs: [
      {
        id: "motif.linear-algebra.basis.frame-morph",
        motifKind: "basis-frame-morph",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.change-basis"
        ],
        summary:
          "Basis vectors move as a frame while represented vectors keep their underlying identity."
      },
      {
        id: "motif.linear-algebra.basis.coordinate-relabel",
        motifKind: "coordinate-grid-relabel",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.coordinate-transform"
        ],
        summary:
          "Coordinate entries relabel against the new basis without implying a physical vector moved."
      },
      {
        id: "motif.linear-algebra.eigen.line-scale",
        motifKind: "eigenline-scale",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.eigenvector-relation",
          "definition.symbolic.linear-algebra.diagonalization-starter"
        ],
        summary:
          "Eigenvectors remain on their eigenline while the eigenvalue controls scaling."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.basis-eigen.basic",
        animationId: "animation.basis-eigen.basic",
        renderTargetKinds: ["equation", "matrix", "graph"],
        transformationDefinitionIds: definitionIds,
        summary:
          "Basic basis-eigen sample links coordinate changes to eigenline scaling and a diagonalization starter."
      }
    ],
    graphEquivalents: [
      {
        id: "graph.linear-algebra.basis-change.linear-map",
        title: "Basis changes relabel a linear map",
        representationKind: "linear-map",
        exactness: "exact",
        preserves: ["value", "presentation"],
        lawRefs: [
          {
            id: "law.graph.basis-change-linear-map",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.basis-eigen.basic"],
        summary:
          "Changing basis alters coordinates and grid presentation while preserving the underlying vector and linear map."
      },
      {
        id: "graph.linear-algebra.eigen.eigenline",
        title: "Eigenvectors persist as invariant directions",
        representationKind: "eigenvector-graph",
        exactness: "exact",
        preserves: ["identity", "presentation"],
        lawRefs: [
          {
            id: "law.graph.eigenvector-invariant-direction",
            level: "strict"
          }
        ],
        sampleAssetIds: ["animation.basis-eigen.basic"],
        summary:
          "The eigen graph view keeps the eigenvector on the same line while the transform scales it."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-algebra-basis-eigen",
        fixtureFamilyId: "generated.linear-algebra-basis-eigen",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated basis and eigen examples can map coordinate changes, eigen relations, and starter diagonalization steps."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.linear-algebra.basis-eigen.relationship",
        kind: "relationship",
        transformationDefinitionIds: [
          "definition.symbolic.linear-algebra.change-basis",
          "definition.symbolic.linear-algebra.eigenvector-relation"
        ],
        summary:
          "Relationship cards can ask which values change under coordinate relabeling and which directions remain invariant."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.linear-algebra.basis-eigen"
      ),
      tags: [
        "basis",
        "eigen",
        "diagonalization",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for basis changes, coordinate transforms, eigenvectors, eigenvalues, and starter diagonalization examples.",
      searchSummary:
        "basis change coordinates eigenvectors eigenvalues diagonalization invariant direction linear map graph",
      graphEquivalentKinds: "linear-map eigenvector-graph",
      spectralScope: "starter diagonalization examples, not a full eigensolver"
    }
  });
}

function createBasisEigenDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly (
    | "identity"
    | "value"
    | "structure"
    | "presentation"
  )[];
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["basisEigen.before"],
    targetObjectRoles: ["basisEigen.after"],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "basisEigen.before",
        sourceSelectorRole: "basis",
        targetObjectRole: "basisEigen.after",
        targetSelectorRole: "changed.basis",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "basisEigen.before",
        sourceSelectorRole: "basis.vector",
        targetObjectRole: "basisEigen.after",
        targetSelectorRole: "changed.basis",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "basisEigen.before",
        sourceSelectorRole: "coordinate.vector",
        targetObjectRole: "basisEigen.after",
        targetSelectorRole: "coordinate.vector",
        preserves: ["value", "presentation"]
      },
      {
        sourceObjectRole: "basisEigen.before",
        sourceSelectorRole: "matrix",
        targetObjectRole: "basisEigen.after",
        targetSelectorRole: "diagonal.matrix",
        preserves: ["value", "structure"]
      }
    ]
  });
}

export const kpLinearAlgebraSymbolicManipulationFamilyPack =
  createKpSymbolicManipulationFamilyPackDeclaration({
    id: "symbolic-family-pack.linear-algebra",
    domain: "linear-algebra",
    familyIds: [
      "family.linear-algebra.vector-add-scale",
      "family.linear-algebra.dot-projection",
      "family.linear-algebra.matrix-vector",
      "family.linear-algebra.matrix-matrix-composition",
      "family.linear-algebra.row-operations",
      "family.linear-algebra.determinant-inverse",
      "family.linear-algebra.basis-eigen"
],
    createFamilies: () => [
      createLinearAlgebraVectorAddScaleFamily(),
      createLinearAlgebraDotProjectionFamily(),
      createLinearAlgebraMatrixVectorFamily(),
      createLinearAlgebraMatrixMatrixCompositionFamily(),
      createLinearAlgebraRowOperationsFamily(),
      createLinearAlgebraDeterminantInverseFamily(),
      createLinearAlgebraBasisEigenFamily()
    ]
  });

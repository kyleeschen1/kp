---
kp:
  schema: kp.article.v1
  id: lesson.linear-algebra.normal-matrix-proof.article
  imports:
    normalMatrixProof: vignette.linear-algebra.normal-matrix-proof@1
---

# Why does a normal matrix have an orthonormal eigenbasis?

A complex square matrix $M$ is **normal** when

$$
MM^{\dagger}=M^{\dagger}M.
$$

The spectral theorem says that this algebraic symmetry is exactly what lets us
choose an orthonormal basis in which $M$ is diagonal. The proof below isolates
the one comparison that makes the induction work: the first row and first
column must have the same squared norm.

### Prerequisites in one place

Here $M^{\dagger}$ is the conjugate transpose. A unitary matrix $U$ preserves
inner products, and changing to an orthonormal basis replaces $M$ by
$U^{\dagger}MU$. Normality survives that change of coordinates.

We will also use two facts. First, the characteristic polynomial has a complex
root, so a complex matrix has an eigenvalue. Second, $\lVert w\rVert^2=0$ only when
$w=0$. If either fact feels unavailable, pause here: the animation will expose
where the facts are used, but it cannot replace them.

### The two hinges

The proof turns on two observations.

1. The $i$th diagonal entry of $MM^{\dagger}$ is the squared norm of row $i$.
2. The $i$th diagonal entry of $M^{\dagger}M$ is the squared norm of column $i$.

Normality therefore says that each row has the same norm as the corresponding
column. That statement alone is not enough in an arbitrary basis. We first
choose a basis whose first column has useful structure.

### Choose the useful basis

The case $n=1$ is immediate. Suppose the theorem holds in smaller dimensions.
Because the scalars are complex, $M$ has an eigenvalue $\lambda$ and a unit
eigenvector $v$. Extend $v$ to an orthonormal basis. In this basis,

$$
M=
\begin{bmatrix}
\lambda & r\\
0 & B
\end{bmatrix},
$$

where $r$ is a $1\times(n-1)$ row and $B$ is an
$(n-1)\times(n-1)$ matrix. The zeros below $\lambda$ are not a guess:
$Mv=\lambda v$ makes the first column equal to $(\lambda,0,\ldots,0)^T$.

### Compare the decisive entries

:::kp-stage{#normal-proof use=normalMatrixProof}
:::

:::kp-focus{#orient-products stage=normal-proof target="normal-proof/product-left normal-proof/product-right" context="normal-proof/matrix normal-proof/normality"}
Keep the [same matrix](kp-ref:normal-proof/matrix) and the complete
[normality equation](kp-ref:normal-proof/normality) in view. We will inspect
only one entry of the [left product](kp-ref:normal-proof/product-left) and
[right product](kp-ref:normal-proof/product-right), but the full matrix
equality remains the reason those entries agree.
:::

:::kp-motion{#read-left-entry stage=normal-proof run=normal-proof/interpret-left-first-entry}
Read the first row of the block matrix. Its two contributions form the
[top-left entry of $MM^{\dagger}$](kp-ref:normal-proof/product-left/first-entry).

::after

The first row is $(\lambda,r)$, so

$$
(MM^{\dagger})_{11}=|\lambda|^2+rr^{\dagger}
=|\lambda|^2+\lVert r\rVert^2.
$$
:::

:::kp-motion{#read-right-entry stage=normal-proof run=normal-proof/interpret-right-first-entry}
Now read the sparse first column. Its contributions form the
[top-left entry of $M^{\dagger}M$](kp-ref:normal-proof/product-right/first-entry).

::after

The first column is $(\lambda,0,\ldots,0)^T$, so

$$
(M^{\dagger}M)_{11}=|\lambda|^2.
$$
:::

:::kp-motion{#choose-eigenbasis stage=normal-proof run=normal-proof/choose-eigenvector-first-basis}
Connect the [eigenvector-first basis](kp-ref:normal-proof/eigenbasis) to the
[zero column](kp-ref:normal-proof/matrix/zero-column). This is why the column
has no contribution corresponding to the unknown row $r$.

::after

The [eigenvalue](kp-ref:normal-proof/matrix/eigenvalue),
[row remainder](kp-ref:normal-proof/matrix/row-remainder), and
[lower block](kp-ref:normal-proof/matrix/lower-block) now have distinct roles
inside one persistent matrix.
:::

:::kp-motion{#compare-first-entries stage=normal-proof run=normal-proof/compare-first-entries}
Use normality to compare the two first entries. Before continuing, identify
the contribution that appears on only one side.

::after

The comparison settles as the [norm equation](kp-ref:normal-proof/inference/norm-equality)

$$
|\lambda|^2+\lVert r\rVert^2=|\lambda|^2.
$$

The unmatched term is $\lVert r\rVert^2$.
:::

:::kp-motion{#force-remainder-zero stage=normal-proof run=normal-proof/force-row-remainder-zero}
Predict the next proof state: what must a nonnegative squared norm be if adding
it changes nothing?

::after

Subtracting the matched $|\lambda|^2$ terms gives $\lVert r\rVert^2=0$.
Positive-definiteness gives the stronger conclusion
[${r=0}$](kp-ref:normal-proof/inference/remainder-zero). Thus the same matrix
has the [block-diagonal form](kp-ref:normal-proof/matrix/block-diagonal)

$$
M=\lambda\oplus B.
$$
:::

### Finish the induction

:::kp-motion{#restrict-to-lower-block stage=normal-proof run=normal-proof/restrict-normality-to-lower-block}
Keep $\lambda$ as context and inspect the lower-right blocks of the original
normality equation.

::after

They give

$$
BB^{\dagger}=B^{\dagger}B,
$$

so $B$ is a [smaller normal matrix](kp-ref:normal-proof/proof/recursive-subproblem).
The induction hypothesis supplies an orthonormal eigenbasis for $B$. Combining
that basis with $v$ gives an orthonormal eigenbasis for $M$, or equivalently a
unitary matrix that diagonalizes $M$.
:::

### Pressure the proof

The complex-number assumption enters when we ask for an eigenvalue. A real
normal matrix can represent a rotation with no real eigenvector, so the same
statement is false over the reals without allowing real two-dimensional
rotation blocks or passing to complex scalars.

There is another tempting mistake. Equality of the diagonal entries of
$MM^{\dagger}$ and $M^{\dagger}M$ in one arbitrary basis says only that
corresponding row and column norms agree. It does not imply equality of the
whole products. The proof starts with full normality, uses its invariance under
unitary basis change, and only then extracts one decisive diagonal equality.

### Reconstruct the proof

:::kp-passage{#proof-map intent=reconstruction}
Try to recover the argument before reading this compact map:

1. Find a complex eigenvalue and unit eigenvector.
2. Put that eigenvector first in an orthonormal basis.
3. Compare the first row and first column norms using normality.
4. Force $r=0$, leaving $M=\lambda\oplus B$.
5. Read the lower-right block equation to show that $B$ is normal.
6. Diagonalize $B$ by induction and compose the unitary basis changes.

The review prompts ask for each dependency separately: the definition of
normality; both product-entry interpretations; the sparse-column reason; the
prediction $r=0$; positive-definiteness; inherited normality; the complete
proof spine; the complex-field dependency; and the diagonal-only trap. Every
answer above remains searchable even when a recall view hides it temporarily.
:::

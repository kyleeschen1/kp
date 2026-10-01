"""Explicitly authored research overlay, not an automatic theorem extractor.

Every source link below is a reading witness, not a claim of identical scope.
Relations and proof outlines are KP interpretations, never certified operations.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'research/la-graph'


def build():
    nodes, edges = [], []

    def node(key, title, body, sources, related=(), assumptions=(), kind='concept', steps=()):
        own = 'concept:' + key
        nodes.append(dict(id=own, title=title, body=body, book='interpretation', kind=kind,
                          evidence='authored-interpretation', format='math-text',
                          context='KP research synthesis; source scopes can differ',
                          assumptions=list(assumptions), steps=list(steps)))
        for source in sources.split():
            edges.append(dict(source=own, target=source, relation='reading-witness', evidence='authored-interpretation'))
        for relation, target in related:
            edges.append(dict(source=own, target='concept:' + target, relation=relation, evidence='authored-interpretation'))

    def b(section, kind, acro):
        return f'beezer:section-{section}:{kind}-{acro}'

    # Explicit concept vocabulary; no synonym or equivalence edges inferred from
    # word overlap. The field/basis/metric assumptions belong to each assertion.
    node('space', 'Vector space', r'A set $V$ with vector addition and scalar multiplication over a field $F$, satisfying the vector-space axioms. Its elements need not be arrows or lists.',
         b('VS','definition','VS') + ' hefferon:def:VecSpace', assumptions=['A specified scalar field F and specified operations.'])
    node('vector', 'Vector', r'An element $v\in V$. A polynomial, function, matrix or coordinate tuple can be a vector when its ambient vector space is specified.',
         b('VO','definition','VSCV') + ' ila:vectors:vectors-definition-1', [('inhabits','space')])
    node('scalar', 'Scalar multiplication', r'The action $(a,v)\mapsto av$ of $F$ on $V$. Scaling a coordinate list is one representation of this operation.',
         b('VO','definition','CVSM') + ' hefferon:df:VectorScalarMultiplication', [('acts-on','vector'),('requires','space')])
    node('combination', 'Linear combination', r'A finite sum $a_1v_1+\cdots+a_nv_n$. The coefficients and the selected vectors have different semantic roles even when both are displayed as numbers.',
         b('S','definition','LC') + ' hefferon:def:linearcombination', [('uses','scalar'),('uses','vector')])
    node('span', 'Span', r'$\operatorname{span}(v_1,\ldots,v_k)$ is the set of all linear combinations of the listed vectors.',
         b('S','definition','SS') + ' hefferon:df:Span', [('constructed-from','combination'),('is-a','subspace')])
    node('subspace', 'Subspace', r'A subset $U\subseteq V$ containing zero and closed under addition and scalar multiplication, with the inherited operations.',
         b('S','definition','S') + ' ila:subspaces:subspaces-defn-of', [('inherits-from','space')])
    node('independence', 'Linear independence', r'A list is linearly independent when $\sum_i a_iv_i=0$ forces every $a_i=0$. Dependence concerns the entire list, not a property of an isolated nonzero vector.',
         b('LISS','definition','LI') + ' hefferon:def:LinInd', [('constrains','combination')])
    node('basis', 'Ordered basis', r'An ordered list $\mathcal B=(b_1,\ldots,b_n)$ that spans $V$ and is linearly independent. The order matters for coordinates.',
         b('B','definition','B') + ' hefferon:def:basis', [('requires','span'),('requires','independence'),('belongs-to','space')], ['Finite-dimensional V for this finite-list presentation.'])
    node('dimension', 'Dimension', r'The number of vectors in any basis of a finite-dimensional space. Equality of basis sizes is a theorem, not an arbitrary display convention.',
         b('D','definition','D') + ' hefferon:df:Dimension', [('measures','space'),('uses','basis')], ['Finite-dimensional vector space.'])
    node('coordinates', 'Coordinates in a basis', r'$[v]_{\mathcal B}=(a_1,\ldots,a_n)^T$ means $v=\sum_i a_ib_i$. Changing the basis changes this list without changing $v$.',
         b('VR','definition','VR') + ' ila:b-coordinates:dimension-defn-Bcoords', [('represents','vector'),('requires','basis'),('uses','combination')])
    node('polynomial', 'Polynomial as a vector', r'For $p=a_0+a_1x+a_2x^2+a_3x^3$, the coefficient column is $[p]_{(1,x,x^2,x^3)}=(a_0,a_1,a_2,a_3)^T$. The symbols being removed in a view still identify basis vectors in the semantic model.',
         b('D','theorem','DP') + ' hefferon:def:VecSpace', [('is-a','vector'),('represented-by','coordinates'),('requires','basis')], ['Formal polynomials of degree at most 3 over F, including the zero polynomial.'], 'representation')
    node('map', 'Linear map', r'$T:V\to W$ satisfies $T(u+v)=T(u)+T(v)$ and $T(av)=aT(v)$. Domain, codomain and scalar field are part of its context.',
         b('LT','definition','LT') + ' ila:linear-trans:linear-trans-defn hefferon:def:Homo', [('between','space'),('preserves','combination')], ['V and W are vector spaces over the same field.'])
    node('matrix', 'Matrix', r'An $m\times n$ array over $F$. It can encode a linear map in chosen bases, a system of equations, or a collection of vectors; those roles are additional context.',
         b('RREF','definition','M') + ' hefferon:df:matrix', [('can-represent','map'),('can-represent','system')])
    node('matrix-representation', 'Matrix of a linear map', r'$[T]_{\mathcal C\leftarrow\mathcal B}$ has column $j$ equal to $[T(b_j)]_{\mathcal C}$. It satisfies $[T(v)]_{\mathcal C}=[T]_{\mathcal C\leftarrow\mathcal B}[v]_{\mathcal B}$.',
         b('MR','definition','MR') + ' hefferon:def:MatRepMap', [('represents','map'),('uses','coordinates'),('requires','basis'),('is-a','matrix')], ['Finite-dimensional domain and codomain; ordered bases B and C.'], 'representation')
    node('row', 'Matrix row', r'Row $i$ of $A$ records the coefficients of the $i$th output coordinate functional. As a list it is indexed by input coordinates.',
         'ila:matrixeq:matrixeq-row-column-prod ' + b('MM','theorem','EMP'), [('part-of','matrix'),('can-represent','covector')])
    node('column', 'Matrix column', r'Column $j$ of a matrix representing $T$ is the coordinate vector of $T(b_j)$. It is indexed by output coordinates.',
         b('MM','definition','MVP') + ' ila:linear-trans:matrix-of-transformation', [('part-of','matrix'),('can-represent','vector'),('uses','matrix-representation')])
    node('covector', 'Covector / linear functional', r'A linear map $\varphi:V\to F$. A row of coefficients represents it after choosing a basis. The pairing $\varphi(v)$ needs no inner product.',
         'axler:page-119', [('is-a','map'),('inhabits','dual'),('acts-on','vector')])
    node('dual', 'Dual space', r'$V^*=\operatorname{Hom}(V,F)$, the vector space of linear functionals on $V$. An identification of $V$ with $V^*$ requires extra choices or structure.',
         'axler:page-119', [('is-a','space'),('contains','covector')])
    node('pairing', 'Covector–vector evaluation', r'$\varphi(v)=\sum_i\varphi(b_i)[v]_{\mathcal B,i}$. This is bilinear over $F$. It differs from a complex inner product, which conjugates one argument.',
         'axler:page-119 ila:matrixeq:matrixeq-row-column-prod', [('uses','covector'),('uses','vector'),('uses','coordinates')], ['Matching basis and dual-coordinate convention.'])
    node('matvec', 'Matrix–vector product', r'$Ax=\sum_jx_jA_{:,j}$. Its $i$th entry is the evaluation of row $i$ on $x$. These are two presentations of one product.',
         b('MM','definition','MVP') + ' ila:matrixeq:matrixeq-defn-Ax1', [('uses','matrix'),('uses','column'),('uses','pairing'),('represents','map'),('uses','combination')], ['A is m×n; x has n coordinates.'])
    node('product', 'Matrix multiplication', r'For $A\in F^{m\times n}$ and $B\in F^{n\times p}$, $(AB)_{ij}=\sum_k A_{ik}B_{kj}$. Rows, columns, entries and both factor maps must remain addressable within this one object.',
         b('MM','definition','MM') + ' ila:matrix-mult:matrix-mult-defn-of hefferon:def:MatMult', [('uses','row'),('uses','column'),('uses','pairing'),('uses','matvec'),('represents','composition')], ['Matching inner dimension n; compatible intermediate coordinates.'])
    node('composition', 'Composition of linear maps', r'For $S:U\to V$ and $T:V\to W$, $(T\circ S)(u)=T(S(u))$. The rightmost map acts first.',
         b('LT','definition','LTC') + ' ila:matrix-mult:matrix-mult-definition-1', [('uses','map')], ['The output of S is in the domain of T.'])
    node('outer', 'Outer-product expansion', r'$AB=\sum_k A_{:,k}B_{k,:}$. Each summand is a column times a row, producing an $m\times p$ matrix of rank at most one.',
         b('MM','theorem','EMP'), [('represents','product'),('uses','column'),('uses','row'),('uses','rank')], ['A is m×n; B is n×p; expansion follows entrywise.'], 'representation')
    node('system', 'Linear system', r'$Ax=b$ asks for all input coordinates that produce the chosen output. It can be read as simultaneous equations, a column combination, or a preimage under a map.',
         b('MM','theorem','SLEMM') + ' ila:systems-eqns:systems-eqns-definition-1', [('uses','matvec'),('uses','preimage')])
    node('elimination', 'Gaussian elimination', r'Invertible elementary row operations transform an augmented system while preserving its solution set. The numerical coefficient matrix changes.',
         b('RREF','definition','RO') + ' hefferon:df:GaussMethod', [('acts-on','system'),('uses','elementary'),('produces','rref')])
    node('elementary', 'Elementary matrix', r'Applying a single elementary row operation to the identity produces $E$. Left multiplication by $E$ applies that row operation.',
         b('DM','definition','ELEM'), [('is-a','matrix'),('uses','identity'),('has-property','inverse')])
    node('rref', 'Reduced row-echelon form', r'A row-echelon matrix whose pivots are 1 and are the only nonzero entries in their columns. RREF is unique within a row-equivalence class.',
         b('RREF','definition','RREF') + ' ila:row-reduction:row-reduction-definition-4', [('is-a','matrix'),('reveals','rank'),('reveals','kernel')])
    node('kernel', 'Kernel / null space', r'$\ker T=\{v:T(v)=0\}$. It is a subspace of the domain. Matrix null-space coordinates depend on the input basis.',
         b('ILT','definition','KLT') + ' hefferon:df:NullSpace', [('is-a','subspace'),('belongs-to','map')])
    node('image', 'Image / range', r'$\operatorname{im}T=\{T(v):v\in V\}$. For $x\mapsto Ax$ in standard coordinates this is the span of the columns of $A$. The codomain may be larger.',
         b('SLT','definition','RLT') + ' hefferon:df:RangeSpace', [('is-a','subspace'),('belongs-to','map'),('represented-by','span')])
    node('preimage', 'Preimage / solution fiber', r'$T^{-1}(b)=\{v:T(v)=b\}$. If nonempty and $T$ is linear, it equals $v_0+\ker T$ for any one solution $v_0$. It need not be a subspace.',
         b('LT','definition','PI') + ' ' + b('ILT','theorem','KPI'), [('belongs-to','map'),('uses','kernel')])
    node('rank', 'Rank', r'$\operatorname{rank}T=\dim(\operatorname{im}T)$. For a matrix this equals column rank and row rank.',
         b('IVLT','definition','ROLT') + ' ila:rank-thm:rank-thm-definition-1', [('measures','image'),('uses','dimension')])
    node('injective', 'Injectivity', r'$T(u)=T(v)$ implies $u=v$. A linear map is injective exactly when its kernel is zero.',
         b('ILT','definition','ILT') + ' ila:one-one-onto:one-one-onto-definition-1', [('property-of','map'),('constrains','kernel')])
    node('surjective', 'Surjectivity', r'Every element of the specified codomain is attained. Surjectivity is equality of image and codomain, so the codomain cannot be omitted from the object.',
         b('SLT','definition','SLT') + ' ila:one-one-onto:one-one-onto-definition-2', [('property-of','map'),('constrains','image')])
    node('identity', 'Identity', r'$I_V(v)=v$. In matching input and output bases its matrix is the identity matrix. Its columns show the original basis vectors unchanged.',
         b('IVLT','definition','IDLT') + ' ila:linear-trans:linear-trans-identity-mat', [('is-a','map'),('unit-for','composition')])
    node('inverse', 'Inverse', r'For a bijective linear map $T$, the inverse $T^{-1}$ satisfies $T^{-1}T=I$ and $TT^{-1}=I$. A left inverse alone is insufficient for arbitrary rectangular maps.',
         b('IVLT','definition','IVLT') + ' ila:matrix-inv:matrix-inv-definition-1', [('requires','injective'),('requires','surjective'),('uses','composition'),('uses','identity')])
    node('change-basis', 'Change of basis', r'If $P$ has columns $[c_j]_{\mathcal B}$, then $[v]_{\mathcal B}=P[v]_{\mathcal C}$. This changes coordinates, not the underlying vector.',
         b('CB','definition','CBM') + ' hefferon:df:ChangeOfBasisMatrix', [('acts-on','coordinates'),('requires','basis'),('uses','inverse')])
    node('similarity', 'Similarity', r'$B=P^{-1}AP$ with $P$ invertible. These matrices can represent the same endomorphism in two bases.',
         b('SD','definition','SIM') + ' ila:similarity:similarity-definition-1', [('uses','change-basis'),('relates','matrix-representation')])
    node('eigen', 'Eigenvector and eigenvalue', r'$Tv=\lambda v$ with $v\ne0$. The invariant direction is essential; the zero vector is excluded even though it satisfies the equation for every scalar.',
         b('CB','definition','EELT') + ' hefferon:def:Eigen', [('uses','map'),('uses','scalar'),('uses','vector')], ['T is an endomorphism V→V; λ belongs to the chosen scalar field.'])
    node('eigenspace', 'Eigenspace', r'$E_\lambda=\ker(T-\lambda I)$. It includes zero; its nonzero vectors are the eigenvectors for $\lambda$.',
         b('EE','definition','EM'), [('is-a','kernel'),('contains','eigen'),('uses','identity')])
    node('diagonalization', 'Diagonalization', r'$A=PDP^{-1}$ where $D$ is diagonal. The columns of $P$ are a basis of eigenvectors, and the corresponding eigenvalues are the diagonal entries of $D$.',
         b('SD','definition','DZM') + ' ila:diagonalization:diagonalization-thm', [('uses','similarity'),('requires','basis'),('requires','eigen')], ['A square matrix over F; an eigenbasis over F exists.'])
    node('inner', 'Inner product', r'An inner product supplies lengths and angles. On $\mathbb R^n$ the standard product is $x^Ty$; on $\mathbb C^n$ a Hermitian product conjugates one argument. The argument convention must be recorded.',
         b('O','definition','IP') + ' ila:innerprod:innerprod-definition-1', [('structure-on','space'),('uses','pairing')], ['Positive-definite inner product over R or C; explicitly chosen conjugate-linear slot.'])
    node('orthogonal', 'Orthogonality', r'$u\perp v$ means $\langle u,v\rangle=0$. Without an inner product this relation is not available.',
         b('O','definition','OV') + ' ila:innerprod:innerprod-definition-4', [('requires','inner')])
    node('orthonormal', 'Orthonormal basis', r'A basis with $\langle q_i,q_j\rangle=\delta_{ij}$. Pairwise orthogonality alone does not imply unit length.',
         b('O','definition','ONS'), [('is-a','basis'),('requires','orthogonal'),('requires','inner')])
    node('projection', 'Orthogonal projection', r'$v=P_Uv+(v-P_Uv)$ with $P_Uv\in U$ and residual in $U^\perp$. This is a decomposition of one vector into complementary components.',
         'ila:projections:projections-decomp-exists hefferon:def:OrthComp', [('uses','subspace'),('requires','inner'),('uses','orthogonal'),('is-a','map')], ['Finite-dimensional subspace U of a real or complex inner-product space.'])
    node('least-squares', 'Least squares', r'Minimize $\|Ax-b\|^2$. Over the reals, minimizers solve $A^T(Ax-b)=0$. The fitted vector is unique; the coefficient vector need not be.',
         'ila:leastsquares:leastsquares-ATA-method', [('uses','projection'),('uses','system'),('uses','kernel')], ['Real finite-dimensional Euclidean spaces; use A* over C.'])
    node('gram-schmidt', 'Gram–Schmidt', r'Subtract projections onto previously constructed orthonormal directions, then normalize. Independence ensures each residual to be normalized is nonzero.',
         b('O','theorem','GSP') + ' ila:orthosets:orthosets-theorem-2', [('uses','projection'),('requires','independence'),('produces','orthonormal')])
    node('transpose', 'Transpose and dual map', r'$A^T$ swaps row and column indices. It represents the dual map in dual bases. A transpose is not generally the inverse.',
         b('MO','definition','TM') + ' hefferon:df:Transpose axler:page-123', [('acts-on','matrix'),('uses','dual')])
    node('adjoint', 'Adjoint', r'In orthonormal bases the adjoint has matrix $A^*=\overline A^T$. With the convention linear in the first slot, $\langle Tv,w\rangle=\langle v,T^*w\rangle$.',
         b('MO','definition','A'), [('requires','inner'),('uses','transpose')])
    node('determinant', 'Determinant', r'For square $A$, $\det A$ measures signed volume scaling over $\mathbb R$ and detects invertibility. It is not defined for arbitrary rectangular matrices in this sense.',
         b('DM','definition','DM') + ' ila:determinant-volume:det-is-volume hefferon:def:Det', [('property-of','matrix'),('detects','inverse')], ['Square matrix; Euclidean oriented volume interpretation uses real coordinates.'])
    node('svd', 'Singular value decomposition', r'$A=U\Sigma V^*$ with orthonormal input and output bases and nonnegative singular values. Input and output bases may differ, unlike a similarity diagonalization.',
         'axler:page-287 axler:page-288', [('uses','orthonormal'),('uses','matrix-representation'),('reveals','rank'),('uses','adjoint')], ['Finite-dimensional real or complex inner-product spaces.'])

    node('product-entry-proof', 'Why row–column and column-combination views agree',
         r'The entry rule and the column-combination rule describe the same indexed contributions, not copied numbers that merely happen to match.',
         b('MM','theorem','EMP') + ' ila:matrix-mult:matrix-mult-comp-is-prod',
         [('explains','product'),('uses','matvec'),('uses','pairing'),('uses','composition')],
         ['A is m×n and B is n×p over the same field.'], 'claim', [
             r'Write the jth column of B as $b_j=\sum_k B_{kj}e_k$.',
             r'By linearity, $Ab_j=\sum_k B_{kj}Ae_k=\sum_k B_{kj}A_{:,k}$.',
             r'Taking output coordinate i gives $(Ab_j)_i=\sum_k A_{ik}B_{kj}$.',
             r'The columns $Ab_j$ form AB, so this is also $(AB)_{ij}$.'])
    node('rank-nullity', 'Rank–nullity', r'$\dim V=\dim\ker T+\dim\operatorname{im}T$.',
         b('IVLT','theorem','RPNDD') + ' ila:rank-thm:rank-theorem',
         [('relates','rank'),('relates','kernel'),('uses','dimension'),('uses','basis')],
         ['T:V→W is linear and V is finite-dimensional.'], 'claim', [
             r'Choose a basis $(u_1,\ldots,u_k)$ for $\ker T$ and extend it to a basis $(u_1,\ldots,u_k,v_1,\ldots,v_r)$ of V.',
             r'The vectors $T(v_i)$ span the image: expand any input in this basis and apply T.',
             r'If $\sum_i a_iT(v_i)=0$, then $\sum_i a_iv_i\in\ker T$. Independence of the extended basis forces every $a_i=0$.',
             r'Thus the image has basis $(T(v_1),\ldots,T(v_r))$, and $\dim V=k+r$.'])
    node('kernel-test', 'Injectivity is a trivial kernel', r'$T$ is injective if and only if $\ker T=\{0\}$.',
         b('ILT','theorem','KILT'), [('explains','injective'),('uses','kernel'),('uses','map')],
         ['T is a linear map.'], 'claim', [
             r'If T is injective and $T(v)=0=T(0)$, then $v=0$.',
             r'Conversely, $T(u)=T(v)$ implies $T(u-v)=0$. A trivial kernel forces $u-v=0$.'])
    node('normal-equations', 'Why least squares gives normal equations', r'The residual must be orthogonal to every column of A.',
         'ila:leastsquares:leastsquares-ATA-method', [('explains','least-squares'),('uses','projection'),('uses','orthogonal'),('uses','transpose')],
         ['A and b are real; squared Euclidean norm.'], 'claim', [
             r'The nearest vector to b in $\operatorname{Col}(A)$ is its orthogonal projection.',
             r'Therefore $Ax-b$ is orthogonal to each column of A, exactly $A^T(Ax-b)=0$.',
             r'For such a residual and any h, $\|A(x+h)-b\|^2=\|Ax-b\|^2+\|Ah\|^2$, proving minimality.',
             r'All minimizers differ by $\ker A$; uniqueness requires full column rank.'])
    node('row-equivalence-proof', 'Why elimination preserves solutions', r'For invertible elementary E, $Ax=b$ if and only if $EAx=Eb$.',
         b('RREF','theorem','REMES') + ' ' + b('DM','theorem','EMN'),
         [('explains','elimination'),('uses','inverse'),('uses','elementary')],
         ['The same row operation is applied to both coefficient matrix and right side.'], 'claim', [
             r'Apply E to both sides of $Ax=b$ to get $EAx=Eb$.',
             r'Apply $E^{-1}$ to the transformed equation to recover $Ax=b$.',
             r'Iterate this equivalence for the sequence of elementary operations.'])
    node('field-eigen', 'A real rotation can have no real eigenvectors',
         r'$R=\begin{pmatrix}0&-1\\1&0\end{pmatrix}$ has characteristic polynomial $\lambda^2+1$. It has no eigenvalues over $\mathbb R$, and eigenvalues $i,-i$ over $\mathbb C$.',
         'ila:cplx-eigenvals:cplx-diagonalization-thm', [('contrasts','eigen'),('uses','determinant')],
         ['The field changes the permitted eigenvalues and eigenvectors.'], 'counterexample')
    node('vector-coordinates', 'Vector ≠ its coordinate list',
         r'The polynomial $p=1+x$ has coordinates $(1,1)$ in $(1,x)$ and $(1,0)$ in $(1+x,x)$. The object p has not changed.',
         b('VR','definition','VR'), [('contrasts','vector'),('contrasts','coordinates'),('uses','polynomial'),('uses','change-basis')], kind='counterexample')
    node('row-vs-similarity', 'Row equivalence ≠ similarity',
         r'$I_2$ and $\operatorname{diag}(2,1)$ are row equivalent over $\mathbb R$, but are not similar: their eigenvalues differ. Elimination preserves system solutions when the right side changes too; similarity preserves the represented operator under a basis change.',
         b('SD','theorem','SMEE') + ' ' + b('RREF','definition','REM'), [('contrasts','elimination'),('contrasts','similarity'),('uses','eigen')], kind='counterexample')
    node('pairing-vs-inner', 'Bilinear pairing ≠ Hermitian inner product',
         r'For $z=(1,i)^T$, $z^Tz=0$ but $z^*z=2$. Rotating a displayed column into a row cannot silently decide whether to conjugate it.',
         'axler:page-119 ' + b('O','definition','IP'), [('contrasts','pairing'),('contrasts','inner'),('uses','adjoint')], kind='counterexample')
    node('inverse-vs-transpose', 'Transpose ≠ inverse',
         r'For $A=\operatorname{diag}(2,1)$ over $\mathbb R$, $A^T=A$ while $A^{-1}=\operatorname{diag}(1/2,1)$. For real orthogonal matrices these operations do agree.',
         b('MINM','definition','UM') + ' ' + b('MISLE','definition','MI'), [('contrasts','transpose'),('contrasts','inverse'),('uses','orthonormal')], kind='counterexample')
    node('nonunique-fit', 'Unique fit ≠ unique coefficients',
         r'With $A=\begin{pmatrix}1&1\end{pmatrix}$ and $b=1$, every $x=(t,1-t)^T$ has zero residual. The fitted output is uniquely 1, but the coefficient vector is not unique.',
         'ila:leastsquares:leastsquares-theorem-2', [('contrasts','least-squares'),('uses','kernel'),('uses','rank')], kind='counterexample')

    corpus = json.loads((OUT / 'corpus.json').read_text())
    ids = {n['id'] for n in corpus['nodes'] + nodes}
    missing = [e for e in edges if e['target'] not in ids]
    if missing:
        raise ValueError(f'Invalid authored witness or concept: {missing}')
    payload = dict(schemaVersion=1, nodes=nodes, edges=edges,
                   note='KP-authored paraphrases, examples and informal proof outlines. Reading witnesses do not assert identical hypotheses across books. No formal verification or animation support implied.')
    (OUT / 'interpretation.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(interpretedNodes=len(nodes), interpretedEdges=len(edges))))


if __name__ == '__main__':
    build()

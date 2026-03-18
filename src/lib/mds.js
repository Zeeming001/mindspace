/**
 * Classical Multidimensional Scaling (cMDS)
 *
 * Takes an N×N distance matrix and returns 2D coordinates that
 * best preserve those distances in Euclidean space.
 *
 * Algorithm:
 *   1. Square the distance matrix
 *   2. Double-center it to get the Gram matrix B
 *   3. Extract top 2 eigenvectors of B via power iteration
 *   4. Coordinates = eigenvectors scaled by sqrt(eigenvalues)
 *
 * This implementation is suitable for N up to ~150 in the browser.
 * For server-side computation on larger N, the same logic runs in
 * the Supabase Edge Function.
 */

/**
 * @param {number[][]} distanceMatrix  - N×N symmetric matrix, zeros on diagonal
 * @param {number}     dims            - number of output dimensions (default 2)
 * @returns {{ x: number[], y: number[], stress: number }}
 */
export function classicalMDS(distanceMatrix, dims = 2) {
  const n = distanceMatrix.length;
  if (n < 3) return { x: [0], y: [0], stress: 0 };

  // Step 1: D² matrix
  const D2 = distanceMatrix.map(row => row.map(d => d * d));

  // Step 2: Double centering → B = -0.5 * J * D² * J
  // where J = I - (1/n) * ones*onesT
  // Equivalent: B[i][j] = -0.5 * (D²[i][j] - rowMean[i] - colMean[j] + grandMean)
  const rowMeans = D2.map(row => row.reduce((s, v) => s + v, 0) / n);
  const grandMean = rowMeans.reduce((s, v) => s + v, 0) / n;

  const B = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      -0.5 * (D2[i][j] - rowMeans[i] - rowMeans[j] + grandMean)
    )
  );

  // Step 3: Power iteration for top `dims` eigenvectors
  // Uses deflation to get orthogonal eigenvectors
  const eigenvectors = [];
  const eigenvalues = [];
  let Bdeflated = B.map(row => [...row]);

  for (let d = 0; d < dims; d++) {
    const { vec, val } = powerIteration(Bdeflated, n, 200);
    eigenvectors.push(vec);
    eigenvalues.push(val);

    // Deflate: B -= λ * v * vT
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        Bdeflated[i][j] -= val * vec[i] * vec[j];
  }

  // Step 4: Coordinates = eigenvector * sqrt(max(eigenvalue, 0))
  const coords = eigenvectors.map((vec, d) =>
    vec.map(v => v * Math.sqrt(Math.max(eigenvalues[d], 0)))
  );

  // Compute stress (Kruskal's stress-1) as a quality measure
  const stress = computeStress(distanceMatrix, coords[0], coords[1]);

  return {
    x: coords[0],
    y: coords[1],
    stress,
  };
}

function powerIteration(matrix, n, iterations = 200) {
  // Start with a random unit vector (seeded for reproducibility)
  let v = Array.from({ length: n }, (_, i) => Math.sin(i * 2.399963)); // deterministic
  const norm0 = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  v = v.map(x => x / norm0);

  for (let it = 0; it < iterations; it++) {
    // v_new = B * v
    const vNew = Array(n).fill(0);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        vNew[i] += matrix[i][j] * v[j];

    const norm = Math.sqrt(vNew.reduce((s, x) => s + x * x, 0));
    if (norm < 1e-12) break;
    v = vNew.map(x => x / norm);
  }

  // Rayleigh quotient for eigenvalue
  let val = 0;
  for (let i = 0; i < n; i++) {
    let Bv_i = 0;
    for (let j = 0; j < n; j++) Bv_i += matrix[i][j] * v[j];
    val += v[i] * Bv_i;
  }

  return { vec: v, val };
}

function computeStress(distances, x, y) {
  const n = distances.length;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dij = distances[i][j];
      const eij = Math.sqrt((x[i] - x[j]) ** 2 + (y[i] - y[j]) ** 2);
      numerator += (dij - eij) ** 2;
      denominator += dij * dij;
    }
  }
  return denominator > 0 ? Math.sqrt(numerator / denominator) : 0;
}

/**
 * Build a distance matrix from survey responses.
 *
 * @param {string[]} concepts - ordered list of concept names
 * @param {Array<{concept_a, concept_b, rating}>} responses
 * @returns {number[][]} N×N distance matrix
 *
 * distance(A,B) = 1 - mean(rating / 5)
 * Missing pairs are filled with 0.5 (neutral distance).
 */
export function buildDistanceMatrix(concepts, responses) {
  const n = concepts.length;
  const idx = Object.fromEntries(concepts.map((c, i) => [c, i]));

  // Accumulate ratings
  const sums = Array.from({ length: n }, () => Array(n).fill(0));
  const counts = Array.from({ length: n }, () => Array(n).fill(0));

  for (const { concept_a, concept_b, rating } of responses) {
    const i = idx[concept_a];
    const j = idx[concept_b];
    if (i === undefined || j === undefined || i === j) continue;
    const d = 1 - rating / 5;
    sums[i][j] += d;
    sums[j][i] += d;
    counts[i][j]++;
    counts[j][i]++;
  }

  // Build matrix; fill missing with 0.5
  const dist = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 0;
      return counts[i][j] > 0 ? sums[i][j] / counts[i][j] : 0.5;
    })
  );

  return dist;
}

/**
 * Normalize MDS coordinates to fill a [0, 1] bounding box.
 */
export function normalizeCoords(x, y) {
  const minX = Math.min(...x), maxX = Math.max(...x);
  const minY = Math.min(...y), maxY = Math.max(...y);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  return {
    x: x.map(v => (v - minX) / rangeX),
    y: y.map(v => (v - minY) / rangeY),
  };
}

/**
 * Agglomerative hierarchical clustering with Ward linkage.
 *
 * Ward's criterion merges the pair of clusters whose union minimises the
 * increase in total within-cluster sum of squares.  For 2D coordinates this
 * is both cheap (O(n³) for n ≤ 100) and produces compact, visually clear
 * clusters without requiring a pre-specified k.
 *
 * The optimal k is selected automatically using the mean silhouette score
 * (tries k = 2 … min(maxK, n-1), picks the highest score).
 *
 * @param {number[]} x    - x coordinates (length n, already normalised 0-1)
 * @param {number[]} y    - y coordinates (length n)
 * @param {number}   maxK - maximum k to consider (default 10)
 * @returns {number[]} assignments - cluster index (0-based) per point
 */
export function hierarchicalCluster(x, y, maxK = 10) {
  const n = x.length;
  if (n <= 2) return x.map((_, i) => i);

  // Each cluster: { indices, cx (centroid x), cy (centroid y) }
  let clusters = x.map((xi, i) => ({ indices: [i], cx: xi, cy: y[i] }));

  // clusterHistory[k] = assignments array captured when there were k clusters
  // (recorded just before the merge that reduces the count from k to k-1).
  const clusterHistory = {};

  while (clusters.length > 1) {
    // Snapshot assignments for the current cluster count
    const k = clusters.length;
    const asgn = new Array(n);
    clusters.forEach((cl, ci) => cl.indices.forEach(idx => { asgn[idx] = ci; }));
    clusterHistory[k] = asgn;

    // Find the pair (i, j) with the minimum Ward linkage distance.
    // Ward distance: Δ(A,B) = (nA·nB)/(nA+nB) · ‖μA−μB‖²
    let minDist = Infinity, mergeI = 0, mergeJ = 1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const na = clusters[i].indices.length, nb = clusters[j].indices.length;
        const dx = clusters[i].cx - clusters[j].cx;
        const dy = clusters[i].cy - clusters[j].cy;
        const d = (na * nb) / (na + nb) * (dx * dx + dy * dy);
        if (d < minDist) { minDist = d; mergeI = i; mergeJ = j; }
      }
    }

    // Merge cluster mergeJ into mergeI (weighted centroid update)
    const a = clusters[mergeI], b = clusters[mergeJ];
    const na = a.indices.length, nb = b.indices.length;
    clusters[mergeI] = {
      indices: [...a.indices, ...b.indices],
      cx: (na * a.cx + nb * b.cx) / (na + nb),
      cy: (na * a.cy + nb * b.cy) / (na + nb),
    };
    clusters.splice(mergeJ, 1);
  }

  // Select best k by mean silhouette score
  const effMaxK = Math.min(maxK, n - 1);
  let bestK = Math.min(4, effMaxK);
  let bestScore = -Infinity;
  for (let k = 2; k <= effMaxK; k++) {
    if (!clusterHistory[k]) continue;
    const score = _meanSilhouette(x, y, clusterHistory[k], k);
    if (score > bestScore) { bestScore = score; bestK = k; }
  }

  return clusterHistory[bestK] || new Array(n).fill(0);
}

/** @private Compute mean silhouette coefficient for the given assignments. */
function _meanSilhouette(x, y, assignments, k) {
  const n = x.length;
  if (k <= 1 || k >= n) return 0;
  let total = 0, count = 0;

  for (let i = 0; i < n; i++) {
    const ci = assignments[i];

    // a(i): mean distance to other points in the same cluster
    let aSum = 0, aCount = 0;
    for (let j = 0; j < n; j++) {
      if (j !== i && assignments[j] === ci) {
        aSum += Math.sqrt((x[i] - x[j]) ** 2 + (y[i] - y[j]) ** 2);
        aCount++;
      }
    }
    const a = aCount > 0 ? aSum / aCount : 0;

    // b(i): mean distance to the nearest other cluster
    let minB = Infinity;
    for (let ck = 0; ck < k; ck++) {
      if (ck === ci) continue;
      let bSum = 0, bCount = 0;
      for (let j = 0; j < n; j++) {
        if (assignments[j] === ck) {
          bSum += Math.sqrt((x[i] - x[j]) ** 2 + (y[i] - y[j]) ** 2);
          bCount++;
        }
      }
      if (bCount > 0) minB = Math.min(minB, bSum / bCount);
    }
    if (!isFinite(minB)) continue;

    const s = (minB - a) / Math.max(a, minB);
    if (isFinite(s)) { total += s; count++; }
  }

  return count > 0 ? total / count : 0;
}

/**
 * Compute the convex hull of a set of 2D points using Andrew's monotone
 * chain algorithm.  Returns the hull vertices in counter-clockwise order.
 *
 * @param {Array<{x: number, y: number}>} points
 * @returns {Array<{x: number, y: number}>}
 */
export function convexHull(points) {
  if (points.length <= 2) return [...points];

  const pts = [...points].sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);

  function cross(O, A, B) {
    return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
  }

  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }

  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return [...lower, ...upper];
}

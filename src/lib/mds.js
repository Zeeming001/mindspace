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

# The Empathy Project — Technical & Conceptual Briefing
### A document prepared for evaluating instance review of empathyproject.net
---

## Preface

This document is addressed to a Claude instance asked to evaluate empathyproject.net. It is structured around the four Aristotelian causes as an organizing principle, because those causes happen to carve the project at its joints: the *final cause* (what it's for) motivates every design decision; the *formal cause* (its structure) determines what is measurable; the *material cause* (what it's made of) dictates the statistical constraints; and the *efficient cause* (how it works) is the pipeline you will be evaluating. Each section is written to be maximally informative without omitting technical details.

---

## I. Final Cause — What It Is For (τέλος)

The Empathy Project is a psychometric instrument whose stated purpose is **empathy-building through revealed conceptual structure**. The core hypothesis is this: people who belong to different ideological, religious, or demographic groups do not merely hold different *opinions* — they organize abstract concepts into differently shaped *mental landscapes*. A liberal and a conservative do not simply disagree about abortion; they perceive the concept "Pro-choice" as sitting in a different neighborhood of the ideological map, adjacent to different concepts, at different distances from "Bodily sovereignty," "Merciful," or "Democratic." Making those structural differences visible — without attributing malice or error — is posited as an empathy-enabling act.

The project is **explicitly not** a political quiz or personality inventory. It does not score users on a dimension or assign them to a type. It does not tell users what their results *mean* in normative terms. The intended output is a spatial map — a 2D arrangement of concepts — in which proximity encodes psychological similarity as judged by the user or their demographic group. The user is invited to draw their own inferences.

The secondary purpose is **aggregated demographic comparison**: once enough respondents have contributed, the tool displays separate maps for political liberals, political conservatives, religious respondents, and secular respondents. A user can toggle between these maps and observe, for example, that "Atheist" and "Devout" cluster together for some groups (shared intensity of conviction) and sit at opposite poles for others, or that "Traditionalist" is adjacent to "Patriotic" in one map and adjacent to "Reverent" in another.

The project is built and maintained by a physician-researcher (Michael) and may seek IRB-reviewed academic publication. It is currently a public web application at empathyproject.net, built on a React/Vite SPA frontend and a Supabase (PostgreSQL) backend, deployed via Vercel.

---

## II. Material Cause — What It Is Made Of (ὕλη)

### 2.1 The Concept Space

The instrument measures pairwise similarity ratings over a fixed vocabulary of **61 concepts** organized into **10 semantic domains**:

| Domain | Concepts (n) | Examples |
|--------|-------------|---------|
| Knowledge & Ways of Knowing | 6 | Intellectual, Rational, Scientific, Intuitive, Mystical, Practical |
| Religion & Worldview | 6 | Devout, Atheist, Spiritual, Deeply concerned with personal guilt, Believes in grace, Reverent |
| Moral Values & Virtues | 7 | Just, Merciful, Loyal, Deferential to authority, Caring, Emphasizes moral purity, Principled |
| Politics & Governance | 7 | Values personal liberty, Egalitarian, Values security, Seeks order, Democratic, Traditionalist, Patriotic |
| Society & Culture | 6 | Family-oriented, Pro-marriage, Sexually liberated, LGBTQ+ affirming, Pro-religious liberty, Supports multiculturalism |
| Bodies, Harm & Autonomy | 4 | Pro-choice, Emphasizes bodily sovereignty, Emphasizes consent, Emphasizes human interdependence |
| Law & Justice System | 8 | Pro-police, Emphasizes rehabilitative justice, Emphasizes punitive justice, Tough on crime, Emphasizes free speech, Tolerates government surveillance, Believes in the death penalty, Emphasizes reconciliation |
| Economy & Social Order | 5 | Supports a welfare state, Supports a free-market economy, Believes in meritocracy, Tolerates inequality in society, Cares about promoting economic equality in society |
| Aesthetics & Meta-Values | 6 | Driven by the desire for beauty/truth/power/meaning/personal authenticity, Amused by irony |
| Identity & Character | 6 | Kind, Honest, Ambitious, Humble, Hardworking, Believes in luck |

With 61 concepts, the full pairwise comparison space contains **C(61,2) = 1,953 unique pairs**. This is the fundamental scale parameter governing everything downstream.

Concepts were deliberately selected for **cross-group ambiguity**: several concepts are designed to sit in different positions depending on who is evaluating them. "Devout" and "Atheist" are canonical examples — they may cluster together (shared intensity, epistemic commitment) or at opposite poles (belief content). "Amused by irony" correlates with certain epistemic dispositions across political groups. "Traditionalist" neighbors "Patriotic" for some and "Reverent" for others. This ambiguity is the primary source of signal.

### 2.2 Survey Responses

The raw data is a table of **pairwise similarity ratings**: each record is `(session_id, concept_a, concept_b, rating)` where `rating ∈ {1, 2, 3, 4, 5}`. Rating 1 means "very different in my mind"; rating 5 means "very similar in my mind." The framing — "in your mind" — is intentional: the instrument measures *associative distance*, not factual proximity.

The **Likert scale is converted to distance** as:

```
distance(A, B) = 1 − (rating / 5)
```

This maps rating=1 (very different) → distance=0.8, and rating=5 (very similar) → distance=0.0. The distance matrix diagonal is always 0.

### 2.3 Demographic Metadata

Sessions optionally collect:
- **Political leaning**: 1–7 scale (1=very liberal, 7=very conservative)
- **Religion**: categorical (Christian, Muslim, Jewish, Hindu, Buddhist, Other, None)
- **Age range**: binned (18–24, 25–34, 35–44, 45–54, 55–64, 65+)
- **Education**: categorical (High school or less, Some college, Bachelor's, Graduate degree)
- **Gender**: categorical (Man, Woman, Non-binary, Prefer not to say)

Demographic questions are presented **after** the first 20 concept pairs. This is a deliberate anti-priming measure: identity activation before the task introduces social desirability bias and corrupts the associative validity of responses.

### 2.4 Database Schema (Supabase/PostgreSQL)

Four tables:

**`sessions`** — one row per survey session:
```sql
session_id    UUID PRIMARY KEY
completed_at  TIMESTAMPTZ         -- NULL until user completes demographics
political     INT                 -- 1–7 or NULL
religion      TEXT                -- e.g. "Christian", "None"
age_range     TEXT
education     TEXT
gender        TEXT
```

**`responses`** — one row per rated pair:
```sql
session_id    UUID REFERENCES sessions
concept_a     TEXT
concept_b     TEXT
rating        INT CHECK (1..5)
```

**`aggregate_positions`** — precomputed MDS output, refreshed hourly:
```sql
group_key     TEXT                -- e.g. "all", "political:left", "religion:secular"
concept       TEXT
x             FLOAT               -- MDS coordinate dimension 1
y             FLOAT               -- MDS coordinate dimension 2
cluster       INTEGER             -- Ward cluster assignment (0-indexed)
stress        FLOAT               -- Kruskal's stress-1 for this group's map
n_responses   INTEGER             -- number of sessions in this group
computed_at   TIMESTAMPTZ
PRIMARY KEY (group_key, concept)
```

**`settings`** — key-value store for runtime configuration.

---

## III. Formal Cause — The Structure It Gives to Data (εἶδος)

### 3.1 The Distance Matrix

For each group, all responses from all sessions in that group are aggregated into a single 61×61 distance matrix:

```
dist[i][j] = mean over all sessions of (1 − rating(i,j) / 5)
           = 0.5  if no session has rated pair (i,j)  [neutral imputation]
```

The neutral imputation value of 0.5 is the midpoint of the distance range [0, 0.8]. It is chosen because no prior is available — absent data, neither closeness nor distance is assumed. However, **this imputation has significant statistical consequences** (see Section 4.3 on stress calibration below).

### 3.2 Classical Multidimensional Scaling (cMDS)

The distance matrix is compressed into 2D coordinates using **classical Multidimensional Scaling**, which is an analytic (non-iterative) procedure:

1. **Square the distance matrix**: `D²[i][j] = dist[i][j]²`

2. **Double-center** to produce the Gram matrix B:
   ```
   B[i][j] = −0.5 × (D²[i][j] − rowMean[i] − colMean[j] + grandMean)
   ```
   This is equivalent to applying the centering matrix `J = I − (1/n)·11ᵀ` on both sides.

3. **Eigendecompose** B. The top 2 eigenvectors v₁, v₂ with eigenvalues λ₁ ≥ λ₂ yield:
   ```
   x[i] = v₁[i] × √λ₁
   y[i] = v₂[i] × √λ₂
   ```
   Eigendecomposition is performed via **power iteration with deflation** (300 iterations; deterministic seed `sin(i × 2.399963)`). This runs in-browser for personal maps and server-side in the Edge Function for group maps.

The resulting coordinates are normalized to a [0,1] bounding box for display. **Axes have no inherent semantic meaning** — only relative positions and distances matter.

### 3.3 Kruskal's Stress-1

Layout quality is measured by **Kruskal's stress-1**:

```
stress = √( Σᵢ<ⱼ (dᵢⱼ − êᵢⱼ)² / Σᵢ<ⱼ dᵢⱼ² )
```

where `dᵢⱼ` is the original distance matrix value and `êᵢⱼ = √((xᵢ−xⱼ)² + (yᵢ−yⱼ)²)` is the Euclidean distance in the 2D layout. This measures how faithfully the 2D embedding preserves the original high-dimensional distances.

**Critical calibration note**: Standard Kruskal thresholds (stress > 0.20 = "poor") are **completely wrong** for this dataset and will always show "poor." The correct calibration for n=61 concepts in 2D is:

| Stress range | Label | Interpretation |
|---|---|---|
| < 0.45 | Excellent | Theoretical floor; not achievable with sparse data |
| 0.45–0.55 | Good | ~100+ sessions with 20 pairs each |
| 0.55–0.65 | Fair | ~50 sessions (minimum viable threshold) |
| > 0.65 | Poor | Too few respondents; layout mostly noise |

The theoretical floor is ~0.40 even with complete pair coverage. Simulation studies with 80 sessions × 20 pairs/session show typical stress of 0.56–0.57. These thresholds are implemented in `src/lib/constants.js` as `STRESS_LABELS`.

**Personal maps do not display stress** — a single user's map has ~98% unobserved pairs imputed at 0.5, producing stress ~0.82+. Displaying this would be misleading. Instead, personal maps show a coverage note: e.g., "80 of 1,953 pairs rated (4% coverage) — only concepts you've encountered are shown."

### 3.4 Ward Hierarchical Clustering

After MDS coordinates are computed, concepts are grouped into clusters using **agglomerative hierarchical clustering with Ward linkage**:

- Ward's criterion merges the cluster pair whose union minimizes the increase in total within-cluster sum of squares.
- Ward distance: `Δ(A,B) = (nₐ·n_b)/(nₐ+n_b) × ‖μₐ−μ_b‖²`
- The dendrogram is built over k = 61 down to k = 1.
- **Optimal k is selected automatically** by mean silhouette score across k = 2 through min(10, n−1):
  - Silhouette for point i: `s(i) = (b(i) − a(i)) / max(a(i), b(i))`
  - where `a(i)` = mean distance to own-cluster members, `b(i)` = mean distance to nearest foreign cluster.
  - The k with highest mean silhouette is selected.

Cluster assignments are stored in `aggregate_positions.cluster` and used to color-code concepts in the visualization.

### 3.5 Group Definitions

The application computes separate maps for six groups:

| Group key | Filter | Label shown |
|---|---|---|
| `all` | All completed sessions | All respondents |
| `political:left` | political ∈ {1,2,3} | Liberal |
| `political:center` | political = 4 | Centrist |
| `political:right` | political ∈ {5,6,7} | Conservative |
| `religion:religious` | religion ∈ {Christian, Muslim, Jewish, Hindu, Buddhist, Other} | Religious |
| `religion:secular` | religion = "None" | Secular / Non-religious |

A group map is only computed and displayed if the group has **≥ 50 respondents** (constant `MIN_RESPONDENTS`). Below that threshold, the UI shows "not enough data." For the `all` group specifically, a simulated (theoretically-motivated) sample map is displayed as a placeholder before real data arrives, with a visible "Simulated data" warning banner.

---

## IV. Efficient Cause — How It Works (ἀρχή τῆς κινήσεως)

### 4.1 Survey Flow

1. A new visitor lands on the site. A UUID session ID is generated and stored in `localStorage`.
2. The session is inserted into the `sessions` table (`completed_at = NULL`).
3. The user is shown **20 concept pairs** from a session-specific pseudo-random ordering of all 1,953 pairs (seeded by `sessionIndex × 2654435761 + 1` via Mulberry32 PRNG).
4. After 20 pairs, a demographics checkpoint interrupts the flow. The user is prompted to fill in (or skip) political, religion, age, education, and gender fields.
5. On submitting demographics, `completed_at` is set and the session becomes eligible for group map computation.
6. The user may continue rating in batches of 20. Each batch uses the same session-specific ordering, advancing the pointer into the shuffled pair list.
7. At any point the user can visit the Explore page to see their personal map and the group maps.

This design produces an **incomplete block design** across sessions: each session covers a different ~1% slice of the 1,953-pair space. Across many sessions, pair coverage approaches uniformity without any coordination between respondents. Full pair coverage requires approximately 98 sessions (1,953 / 20 ≈ 97.65).

### 4.2 Personal Map Rendering

When a user visits the Explore page and selects "Your map":

1. Their session's responses are fetched from Supabase (`SELECT * FROM responses WHERE session_id = ?`).
2. The **concept set is filtered** to only include concepts the user has actually rated. Unrated concepts would all be 0.5 from everything, collapsing to an uninformative center blob.
3. If the user has rated **< 60 pairs** (`MDS_THRESHOLD`), a **ForceGraph** (force-directed network) is rendered instead of an MDS plot. The ForceGraph only draws springs for rated pairs — it is honest about sparse data, showing a network rather than a spatial map.
4. At ≥ 60 pairs, **cMDS** is computed in-browser over the filtered concept set. The stress value is suppressed from display (see Section 3.3).
5. The map shows a coverage note: "N of 1,953 pairs rated (P% coverage) — only concepts you've encountered are shown."

### 4.3 Group Map Pipeline (Server-Side)

Group maps are computed by a **Supabase Edge Function** (`compute-mds`, Deno runtime) triggered on a schedule (hourly):

1. For each of the 6 group keys, fetch `session_id`s of completed sessions matching the group filter.
2. Skip if `n < MIN_RESPONDENTS` (50).
3. Fetch all `(concept_a, concept_b, rating)` from `responses` for those session IDs.
4. Call `buildDistanceMatrix(CONCEPTS, responses)` → 61×61 matrix with neutral imputation for unobserved pairs.
5. Call `classicalMDS(distMatrix)` → `{x[61], y[61]}`.
6. Call `computeStress(distMatrix, x, y)` → scalar stress value.
7. Call `wardCluster(x, y, maxK=10)` → `cluster[61]`.
8. Upsert all 61 rows into `aggregate_positions` with `ON CONFLICT (group_key, concept) DO UPDATE`.

The function returns a JSON log with per-group outcome (computed/skipped/error) and stress values.

### 4.4 Aggregate Map Display (MDSPlot Component)

When a group tab is selected in the Explore page:

1. `fetchGroupPositions(groupKey)` queries `aggregate_positions` for all 61 rows of that group, selecting `concept, x, y, cluster, stress, n_responses, computed_at`.
2. Positions are normalized to a [0,1] bounding box.
3. The `MDSPlot` React component renders an SVG scatter plot:
   - Each concept is a labeled dot colored by its **domain** (the 10 domain colors are fixed).
   - Dot outline color reflects its **Ward cluster** (distinguishable within-domain grouping).
   - A **convex hull** is drawn around each domain's points using Andrew's monotone chain algorithm, providing a visual "territory" for each domain.
   - Hovering a point shows a tooltip with concept name, domain, and cluster.
   - A **stress quality indicator** appears in the axis note: e.g., "Layout quality: Fair (stress 0.566)".
   - Respondent count and last-computed timestamp appear in a metadata row below the plot.

The MDSPlot component handles both aggregate data (via `positions` prop) and personal data (via `responses` + `concepts` props) through the same rendering path, with branching logic in a `useMemo` hook.

### 4.5 Coverage and Imputation Statistics

At the minimum threshold of 50 sessions × 20 pairs/session = 1,000 total ratings, covering ~51% of 1,953 pairs at least once (assuming uniform distribution). The other 49% are imputed at 0.5. At 80 sessions × 20 pairs: ~44% unobserved. This neutral imputation:

- Pulls distances toward 0.5 globally (the imputed value).
- Tends to make concepts with few rated pairs cluster toward the center of the MDS layout.
- Inflates stress by introducing systematic error between the sparse true distances and the MDS approximation.

This is the fundamental accuracy tradeoff of the instrument at low respondent counts — it is not a bug, but a structural feature that improves with n.

---

## V. Architectural Summary

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 19 + Vite SPA | Survey UI, personal and group map display |
| Routing | react-router-dom v7 | `/survey`, `/explore`, `/about` routes |
| Styling | Inline styles (`const S = {}` per component) | No CSS files; all styles colocated |
| Charts | Custom SVG (MDSPlot), custom Canvas (ForceGraph) | No third-party chart library |
| Database | Supabase (PostgreSQL) with Row Level Security | Sessions, responses, aggregate positions |
| Compute | Supabase Edge Function (Deno, TypeScript) | Hourly MDS recomputation |
| Hosting | Vercel (auto-deploy on git push) | Production at empathyproject.net |
| DNS | Squarespace → Vercel | Domain routing |
| Repo | GitHub (`Zeeming001/mindspace`) | Source of truth for deployments |

---

## VI. Key Design Decisions and Their Rationale

**Why pairwise similarity ratings and not trait scores?** Direct rating tasks ("on a scale of 1–5, how similar are X and Y in your mind?") access associative structure more directly than self-report inventories. They also generate relational data (a distance matrix) rather than point data, enabling spatial analysis.

**Why demographics after 20 pairs?** Pre-task identity priming activates social desirability bias and group-congruent responding. By delaying demographic questions, the first 20 responses reflect unprimed associative access.

**Why cMDS rather than t-SNE or UMAP?** Classical MDS is analytic (no hyperparameters, no stochastic variation, reproducible), interpretable (distance in the output directly relates to distance in the input), and fast enough to run in-browser. t-SNE and UMAP optimize local structure at the expense of global structure, which is the wrong tradeoff for this application (group-level geographic differences are a global property).

**Why ForceGraph before the MDS threshold?** At < 60 pairs (~3% coverage), the 97% neutral imputation would dominate the MDS layout. The ForceGraph is epistemically honest — it draws edges only between pairs the user has rated, making its sparsity visible rather than hiding it in a spurious spatial map.

**Why Ward clustering?** Ward linkage produces compact, visually clean clusters that correspond well to domain groupings. The silhouette-based k selection avoids the need to pre-specify the number of groups.

**Why 50 as the minimum respondent threshold?** Simulation studies with the actual concept set show that group-level domain clustering stabilizes (within-domain distances consistently less than between-domain distances) at ~50 sessions. Below 50, the map structure is too noisy to be meaningfully compared across groups.

**Why suppress stress on personal maps?** A single user at 20–80 pairs has stress ~0.82+ because 95–99% of pairs are neutral-imputed. Displaying a stress value would mislead the user into thinking their map is of poor quality when in fact the quality indicator is not meaningful at this coverage level. Coverage percentage is a more honest and interpretable summary.

---

## VII. Known Limitations for Evaluation

1. **Sparse coverage**: At 50 sessions × 20 pairs, ~49% of pairs are unobserved and imputed at 0.5. Group comparisons at this scale detect coarse structural differences but not fine-grained ones.

2. **2D compression**: Compressing 1,953 pairwise relationships into 2 dimensions inevitably introduces distortion. The theoretical stress floor for n=61 in 2D is ~0.40 even with perfect data.

3. **Power iteration vs. full eigendecomposition**: The browser-side cMDS uses power iteration (300 iterations), which may not fully converge for concepts with similar eigenvalues. The server-side computation uses the same algorithm. A full eigendecomposition (via LAPACK or numpy's `eigh`) would be more accurate but requires server-side execution.

4. **No test-retest reliability data yet**: The instrument has not been validated for reliability (would the same person give the same map on two occasions?) or construct validity (does the distance between "Liberal" and "Conservative" on a user's map actually predict anything?).

5. **Volunteer sample bias**: Respondents self-select. The demographic distribution of respondents will not match the general population.

6. **Neutral imputation is wrong for personal maps when user has strong views on unseen pairs**: If a user has strongly polarized views but has not yet rated pair (X, Y), that pair is treated as neutral. The true distance might be very high or very low.

7. **Cluster colors in visualization**: Ward cluster colors are assigned 0-indexed and may not be visually consistent across groups (cluster 0 in the liberal map is not the same cluster as cluster 0 in the conservative map). This is a display limitation, not a statistical one.

---

## VIII. What "Success" Looks Like

The instrument is working correctly if, across groups with sufficient respondents:

1. **Within-domain clustering**: Concepts from the same domain (e.g., all six Knowledge concepts) cluster nearer to each other than to concepts from other domains, for most groups. This is the basic validity check.

2. **Meaningful group differences**: The relative positions of ideologically charged concepts (e.g., "Pro-choice," "Egalitarian," "Traditionalist," "Believes in grace") differ detectably between the liberal and conservative maps, in directions that are theoretically interpretable.

3. **Stable maps**: The MDS layout does not flip (eigenvectors have sign ambiguity), cluster assignments don't change radically between hourly recomputations, and the stress value falls in the Fair or Good range.

4. **Interpretable display**: A naive user visiting the Explore page can, without reading the methodology, observe that concepts cluster together, compare group maps, and form a hypothesis about why certain concepts neighbor each other in one group but not another.

The last criterion is the hardest and most important. The tool's empathy-building function depends entirely on whether the maps are legible to non-technical users.

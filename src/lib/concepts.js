export const DOMAINS = [
  { id: "knowledge",   label: "Knowledge & Ways of Knowing", color: "#e8c547" },
  { id: "religion",    label: "Religion & Worldview",         color: "#b8a0d4" },
  { id: "moral",       label: "Moral Values & Virtues",       color: "#7eb8d4" },
  { id: "politics",    label: "Politics & Governance",        color: "#d47e7e" },
  { id: "society",     label: "Society & Culture",            color: "#a8d4a0" },
  { id: "bodies",      label: "Bodies, Harm & Autonomy",      color: "#d4a08c" },
  { id: "law",         label: "Law & Justice System",         color: "#8cd4c8" },
  { id: "economy",     label: "Economy & Social Order",       color: "#d4c8a0" },
  { id: "aesthetics",  label: "Aesthetics & Meta-Values",     color: "#d4a0b8" },
  { id: "identity",    label: "Identity & Character",         color: "#a0b8d4" },
];

export const CONCEPTS_BY_DOMAIN = {
  knowledge:  ["Intellectual", "Rational", "Scientific", "Intuitive", "Mystical", "Practical"],
  religion:   ["Devout", "Atheist", "Spiritual", "Deeply concerned with personal guilt", "Believes in grace", "Reverent"],
  moral:      ["Just", "Merciful", "Loyal", "Deferential to authority", "Caring", "Emphasizes moral purity", "Principled"],
  politics:   ["Values personal liberty", "Egalitarian", "Values security", "Seeks order", "Democratic", "Traditionalist", "Patriotic"],
  society:    ["Family-oriented", "Pro-marriage", "Sexually liberated", "LGBTQ+ affirming", "Pro-religious liberty", "Supports multiculturalism"],
  bodies:     ["Pro-choice", "Emphasizes bodily sovereignty", "Emphasizes consent", "Emphasizes human interdependence"],
  law:        ["Pro-police", "Emphasizes rehabilitative justice", "Emphasizes punitive justice", "Tough on crime", "Emphasizes free speech", "Tolerates government surveillance", "Believes in the death penalty", "Emphasizes reconciliation"],
  economy:    ["Supports a welfare state", "Supports a free-market economy", "Believes in meritocracy", "Tolerates inequality in society", "Cares about promoting economic equality in society"],
  aesthetics: ["Driven by the desire for beauty", "Driven by the desire for truth", "Driven by the desire for power", "Driven by the desire for meaning", "Driven by the desire for personal authenticity", "Amused by irony"],
  identity:   ["Kind", "Honest", "Ambitious", "Humble", "Hardworking", "Believes in luck"],
};

// Flat array of all 61 concepts
export const CONCEPTS = Object.values(CONCEPTS_BY_DOMAIN).flat();

// Map: concept name -> domain id
export const CONCEPT_DOMAIN = {};
for (const [domainId, concepts] of Object.entries(CONCEPTS_BY_DOMAIN)) {
  for (const c of concepts) CONCEPT_DOMAIN[c] = domainId;
}

// Map: concept name -> color
export const CONCEPT_COLOR = {};
for (const domain of DOMAINS) {
  for (const c of CONCEPTS_BY_DOMAIN[domain.id]) {
    CONCEPT_COLOR[c] = domain.color;
  }
}

// Generate all unique pairs (deterministic order)
export function getAllPairs() {
  const pairs = [];
  for (let i = 0; i < CONCEPTS.length; i++) {
    for (let j = i + 1; j < CONCEPTS.length; j++) {
      pairs.push([CONCEPTS[i], CONCEPTS[j]]);
    }
  }
  return pairs;
}

// Seeded shuffle using a numeric seed (mulberry32)
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Survey pacing constants
export const FIRST_BATCH_SIZE = 20;     // pairs before demographics checkpoint
export const CONTINUED_BATCH_SIZE = 20; // pairs per subsequent batch
export const TOTAL_PAIRS = CONCEPTS.length * (CONCEPTS.length - 1) / 2;

/**
 * Returns ALL 1,953 pairs in a deterministic random order unique to this
 * session index. Each session gets a different shuffle so that across many
 * sessions the full pair space is covered uniformly.
 */
export function getAllPairsForSession(sessionIndex) {
  const all = getAllPairs();
  const rng = mulberry32(sessionIndex * 2654435761 + 1);

  // Fisher-Yates shuffle
  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// Groups available for stratified explore view.
// Kept intentionally broad so each group accumulates enough responses to
// produce a stable MDS map. Granular sub-groups can be added later once
// the respondent pool is larger.
export const GROUPS = [
  { id: "all",               label: "All respondents",        field: null,        value: null },
  { id: "political:left",    label: "Liberal",                field: "political", value: [1, 2, 3] },
  { id: "political:center",  label: "Centrist",               field: "political", value: [4] },
  { id: "political:right",   label: "Conservative",           field: "political", value: [5, 6, 7] },
  { id: "religion:religious", label: "Religious",             field: "religion",  value: ["Christian", "Muslim", "Jewish", "Hindu", "Buddhist", "Other"] },
  { id: "religion:secular",   label: "Secular / Non-religious", field: "religion", value: ["None"] },
];

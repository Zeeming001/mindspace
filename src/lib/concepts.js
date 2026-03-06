// Finalized concept list: 63 concepts across 10 domains
// DO NOT modify without consulting the project owner.

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
  knowledge:  ["Intelligence", "Reason", "Science", "Intuition", "Mystery", "Common sense"],
  religion:   ["Faith", "Atheism", "Spirituality", "Sin", "Grace", "Sacred"],
  moral:      ["Justice", "Mercy", "Loyalty", "Authority", "Care", "Sanctity", "Integrity"],
  politics:   ["Freedom", "Equality", "Security", "Order", "Democracy", "Tradition", "Patriotism"],
  society:    ["Family", "Marriage", "Sexual freedom", "LGBTQ+ rights", "Religious liberty", "Multiculturalism"],
  bodies:     ["Abortion", "Bodily autonomy", "Consent", "Innocence", "Dependence"],
  law:        ["Policing", "Rehabilitation", "Punishment", "Mass incarceration", "Freedom of speech", "Surveillance", "Death penalty", "Reconciliation"],
  economy:    ["Welfare", "Free markets", "Meritocracy", "Inequality", "Poverty", "Solidarity"],
  aesthetics: ["Beauty", "Truth", "Power", "Meaning", "Authenticity", "Irony"],
  identity:   ["Kindness", "Honesty", "Ambition", "Humility", "Hard work", "Luck"],
};

// Flat array of all 63 concepts
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

// Generate all 1,953 unique pairs (deterministic order)
export function getAllPairs() {
  const pairs = [];
  for (let i = 0; i < CONCEPTS.length; i++) {
    for (let j = i + 1; j < CONCEPTS.length; j++) {
      pairs.push([CONCEPTS[i], CONCEPTS[j]]);
    }
  }
  return pairs; // 63*62/2 = 1953 pairs
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
export const TOTAL_PAIRS = 1953;        // 63 * 62 / 2

/**
 * Returns ALL 1,953 pairs in a deterministic random order unique to this
 * session index. Each session gets a different shuffle so that across many
 * sessions the full pair space is covered uniformly.
 *
 * The respondent can work through as many of these as they like — pairs are
 * presented 20 at a time after the initial demographics checkpoint.
 */
export function getAllPairsForSession(sessionIndex) {
  const all = getAllPairs(); // 1953 pairs, canonical order
  const rng = mulberry32(sessionIndex * 2654435761 + 1);

  // Fisher-Yates shuffle
  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Legacy helper kept for backward compatibility.
 * Returns a slice of 60 pairs (or batchSize pairs) for the given session index.
 * Prefer getAllPairsForSession() for new code.
 */
export function getPairsForSessionIndex(sessionIndex, batchSize = 60) {
  return getAllPairsForSession(sessionIndex).slice(0, batchSize);
}

// Groups available for stratified explore view
export const GROUPS = [
  { id: "all",            label: "All respondents",         field: null,        value: null },
  { id: "political:1-2",  label: "Very liberal",            field: "political", value: [1, 2] },
  { id: "political:3",    label: "Moderate left",           field: "political", value: [3] },
  { id: "political:4",    label: "Centrist",                field: "political", value: [4] },
  { id: "political:5",    label: "Moderate right",          field: "political", value: [5] },
  { id: "political:6-7",  label: "Very conservative",       field: "political", value: [6, 7] },
  { id: "religion:Christian",  label: "Christian",          field: "religion",  value: "Christian" },
  { id: "religion:None",       label: "Non-religious",      field: "religion",  value: "None" },
  { id: "religion:Muslim",     label: "Muslim",             field: "religion",  value: "Muslim" },
  { id: "religion:Jewish",     label: "Jewish",             field: "religion",  value: "Jewish" },
    { id: "religion:Other",   label: "Other / Hindu / Buddhist", field: "religion", value: ["Hindu", "Buddhist", "Other"] },
];

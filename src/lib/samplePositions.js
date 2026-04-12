/**
 * samplePositions.js
 *
 * Simulated MDS positions for demo purposes.
 * Generated from a theoretically-motivated distance matrix (within-domain
 * similarity + key cross-domain relationships) rather than real survey data.
 *
 * These are shown on the Explore page when a group has fewer than
 * MIN_RESPONDENTS real responses. Once real data is available, these
 * positions are replaced automatically.
 *
 * Fields:
 *   concept   – concept name (must match concepts.js)
 *   x, y      – MDS coordinates (normalised to [0,1])
 *   cluster   – Ward cluster index (0-based), computed from these coordinates
 *   stress    – placeholder stress value representative of ~80-session operation
 */

export const SAMPLE_POSITIONS = [
  { concept: "Intellectual",                                x: 0.0161, y: 0.8055, cluster: 0, stress: 0.5582 },
  { concept: "Rational",                                    x: 0.0443, y: 0.7923, cluster: 0, stress: 0.5582 },
  { concept: "Scientific",                                  x: 0.0395, y: 0.7950, cluster: 0, stress: 0.5582 },
  { concept: "Intuitive",                                   x: 0.0587, y: 0.7810, cluster: 0, stress: 0.5582 },
  { concept: "Mystical",                                    x: 0.0565, y: 0.7826, cluster: 0, stress: 0.5582 },
  { concept: "Practical",                                   x: 0.0535, y: 0.7317, cluster: 0, stress: 0.5582 },

  { concept: "Devout",                                      x: 0.1929, y: 0.5649, cluster: 0, stress: 0.5582 },
  { concept: "Atheist",                                     x: 0.2336, y: 0.6308, cluster: 0, stress: 0.5582 },
  { concept: "Spiritual",                                   x: 0.1567, y: 0.6830, cluster: 0, stress: 0.5582 },
  { concept: "Deeply concerned with personal guilt",        x: 0.2112, y: 0.6300, cluster: 0, stress: 0.5582 },
  { concept: "Believes in grace",                           x: 0.2111, y: 0.6304, cluster: 0, stress: 0.5582 },
  { concept: "Reverent",                                    x: 0.2156, y: 0.6252, cluster: 0, stress: 0.5582 },

  { concept: "Just",                                        x: 0.0831, y: 0.0809, cluster: 1, stress: 0.5582 },
  { concept: "Merciful",                                    x: 0.2567, y: 0.0000, cluster: 1, stress: 0.5582 },
  { concept: "Loyal",                                       x: 0.1283, y: 0.1459, cluster: 1, stress: 0.5582 },
  { concept: "Deferential to authority",                    x: 0.1078, y: 0.1217, cluster: 1, stress: 0.5582 },
  { concept: "Caring",                                      x: 0.0785, y: 0.0614, cluster: 1, stress: 0.5582 },
  { concept: "Emphasizes moral purity",                     x: 0.1169, y: 0.1481, cluster: 1, stress: 0.5582 },
  { concept: "Principled",                                  x: 0.0793, y: 0.0761, cluster: 1, stress: 0.5582 },

  { concept: "Values personal liberty",                     x: 0.4952, y: 0.8843, cluster: 0, stress: 0.5582 },
  { concept: "Egalitarian",                                 x: 0.3965, y: 0.9581, cluster: 0, stress: 0.5582 },
  { concept: "Values security",                             x: 0.5969, y: 0.8491, cluster: 0, stress: 0.5582 },
  { concept: "Seeks order",                                 x: 0.4175, y: 0.8858, cluster: 0, stress: 0.5582 },
  { concept: "Democratic",                                  x: 0.4835, y: 0.8679, cluster: 0, stress: 0.5582 },
  { concept: "Traditionalist",                              x: 0.3930, y: 1.0000, cluster: 0, stress: 0.5582 },
  { concept: "Patriotic",                                   x: 0.4120, y: 0.8854, cluster: 0, stress: 0.5582 },

  { concept: "Family-oriented",                             x: 0.2569, y: 0.8700, cluster: 0, stress: 0.5582 },
  { concept: "Pro-marriage",                                x: 0.2562, y: 0.8669, cluster: 0, stress: 0.5582 },
  { concept: "Sexually liberated",                          x: 0.2185, y: 0.8240, cluster: 0, stress: 0.5582 },
  { concept: "LGBTQ+ affirming",                            x: 0.2449, y: 0.7783, cluster: 0, stress: 0.5582 },
  { concept: "Pro-religious liberty",                       x: 0.2626, y: 0.8254, cluster: 0, stress: 0.5582 },
  { concept: "Supports multiculturalism",                   x: 0.2563, y: 0.8518, cluster: 0, stress: 0.5582 },

  { concept: "Pro-choice",                                  x: 0.2631, y: 0.7098, cluster: 0, stress: 0.5582 },
  { concept: "Emphasizes bodily sovereignty",               x: 0.2481, y: 0.6358, cluster: 0, stress: 0.5582 },
  { concept: "Emphasizes consent",                          x: 0.2483, y: 0.6348, cluster: 0, stress: 0.5582 },
  { concept: "Emphasizes human interdependence",            x: 0.2181, y: 0.5775, cluster: 0, stress: 0.5582 },

  { concept: "Pro-police",                                  x: 1.0000, y: 0.4632, cluster: 2, stress: 0.5582 },
  { concept: "Emphasizes rehabilitative justice",           x: 0.9271, y: 0.3414, cluster: 2, stress: 0.5582 },
  { concept: "Emphasizes punitive justice",                 x: 0.9448, y: 0.4292, cluster: 2, stress: 0.5582 },
  { concept: "Tough on crime",                              x: 0.9568, y: 0.4268, cluster: 2, stress: 0.5582 },
  { concept: "Emphasizes free speech",                      x: 0.9648, y: 0.5167, cluster: 2, stress: 0.5582 },
  { concept: "Tolerates government surveillance",           x: 0.9571, y: 0.4723, cluster: 2, stress: 0.5582 },
  { concept: "Believes in the death penalty",               x: 0.9438, y: 0.4283, cluster: 2, stress: 0.5582 },
  { concept: "Emphasizes reconciliation",                   x: 0.9273, y: 0.3451, cluster: 2, stress: 0.5582 },

  { concept: "Supports a welfare state",                    x: 0.2695, y: 0.7248, cluster: 0, stress: 0.5582 },
  { concept: "Supports a free-market economy",              x: 0.2945, y: 0.7029, cluster: 0, stress: 0.5582 },
  { concept: "Believes in meritocracy",                     x: 0.2644, y: 0.6858, cluster: 0, stress: 0.5582 },
  { concept: "Tolerates inequality in society",             x: 0.2644, y: 0.6900, cluster: 0, stress: 0.5582 },
  { concept: "Cares about promoting economic equality in society", x: 0.2789, y: 0.7466, cluster: 0, stress: 0.5582 },

  { concept: "Driven by the desire for beauty",             x: 0.1589, y: 0.6576, cluster: 0, stress: 0.5582 },
  { concept: "Driven by the desire for truth",              x: 0.0597, y: 0.7431, cluster: 0, stress: 0.5582 },
  { concept: "Driven by the desire for power",              x: 0.1272, y: 0.6242, cluster: 0, stress: 0.5582 },
  { concept: "Driven by the desire for meaning",            x: 0.1640, y: 0.6640, cluster: 0, stress: 0.5582 },
  { concept: "Driven by the desire for personal authenticity", x: 0.1142, y: 0.6331, cluster: 0, stress: 0.5582 },
  { concept: "Amused by irony",                             x: 0.1021, y: 0.6686, cluster: 0, stress: 0.5582 },

  { concept: "Kind",                                        x: 0.0424, y: 0.2025, cluster: 1, stress: 0.5582 },
  { concept: "Honest",                                      x: 0.0000, y: 0.2378, cluster: 1, stress: 0.5582 },
  { concept: "Ambitious",                                   x: 0.0576, y: 0.3883, cluster: 1, stress: 0.5582 },
  { concept: "Humble",                                      x: 0.0747, y: 0.3455, cluster: 1, stress: 0.5582 },
  { concept: "Hardworking",                                 x: 0.0488, y: 0.4035, cluster: 1, stress: 0.5582 },
  { concept: "Believes in luck",                            x: 0.0741, y: 0.4017, cluster: 1, stress: 0.5582 },
];

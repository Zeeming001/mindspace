/**
 * conceptDescriptions.js
 *
 * For each of the 61 survey concepts, provides:
 *   evokes    – what the concept is intended to evoke in the respondent's mind
 *   variation – how perceptions of it, and its proximity to other concepts,
 *               may differ across identity groups
 *
 * These are displayed when a user clicks a concept dot on the map.
 *
 * IMPORTANT: The "variation" entries are theoretical and exploratory — they
 * describe differences in meaning and association that *might* emerge from the
 * data, based on prior research and conceptual analysis. They are not empirical
 * claims about what this dataset will show. Until enough real respondents have
 * contributed, treat these as informed hypotheses rather than findings.
 */

export const CONCEPT_DESCRIPTIONS = {

  // ── Knowledge & Ways of Knowing ──────────────────────────────────────────

  "Intellectual": {
    evokes: "A person who finds deep satisfaction in abstract reasoning, theory, and the life of the mind — someone for whom ideas are intrinsically valuable, apart from their practical use.",
    variation: "This concept tends to be viewed positively across groups, but its neighbours on the map may differ. For some respondents it might cluster with \"Rational\" and \"Scientific\"; for others it could carry faint associations with detached elitism. Politically polarized samples may show it sitting noticeably closer to one end of the spectrum than the other.",
  },

  "Rational": {
    evokes: "Systematic, logical reasoning guided by evidence and argument rather than emotion or tradition.",
    variation: "Almost universally valued — but what rationality is applied *to* may differ significantly. Some respondents might place it near \"Scientific,\" emphasizing empirical reasoning; others could cluster it near \"Principled\" or \"Just,\" suggesting rule-based moral reasoning. Its distance from \"Intuitive\" could be one of the map's more revealing cross-group signals.",
  },

  "Scientific": {
    evokes: "Commitment to empirical evidence, peer review, experimental testing, and the methodology of the natural sciences.",
    variation: "This concept may show strong positive valence among secular and liberal respondents, where it could cluster tightly with \"Rational\" and \"Intellectual.\" Among religious respondents, its position relative to \"Devout\" and \"Mystical\" might vary considerably — some may see faith and science as compatible neighbors, others as far apart.",
  },

  "Intuitive": {
    evokes: "Trusting gut feelings, tacit knowledge, and non-verbal understanding — the sense that something is right before you can fully explain why.",
    variation: "Liberal respondents might associate it with empathy and artistic sensibility, placing it near aesthetic concepts. Conservative and religious respondents may place it closer to moral common sense or spiritual discernment. Its distance from \"Rational\" and \"Scientific\" could be larger in secular samples than in religious ones.",
  },

  "Mystical": {
    evokes: "Direct, unmediated experience of the sacred, the transcendent, or the ineffable — a sense of contact with something beyond ordinary reality.",
    variation: "This concept may sit close to \"Devout,\" \"Spiritual,\" and \"Reverent\" for religious respondents. In secular samples it might be placed near \"Intuitive\" and aesthetic concepts, or at a greater distance from \"Scientific\" and \"Rational.\" Its ambiguity — potentially negative for strict empiricists, positive for many religious respondents — could make it a useful discriminating concept.",
  },

  "Practical": {
    evokes: "Hands-on problem solving, common sense, and an orientation toward what works rather than what's theoretically elegant.",
    variation: "This concept tends to be viewed positively across groups. Conservative respondents might place it closer to \"Hardworking\" and \"Loyal.\" Some liberal respondents may see it in mild tension with visionary or idealistic thinking. Its distance from \"Intellectual\" could vary interestingly between groups.",
  },

  // ── Religion & Worldview ─────────────────────────────────────────────────

  "Devout": {
    evokes: "Deep, practiced religious commitment — regular prayer, community participation, adherence to doctrine, and organizing one's life around faith.",
    variation: "For religious respondents, this concept might cluster tightly with \"Reverent,\" \"Believes in grace,\" and \"Spiritual.\" For secular respondents it may sit nearer to \"Traditionalist\" or \"Deferential to authority.\" Its proximity to \"Atheist\" is one of the map's most theoretically interesting potential patterns: some respondents of both types may see them as sharing a certain epistemic intensity.",
  },

  "Atheist": {
    evokes: "Explicit rejection of belief in God or gods, typically accompanied by a naturalistic worldview and reliance on science and reason.",
    variation: "For secular respondents this concept might cluster near \"Rational\" and \"Scientific.\" For religious respondents it may sit far from \"Devout\" and \"Reverent\" — though some respondents could place it near \"Devout\" based on a sense of shared certainty of conviction. Its relationship with \"Amused by irony\" and \"Intellectual\" may be a subtle but potentially informative group-differentiating signal.",
  },

  "Spiritual": {
    evokes: "A felt sense of connection to something larger than oneself — nature, humanity, the cosmos — without necessarily adhering to formal religious doctrine.",
    variation: "This is one of the survey's most intentionally ambiguous concepts. Secular respondents might place it near \"Intuitive,\" \"Mystical,\" or aesthetic concepts. Religious respondents may locate it between \"Devout\" and more experiential concepts, with varying assessments of whether it represents a genuine or underdeveloped form of faith. It may rarely sit at either extreme of any map.",
  },

  "Deeply concerned with personal guilt": {
    evokes: "A heightened moral sensitivity to one's own failings — the kind of inner accounting that leads to confession, repentance, or reparation.",
    variation: "This concept may be central to Christian (particularly Protestant and Catholic) moral psychology, sitting near \"Believes in grace\" and \"Devout\" for religious respondents. More secular respondents might associate it with anxiety, moral perfectionism, or psychological burden — potentially placing it further from positive concepts and closer to traits they'd characterize as psychologically unhealthy.",
  },

  "Believes in grace": {
    evokes: "The theological idea that forgiveness and moral restoration are gifts freely given — that people are saved by mercy, not purely by merit.",
    variation: "This concept could be deeply resonant for Christian respondents, clustering tightly with \"Devout,\" \"Reverent,\" and \"Merciful.\" For secular respondents it may be reinterpreted as general compassion or forgiveness between people, potentially sitting near \"Caring\" and \"Kind.\" Its position relative to \"Just\" — the justice-vs.-mercy tension — could be philosophically revealing across groups.",
  },

  "Reverent": {
    evokes: "A disposition of deep respect, awe, and deference — toward the sacred, the ancestral, the natural world, or anything felt to be larger and more permanent than oneself.",
    variation: "Religious respondents might place this near \"Devout\" and \"Spiritual.\" Conservative respondents may also link it to \"Patriotic\" and \"Traditionalist\" — reverence for institutions and history. Liberal respondents may associate it more with environmental awe or cultural appreciation. This could be one of the map's more cross-cutting concepts.",
  },

  // ── Moral Values & Virtues ──────────────────────────────────────────────

  "Just": {
    evokes: "A commitment to fairness, proportionality, and right outcomes — giving each person what they deserve according to consistent principles.",
    variation: "Almost universally positive, but the content of justice may differ sharply between groups. For liberals, \"just\" might sit near \"Egalitarian\" and \"Caring.\" For conservatives it could cluster closer to \"Principled\" and \"Tough on crime.\" The gulf between retributive and distributive conceptions of justice is one of the deepest potential moral divides in this dataset.",
  },

  "Merciful": {
    evokes: "Compassion in action — a willingness to forgive, to temper punishment with kindness, and to see the humanity in someone who has done wrong.",
    variation: "This concept may be central to religious moral psychology, potentially sitting near \"Believes in grace,\" \"Devout,\" and \"Kind.\" In the context of criminal justice, it might map onto rehabilitative approaches for liberal respondents, while some conservative respondents may associate it as being in tension with serious accountability. Its relationship to \"Just\" is one of the oldest moral questions.",
  },

  "Loyal": {
    evokes: "Steadfast commitment to one's people — family, friends, community, or nation — even under pressure or when it costs something.",
    variation: "Conservative respondents might place this near \"Patriotic,\" \"Family-oriented,\" and \"Principled,\" treating loyalty as a foundational virtue. Liberal respondents may see in-group loyalty as potentially in tension with universal moral principles, placing it further from \"Egalitarian\" and \"Just.\" This could reflect the pattern identified by moral foundations research, in which conservatives may weight loyalty more heavily.",
  },

  "Deferential to authority": {
    evokes: "A disposition to trust and follow established hierarchies, institutions, rules, and leadership rather than challenging or questioning them.",
    variation: "This concept might sit near \"Seeks order,\" \"Traditionalist,\" and \"Loyal\" for conservative respondents. Liberal respondents may associate it with conformism, authoritarianism, or the silencing of dissent, potentially placing it at a distance from \"Democratic\" and \"Values personal liberty.\" Religious respondents may frame it positively as appropriate humility before divine or institutional authority.",
  },

  "Caring": {
    evokes: "Active warmth and concern for the wellbeing of others — the disposition to notice suffering and want to alleviate it.",
    variation: "Broadly positive, but where it clusters may reveal different moral emphases. Liberals might place it near \"Merciful,\" \"Egalitarian,\" and \"Supports a welfare state.\" Conservatives may situate it near \"Family-oriented\" and \"Kind\" — suggesting care within community rather than through state structures. Both groups are likely to value it; the potential disagreement is about scale and mechanism.",
  },

  "Emphasizes moral purity": {
    evokes: "Concern with keeping oneself and one's community free from moral pollution, contamination, or corruption — including in ways that go beyond simple harm-prevention.",
    variation: "Research on moral foundations suggests this dimension may be stronger among religious and conservative respondents, who could place it near \"Devout,\" \"Traditionalist,\" and \"Emphasizes moral purity.\" Secular respondents might associate purity concerns with disgust-based reasoning or in-group policing, positioning it differently on their maps.",
  },

  "Principled": {
    evokes: "Adherence to a consistent moral code regardless of circumstances, social pressure, or personal cost — a person who does the right thing even when it's hard.",
    variation: "Broadly positive across groups, but potentially for different reasons. For conservatives, principled behavior might mean rule-following and consistency. For liberals, it could suggest moral courage in standing against power or convention. Both groups may value it; where they differ might be in which principles they consider most worth holding to.",
  },

  // ── Politics & Governance ────────────────────────────────────────────────

  "Values personal liberty": {
    evokes: "The right of individuals to make their own choices — about their bodies, beliefs, speech, and lives — free from government interference.",
    variation: "A cornerstone of classical liberalism and libertarianism. Conservative and libertarian respondents might rate it very positively, placing it near \"Supports a free-market economy\" and \"Democratic.\" Liberal respondents may value it too, but could nuance it with concerns about how formal freedom can mask structural inequality, potentially clustering it differently depending on which freedoms they're imagining.",
  },

  "Egalitarian": {
    evokes: "A belief in the fundamental moral equality of all people and a commitment to reducing hierarchies — of wealth, power, or social status.",
    variation: "This concept may be strongly associated with liberal political identity, potentially clustering near \"Supports multiculturalism,\" \"LGBTQ+ affirming,\" and \"Cares about promoting economic equality.\" Conservative respondents might distinguish equality of opportunity from equality of outcome, potentially placing it further from \"Supports a welfare state.\"",
  },

  "Values security": {
    evokes: "Prioritizing protection from threats — crime, foreign enemies, economic instability, social disorder — over other competing values.",
    variation: "Conservative respondents might cluster this near \"Pro-police,\" \"Seeks order,\" and \"Patriotic.\" Liberal respondents may associate security more with economic safety nets, or may be more skeptical of security arguments that justify surveillance or force. Research links higher threat sensitivity to more conservative political orientation, which could show up in how this concept is positioned.",
  },

  "Seeks order": {
    evokes: "A desire for predictability, stability, clear rules, and reliable social structures — a preference for settled arrangements over disruption.",
    variation: "For conservative respondents this might cluster near \"Traditionalist,\" \"Deferential to authority,\" and \"Values security.\" Liberal respondents may associate coercive order with the suppression of dissent or the enforcement of unjust norms, potentially placing it further from concepts they value like \"Egalitarian\" and \"Democratic.\"",
  },

  "Democratic": {
    evokes: "Commitment to participatory governance — majority rule, political equality, and the right of citizens to choose their leaders.",
    variation: "Both political sides may claim this label but with different emphases. Liberals might link it to universal voting rights, civil liberties, and anti-authoritarianism. Conservatives may emphasize constitutional constraints on majorities. Where it sits relative to \"Seeks order\" vs. \"Values personal liberty\" could be a revealing cross-group signal.",
  },

  "Traditionalist": {
    evokes: "Reverence for inherited customs, institutions, ways of life, and moral frameworks — the view that accumulated wisdom is worth preserving.",
    variation: "This concept might sit near \"Patriotic,\" \"Deferential to authority,\" and \"Family-oriented\" for conservative respondents. Liberal respondents may associate it with resistance to necessary change or with the defense of arrangements that historically harmed marginalized groups. It's likely to be one of the map's more politically discriminating concepts.",
  },

  "Patriotic": {
    evokes: "Love of one's country — pride in national identity, history, and community — and a sense of obligation to serve and protect them.",
    variation: "For conservative respondents this might cluster near \"Values security,\" \"Traditionalist,\" and \"Loyal.\" Liberal respondents may distinguish between patriotism as love of a country's ideals (which includes the willingness to criticize it) and nationalism as unconditional allegiance. Its proximity to \"Seeks order\" vs. \"Democratic\" could be politically revealing.",
  },

  // ── Society & Culture ────────────────────────────────────────────────────

  "Family-oriented": {
    evokes: "Centering one's life around family relationships, duties, and bonds — prioritizing the wellbeing of parents, children, and kin.",
    variation: "Both liberals and conservatives value family, but the concept may carry different connotations. Conservative respondents might cluster it near \"Pro-marriage,\" \"Traditionalist,\" and \"Loyal,\" often with an implicit nuclear-family model. Liberal respondents may be more likely to include diverse family structures, potentially placing it near \"LGBTQ+ affirming\" and \"Supports multiculturalism.\"",
  },

  "Pro-marriage": {
    evokes: "Support for marriage as an institution — its social importance, legal recognition, and cultural centrality.",
    variation: "For conservative respondents this concept might cluster near \"Family-oriented,\" \"Traditionalist,\" and \"Pro-religious liberty.\" For liberal respondents, marriage rights have been closely linked to LGBTQ+ equality, so it may sit nearer to \"LGBTQ+ affirming\" and \"Egalitarian.\" The cultural meaning of this concept has shifted significantly in recent decades.",
  },

  "Sexually liberated": {
    evokes: "Freedom from restrictive sexual norms — an affirmative view of diverse sexual expression, curiosity, and bodily autonomy.",
    variation: "This concept might sit near \"LGBTQ+ affirming,\" \"Emphasizes consent,\" and \"Supports multiculturalism\" for liberal respondents. For conservative and religious respondents, it may sit at a distance from \"Emphasizes moral purity,\" \"Traditionalist,\" and \"Family-oriented.\" Its relationship to \"Emphasizes consent\" — whether liberation and consent are seen as aligned or distinct — could be nuanced.",
  },

  "LGBTQ+ affirming": {
    evokes: "Explicit support for the dignity, rights, legal equality, and affirmed identities of lesbian, gay, bisexual, transgender, and queer people.",
    variation: "This is likely to be one of the survey's most discriminating concepts. Liberal respondents might cluster it tightly with \"Egalitarian,\" \"Supports multiculturalism,\" and \"Caring.\" Conservative respondents may tend to place it at greater distance from \"Pro-religious liberty,\" \"Traditionalist,\" and \"Family-oriented.\" Group differences on this concept may be among the largest in the dataset.",
  },

  "Pro-religious liberty": {
    evokes: "The right of individuals and institutions to act according to their sincere religious beliefs, even in public and commercial contexts.",
    variation: "For religious and conservative respondents this concept might cluster near \"Traditionalist,\" \"Devout,\" and \"Values personal liberty.\" Liberal respondents may see it as potentially in tension with anti-discrimination norms, especially when religious liberty claims are perceived to conflict with LGBTQ+ protections. How close these two concepts sit could be one of the map's sharpest political indicators.",
  },

  "Supports multiculturalism": {
    evokes: "Appreciation for, and active support of, cultural diversity within a society — the view that multiple traditions, languages, and ways of life can and should coexist.",
    variation: "Liberal respondents might cluster this near \"LGBTQ+ affirming,\" \"Egalitarian,\" and \"Supports a welfare state.\" Conservative respondents may see it as potentially in tension with national cohesion, shared values, or assimilation, potentially placing it further from \"Patriotic\" and \"Traditionalist.\"",
  },

  // ── Bodies, Harm & Autonomy ──────────────────────────────────────────────

  "Pro-choice": {
    evokes: "Support for the legal right to abortion and for individuals having control over their own reproductive decisions.",
    variation: "This is likely the survey's most politically charged concept. Liberal respondents might cluster it near \"Emphasizes bodily sovereignty,\" \"Values personal liberty,\" and \"Egalitarian.\" Conservative respondents may place it near concepts involving serious moral stakes, or at a distance from \"Merciful\" and \"Believes in grace.\" Where this concept sits on each group's map could be one of the most vivid illustrations of different moral architectures.",
  },

  "Emphasizes bodily sovereignty": {
    evokes: "The principle that individuals have final authority over what happens to their own bodies — a right that takes priority over external claims.",
    variation: "Liberal respondents might cluster this near \"Pro-choice,\" \"Emphasizes consent,\" and \"Values personal liberty.\" Conservative respondents may apply it selectively (e.g., in the context of vaccine mandates) or see it as potentially in tension with duties to others, placing it further from \"Emphasizes human interdependence.\"",
  },

  "Emphasizes consent": {
    evokes: "The requirement of explicit, voluntary agreement as the ethical bedrock of interactions between people — especially in sexual and medical contexts.",
    variation: "This concept may be central to contemporary liberal ethics, potentially clustering near \"Emphasizes bodily sovereignty\" and \"LGBTQ+ affirming.\" Conservative respondents might see consent as necessary but insufficient — something that leaves out commitment, community, or context. Its distance from \"Emphasizes moral purity\" could be diagnostically interesting.",
  },

  "Emphasizes human interdependence": {
    evokes: "The view that people are fundamentally relational beings — dependent on one another — and that we have real obligations to support collective wellbeing.",
    variation: "Liberal respondents might cluster this near \"Supports a welfare state\" and \"Egalitarian.\" Conservative respondents may frame interdependence as operating primarily within chosen communities (family, church, neighbors) rather than through the state, potentially placing it near \"Family-oriented\" and \"Loyal.\" Both sides may affirm interdependence while differing significantly about its scope.",
  },

  // ── Law & Justice System ─────────────────────────────────────────────────

  "Pro-police": {
    evokes: "Trust in and support for law enforcement as a force for safety and order — opposition to defunding or substantially restructuring policing.",
    variation: "This concept may show strong positive valence for conservative respondents, potentially clustering near \"Values security,\" \"Seeks order,\" and \"Patriotic.\" Liberal respondents are more variable, and some may associate it with concerns about systemic racial bias or excessive force. It's likely to be one of the map's clearest political discriminators.",
  },

  "Emphasizes rehabilitative justice": {
    evokes: "The view that the primary goal of criminal punishment is to reform offenders and help them reintegrate as productive members of society.",
    variation: "Liberal respondents might cluster this near \"Emphasizes reconciliation,\" \"Merciful,\" and \"Caring.\" Conservative respondents may place it further from \"Tough on crime\" and \"Believes in the death penalty.\" Its relationship to \"Just\" — is rehabilitation truly fair to victims? — is a philosophically contested question across groups.",
  },

  "Emphasizes punitive justice": {
    evokes: "The view that punishment should proportionately respond to wrongdoing — that offenders deserve to suffer consequences matching the severity of their crimes.",
    variation: "Conservative respondents might cluster this near \"Tough on crime\" and \"Believes in the death penalty,\" potentially treating retribution as a form of justice in its own right. Liberal respondents may see it as counterproductive, placing it at a distance from \"Emphasizes rehabilitative justice\" and \"Merciful.\"",
  },

  "Tough on crime": {
    evokes: "Strong criminal penalties, vigorous prosecution, and a hard-line approach to law enforcement — the view that deterrence and incapacitation reduce crime.",
    variation: "Conservative respondents might cluster this near \"Pro-police,\" \"Values security,\" and \"Seeks order.\" Liberal respondents may associate it with racial disparities in the criminal justice system and mass incarceration, placing it at a distance from \"Egalitarian\" and \"Caring.\"",
  },

  "Emphasizes free speech": {
    evokes: "A near-absolute commitment to protecting the right of individuals to speak without government restriction — including speech that is offensive, false, or harmful to others.",
    variation: "Traditionally associated with liberalism, but now contested across the political spectrum. Libertarians and some conservatives might place it near \"Values personal liberty.\" Progressive liberals may see unrestricted platforms for hateful speech as themselves harmful — especially to marginalized groups — and could cluster it differently than older liberal frameworks would predict.",
  },

  "Tolerates government surveillance": {
    evokes: "Acceptance of state monitoring of communications and behavior for national security purposes — a willingness to trade some privacy for safety.",
    variation: "Conservative respondents might cluster this near \"Values security.\" Libertarians and civil-liberties-focused liberals could place it far from \"Values personal liberty\" and \"Emphasizes free speech.\" Post-Snowden, skepticism of surveillance has spread across the political spectrum, potentially making this a more complex signal than it might initially appear.",
  },

  "Believes in the death penalty": {
    evokes: "Support for capital punishment as an appropriate sentence for the most serious crimes.",
    variation: "Conservative respondents might cluster this near \"Tough on crime\" and \"Emphasizes punitive justice.\" Liberal respondents may place it far from \"Emphasizes rehabilitative justice\" and \"Merciful.\" Religious respondents may show interesting variation: some may invoke retributive principles; others may cite the sanctity of human life as an argument against it.",
  },

  "Emphasizes reconciliation": {
    evokes: "Prioritizing the repair of broken relationships and the restoration of community trust after wrongdoing — justice as healing rather than punishment.",
    variation: "This concept may show strong positive valence for religious respondents, potentially clustering near \"Merciful,\" \"Believes in grace,\" and \"Caring.\" Liberal respondents might place it near \"Emphasizes rehabilitative justice.\" Some conservative respondents may see it as insufficiently attentive to victims' needs or the demands of accountability.",
  },

  // ── Economy & Social Order ───────────────────────────────────────────────

  "Supports a welfare state": {
    evokes: "Belief that government has a responsibility to provide a social safety net — healthcare, unemployment support, housing, education — for those who need it.",
    variation: "Liberal respondents might cluster this near \"Egalitarian,\" \"Caring,\" and \"Cares about promoting economic equality.\" Conservative respondents may see it as fostering dependency or expanding government overreach, potentially placing it at a distance from \"Believes in meritocracy\" and \"Supports a free-market economy.\"",
  },

  "Supports a free-market economy": {
    evokes: "Confidence in market mechanisms — prices, competition, and voluntary exchange — to allocate resources efficiently and generate widespread prosperity.",
    variation: "Conservative and libertarian respondents might cluster this near \"Values personal liberty\" and \"Believes in meritocracy.\" Liberal respondents may associate unregulated markets with inequality, potentially placing it nearer to \"Tolerates inequality in society.\" Both sides may claim to support markets; they differ in how much regulation they consider appropriate.",
  },

  "Believes in meritocracy": {
    evokes: "The view that success is determined by individual talent and effort — and that it should be, with rewards flowing to those who work hardest and perform best.",
    variation: "Conservative respondents might cluster this near \"Hardworking,\" \"Ambitious,\" and \"Supports a free-market economy.\" Liberal respondents increasingly question whether meritocracy accurately describes actual outcomes, or whether belief in it serves to legitimize inequality. Its proximity to \"Believes in luck\" is likely to be a key diagnostic pair.",
  },

  "Tolerates inequality in society": {
    evokes: "Acceptance that unequal outcomes are a natural consequence of differences in talent, effort, choices, or luck — and that this is not necessarily unjust.",
    variation: "Conservative respondents might place this near \"Supports a free-market economy\" and \"Believes in meritocracy\" — inequality as the price of freedom and incentive. Liberal respondents may cluster it near concepts they view negatively, far from \"Egalitarian\" and \"Caring.\" Its relationship to \"Believes in luck\" could reveal whether inequality is seen as earned or as arbitrary.",
  },

  "Cares about promoting economic equality in society": {
    evokes: "Active concern about reducing wealth and income disparities — the view that large gaps in material wellbeing are morally problematic and should be addressed.",
    variation: "Liberal respondents might cluster this tightly with \"Egalitarian\" and \"Supports a welfare state.\" Conservative respondents may associate it with redistribution and government overreach, potentially placing it at a distance from \"Values personal liberty\" and \"Supports a free-market economy.\"",
  },

  // ── Aesthetics & Meta-Values ─────────────────────────────────────────────

  "Driven by the desire for beauty": {
    evokes: "An orientation toward aesthetic experience — the appreciation and creation of beautiful things — as a primary source of meaning.",
    variation: "Generally viewed positively across groups. For religiously-minded respondents it might sit near \"Mystical\" and \"Spiritual,\" evoking beauty as a form of divine encounter. For others it may cluster near \"Intellectual\" or \"Driven by the desire for truth.\" Its relationship to \"Driven by the desire for truth\" could reveal whether a respondent sees beauty and truth as aligned or in tension.",
  },

  "Driven by the desire for truth": {
    evokes: "The value of honest inquiry, accuracy, and understanding reality as it is — even when the truth is uncomfortable.",
    variation: "This concept might sit near \"Rational,\" \"Scientific,\" and \"Intellectual\" for secular respondents. Religious respondents may also value truth-seeking but locate it partly in revelation, potentially giving it a different neighbourhood. Its distance from \"Amused by irony\" — whether ironic detachment serves or undermines the pursuit of truth — could be a subtle recurring signal.",
  },

  "Driven by the desire for power": {
    evokes: "Motivation by dominance, influence, and control — a drive to shape events and other people.",
    variation: "This concept tends to be viewed negatively across most groups as a character trait, but may be interpreted differently. Some respondents might see it as ambitious leadership; others as corruption or manipulation. Its position relative to \"Ambitious\" and \"Principled\" — can power be sought with integrity? — may vary interestingly between groups.",
  },

  "Driven by the desire for meaning": {
    evokes: "An orientation toward purposeful existence — the search for narrative coherence and significance in one's life and actions.",
    variation: "For religious respondents this might sit near \"Spiritual,\" \"Devout,\" and \"Driven by the desire for beauty.\" For secular respondents it could cluster near \"Intellectual\" and \"Driven by the desire for truth.\" The concept is broadly valued, but through different frameworks — meaning as given (religious) vs. meaning as constructed (existentialist).",
  },

  "Driven by the desire for personal authenticity": {
    evokes: "The value of being genuinely oneself — living in accordance with one's actual values and identity rather than performing what others expect.",
    variation: "This concept may have strong resonance with liberal respondents, potentially clustering near \"LGBTQ+ affirming,\" \"Values personal liberty,\" and \"Sexually liberated.\" Conservative respondents may value authenticity too, but could understand it differently — as integrity and principled consistency rather than self-expression. Its distance from \"Deferential to authority\" may be revealing.",
  },

  "Amused by irony": {
    evokes: "A playful, self-aware orientation toward contradictions, absurdities, and the gap between pretension and reality — finding meaning in what doesn't quite cohere.",
    variation: "Research suggests this may correlate with liberal political orientation and epistemic openness. Conservative respondents may see it as cynicism, detachment, or condescension. Despite appearing minor, this concept tends to be a surprisingly reliable discriminator between groups in existing research. Whether that pattern emerges here remains to be seen.",
  },

  // ── Identity & Character ─────────────────────────────────────────────────

  "Kind": {
    evokes: "Warmth, consideration, and benevolence toward others — the disposition to treat people gently and wish them well.",
    variation: "Universally positive, but its neighbours may differ. Religious respondents might cluster it near \"Merciful\" and \"Believes in grace.\" Liberal respondents may place it near \"Caring\" and \"Egalitarian.\" Conservative respondents might associate it with \"Humble\" and \"Hardworking.\" These different neighbourhoods could reveal different theories of what kindness is ultimately for.",
  },

  "Honest": {
    evokes: "Truthfulness, transparency, and integrity in all dealings — a person who tells the truth even when it's inconvenient.",
    variation: "Among the most universally valued concepts in the survey. Its neighbourhood is revealing: if it clusters near virtue concepts (\"Principled,\" \"Just\") vs. epistemic concepts (\"Rational,\" \"Scientific\"), it suggests a moral vs. an intellectual framing of honesty. Both framings are legitimate; they reflect different theories of what makes honesty important.",
  },

  "Ambitious": {
    evokes: "Strong desire to succeed, achieve, and advance — a drive toward goals and a refusal to settle for less.",
    variation: "Positive for most respondents, and might cluster particularly close to \"Hardworking\" and \"Believes in meritocracy\" in conservative samples. Some religious and communitarian respondents may see unchecked ambition as a form of pride, placing it at a greater distance from \"Humble\" and \"Caring.\" Its tension with humility is one of the oldest ethical puzzles.",
  },

  "Humble": {
    evokes: "Modesty, openness to being wrong, and freedom from arrogance — the capacity to hold one's own perspective lightly.",
    variation: "Valued across groups but potentially for different reasons. Religious respondents might cluster it near \"Devout\" and \"Deferential to authority\" — humility before God. Secular respondents may place it near \"Honest\" and \"Kind\" — epistemic humility and gentleness. Its distance from \"Ambitious\" could be an interesting cross-group signal.",
  },

  "Hardworking": {
    evokes: "Diligence, industriousness, and sustained commitment to one's responsibilities — the work ethic that takes pride in effort.",
    variation: "Near-universally positive. Conservative respondents might cluster it tightly near \"Believes in meritocracy\" and \"Ambitious\" — hard work as the engine of deserved success. Its proximity to \"Humble\" vs. \"Ambitious\" could reveal whether respondents see work primarily as a form of self-improvement or as the basis for justified reward.",
  },

  "Believes in luck": {
    evokes: "The view that chance, circumstance, and unearned advantage play a significant role in determining life outcomes — that success is not purely the product of individual effort.",
    variation: "Liberal respondents might place this in a cluster that functions as a critique of meritocracy — far from \"Believes in meritocracy\" and near \"Tolerates inequality in society\" (with the implicit argument that if luck matters, unequal outcomes are less justifiable). Conservative respondents may tend to place it further from \"Hardworking,\" since acknowledging luck can complicate the case for individual responsibility. This could be a quietly powerful discriminating concept.",
  },
};

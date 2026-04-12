/**
 * conceptDescriptions.js
 *
 * For each of the 61 survey concepts, provides:
 *   evokes    – what the concept is intended to evoke in the respondent's mind
 *   variation – how perceptions of it, and its proximity to other concepts,
 *               tend to differ across identity groups
 *
 * These are displayed when a user clicks a concept dot on the map.
 * They are written to be accessible to non-specialist users and to invite
 * reflection on how the same word can occupy very different neighbourhoods
 * in different people's mental landscapes.
 */

export const CONCEPT_DESCRIPTIONS = {

  // ── Knowledge & Ways of Knowing ──────────────────────────────────────────

  "Intellectual": {
    evokes: "A person who finds deep satisfaction in abstract reasoning, theory, and the life of the mind — someone for whom ideas are intrinsically valuable.",
    variation: "Broadly positive across groups, but its neighbours differ. For some it sits close to \"Rational\" and \"Scientific\"; for others it carries faint associations with ivory-tower detachment. In politically polarized samples, it tends to cluster more tightly with liberal respondents' maps than conservative ones.",
  },

  "Rational": {
    evokes: "Systematic, logical reasoning guided by evidence and argument rather than emotion or tradition.",
    variation: "Almost universally valued — but what rationality is applied *to* differs. Some respondents place it near \"Scientific,\" emphasizing empirical reasoning. Others place it near \"Principled\" or \"Just,\" suggesting rule-based moral reasoning. Its distance from \"Intuitive\" is one of the map's most revealing cross-group signals.",
  },

  "Scientific": {
    evokes: "Commitment to empirical evidence, peer review, experimental testing, and the methodology of the natural sciences.",
    variation: "Strong positive valence among secular and liberal respondents, where it typically clusters tightly with \"Rational\" and \"Intellectual.\" Among religious respondents, its position relative to \"Devout\" and \"Mystical\" is more varied — some see faith and science as compatible, others as in tension.",
  },

  "Intuitive": {
    evokes: "Trusting gut feelings, tacit knowledge, and non-verbal understanding — the sense that something is right before you can fully explain why.",
    variation: "Liberals may associate it with empathy and artistic sensibility, placing it near aesthetic concepts. Conservatives and religious respondents often place it near moral common sense or spiritual discernment. Its distance from \"Rational\" and \"Scientific\" tends to be larger in secular samples.",
  },

  "Mystical": {
    evokes: "Direct, unmediated experience of the sacred, the transcendent, or the ineffable — a sense of contact with something beyond ordinary reality.",
    variation: "Sits close to \"Devout,\" \"Spiritual,\" and \"Reverent\" for religious respondents. In secular samples it may be placed near \"Intuitive\" and aesthetic concepts, or at a greater distance from \"Scientific\" and \"Rational.\" Its ambiguity — negative for strict empiricists, positive for many religious respondents — makes it a useful signal.",
  },

  "Practical": {
    evokes: "Hands-on problem solving, common sense, and an orientation toward what works rather than what's theoretically elegant.",
    variation: "Generally positive across groups. Conservatives often place it close to \"Hardworking\" and \"Loyal.\" Some liberal respondents may see it as in mild tension with visionary or idealistic thinking. Its distance from \"Intellectual\" varies interestingly between groups.",
  },

  // ── Religion & Worldview ─────────────────────────────────────────────────

  "Devout": {
    evokes: "Deep, practiced religious commitment — regular prayer, community participation, adherence to doctrine, and organizing one's life around faith.",
    variation: "For religious respondents it clusters tightly with \"Reverent,\" \"Believes in grace,\" and \"Spiritual.\" For secular respondents it may sit near \"Traditionalist\" or \"Deferential to authority.\" Its proximity to \"Atheist\" is one of the map's most diagnostically interesting patterns: some respondents (of both types) see them as sharing a certain epistemic intensity.",
  },

  "Atheist": {
    evokes: "Explicit rejection of belief in God or gods, typically accompanied by a naturalistic worldview and reliance on science and reason.",
    variation: "For secular respondents it often clusters near \"Rational\" and \"Scientific.\" For religious respondents it sits far from \"Devout\" and \"Reverent\" — though some place it near \"Devout\" (shared certainty of conviction). Its relationship with \"Amused by irony\" and \"Intellectual\" is a subtle but reliable group-differentiating signal.",
  },

  "Spiritual": {
    evokes: "A felt sense of connection to something larger than oneself — nature, humanity, the cosmos — without necessarily adhering to formal religious doctrine.",
    variation: "One of the most ambiguous concepts in the set. Secular respondents may place it near \"Intuitive,\" \"Mystical,\" or aesthetic concepts. Religious respondents may see it as a genuine but underdeveloped form of faith, placing it between \"Devout\" and \"Amused by irony.\" It rarely sits at either extreme of any map.",
  },

  "Deeply concerned with personal guilt": {
    evokes: "A heightened moral sensitivity to one's own failings — the kind of inner accounting that leads to confession, repentance, or reparation.",
    variation: "Central to Christian (particularly Protestant and Catholic) moral psychology, where it clusters near \"Believes in grace\" and \"Devout.\" More secular respondents may associate it with anxiety, moral perfectionism, or psychological burden — placing it further from positive concepts and closer to traits they'd characterize as unhealthy.",
  },

  "Believes in grace": {
    evokes: "The theological idea that forgiveness and moral restoration are gifts freely given — that people are saved by mercy, not purely by merit.",
    variation: "Deeply resonant for Christian respondents, clustering tightly with \"Devout,\" \"Reverent,\" and \"Merciful.\" For secular respondents it may be reinterpreted as general compassion or forgiveness between people, and placed near \"Caring\" and \"Kind.\" Its position relative to \"Just\" (justice vs. mercy) is philosophically interesting across groups.",
  },

  "Reverent": {
    evokes: "A disposition of deep respect, awe, and deference — toward the sacred, the ancestral, the natural world, or anything felt to be larger and more permanent than oneself.",
    variation: "Religious respondents place it near \"Devout\" and \"Spiritual.\" Conservative respondents may also link it to \"Patriotic\" and \"Traditionalist\" — reverence for institutions and history. Liberal respondents may associate it more with environmental awe or cultural appreciation. One of the map's most cross-cutting concepts.",
  },

  // ── Moral Values & Virtues ──────────────────────────────────────────────

  "Just": {
    evokes: "A commitment to fairness, proportionality, and right outcomes — giving each person what they deserve according to consistent principles.",
    variation: "Almost universally positive, but the content of justice differs sharply between groups. For liberals, \"just\" clusters near \"Egalitarian\" and \"Caring.\" For conservatives it sits closer to \"Principled\" and \"Tough on crime.\" The gulf between retributive and distributive conceptions of justice is one of the deepest moral divides in the dataset.",
  },

  "Merciful": {
    evokes: "Compassion in action — a willingness to forgive, to temper punishment with kindness, and to see the humanity in someone who has done wrong.",
    variation: "Central to religious moral psychology (near \"Believes in grace,\" \"Devout,\" \"Kind\"). In the context of criminal justice, it maps onto rehabilitative approaches for liberal respondents and may be seen as incompatible with serious punishment by conservative respondents. Its tension with \"Just\" is one of the oldest moral questions.",
  },

  "Loyal": {
    evokes: "Steadfast commitment to one's people — family, friends, community, or nation — even under pressure or when it costs something.",
    variation: "Conservatives often place it near \"Patriotic,\" \"Family-oriented,\" and \"Principled,\" treating loyalty as a foundational virtue. Liberal respondents may see in-group loyalty as in tension with universal moral principles, placing it further from \"Egalitarian\" and \"Just.\" This reflects Jonathan Haidt's finding that conservatives weight loyalty as a moral foundation more heavily than liberals.",
  },

  "Deferential to authority": {
    evokes: "A disposition to trust and follow established hierarchies, institutions, rules, and leadership rather than challenging or questioning them.",
    variation: "Sits near \"Seeks order,\" \"Traditionalist,\" and \"Loyal\" for conservative respondents. Liberal respondents may associate it with conformism, authoritarianism, or the silencing of dissent, placing it at a distance from \"Democratic\" and \"Values personal liberty.\" Religious respondents may see it as appropriate humility before divine authority.",
  },

  "Caring": {
    evokes: "Active warmth and concern for the wellbeing of others — the disposition to notice suffering and want to alleviate it.",
    variation: "Broadly positive, but where it clusters reveals different moral emphases. Liberals often place it near \"Merciful,\" \"Egalitarian,\" and \"Supports a welfare state.\" Conservatives may place it near \"Family-oriented\" and \"Kind\" — care within community rather than through state structures. Both groups value it; the disagreement is about scale and mechanism.",
  },

  "Emphasizes moral purity": {
    evokes: "Concern with keeping oneself and one's community free from moral pollution, contamination, or corruption — including in ways that go beyond harm-prevention.",
    variation: "Philosopher Jonathan Haidt identifies \"purity/sanctity\" as a moral foundation that is stronger among religious and conservative respondents. They may place this near \"Devout,\" \"Traditionalist,\" and \"Emphasizes moral purity.\" Secular respondents may associate purity concerns with superstition, disgust-based reasoning, or in-group exclusion.",
  },

  "Principled": {
    evokes: "Adherence to a consistent moral code regardless of circumstances, social pressure, or personal cost — a person who does the right thing even when it's hard.",
    variation: "Broadly positive across groups but for different reasons. For conservatives, principled behavior may mean rule-following and consistency. For liberals, it may mean courage in standing against power. Both groups value integrity; they may disagree about which principles deserve the most loyalty.",
  },

  // ── Politics & Governance ────────────────────────────────────────────────

  "Values personal liberty": {
    evokes: "The right of individuals to make their own choices — about their bodies, beliefs, speech, and lives — free from government interference.",
    variation: "A cornerstone of classical liberalism and libertarianism. Rated very positively by conservatives and libertarians (near \"Supports a free-market economy,\" \"Democratic\"). Liberal respondents may nuance it with concerns about how formal freedom can mask structural inequality, or may cluster it differently depending on which freedoms they're imagining.",
  },

  "Egalitarian": {
    evokes: "A belief in the fundamental moral equality of all people and a commitment to reducing hierarchies — of wealth, power, or social status.",
    variation: "Strongly associated with liberal political identity — liberals cluster it near \"Supports multiculturalism,\" \"LGBTQ+ affirming,\" and \"Cares about promoting economic equality.\" Conservative respondents may distinguish equality of opportunity from equality of outcome, placing it further from \"Supports a welfare state.\"",
  },

  "Values security": {
    evokes: "Prioritizing protection from threats — crime, foreign enemies, economic instability, social disorder — over other competing values.",
    variation: "Conservatives cluster it near \"Pro-police,\" \"Seeks order,\" and \"Patriotic.\" Liberal respondents may associate it with economic security (near \"Supports a welfare state\") or may be more skeptical of security arguments that justify surveillance or force. Cross-cultural research links threat sensitivity to conservative political orientation.",
  },

  "Seeks order": {
    evokes: "A desire for predictability, stability, clear rules, and reliable social structures — a preference for settled arrangements over disruption.",
    variation: "For conservatives it clusters near \"Traditionalist,\" \"Deferential to authority,\" and \"Values security.\" Liberal respondents may associate coercive order with suppression of dissent or enforcement of unjust norms, placing it further from concepts they value like \"Egalitarian\" and \"Democratic.\"",
  },

  "Democratic": {
    evokes: "Commitment to participatory governance — majority rule, political equality, and the right of citizens to choose their leaders.",
    variation: "Both political sides claim the label, but with different emphases. Liberals often link it to universal voting rights, civil liberties, and anti-authoritarianism. Conservatives may emphasize constitutional constraints on majorities (the republic vs. pure democracy distinction). Where it sits relative to \"Seeks order\" vs. \"Values personal liberty\" is a revealing cross-group signal.",
  },

  "Traditionalist": {
    evokes: "Reverence for inherited customs, institutions, ways of life, and moral frameworks — the view that accumulated wisdom is worth preserving.",
    variation: "Sits near \"Patriotic,\" \"Deferential to authority,\" and \"Family-oriented\" for conservative respondents. Liberal respondents may associate it with resistance to necessary change or with the defense of arrangements that historically harmed marginalized groups. One of the map's most discriminating political concepts.",
  },

  "Patriotic": {
    evokes: "Love of one's country — pride in national identity, history, and community — and a sense of obligation to serve and protect them.",
    variation: "For conservatives it clusters near \"Values security,\" \"Traditionalist,\" and \"Loyal.\" Liberal respondents often distinguish between patriotism (love of a country's ideals, including the willingness to criticize it) and nationalism (unconditional allegiance). Its proximity to \"Seeks order\" vs. \"Democratic\" is politically telling.",
  },

  // ── Society & Culture ────────────────────────────────────────────────────

  "Family-oriented": {
    evokes: "Centering one's life around family relationships, duties, and bonds — prioritizing the wellbeing of parents, children, and kin.",
    variation: "Both liberals and conservatives value family, but the concept carries different connotations. Conservatives cluster it near \"Pro-marriage,\" \"Traditionalist,\" and \"Loyal,\" often with an implicit nuclear-family model. Liberal respondents are more likely to include diverse family structures, placing it near \"LGBTQ+ affirming\" and \"Supports multiculturalism.\"",
  },

  "Pro-marriage": {
    evokes: "Support for marriage as an institution — its social importance, legal recognition, and cultural centrality.",
    variation: "For conservative respondents it clusters near \"Family-oriented,\" \"Traditionalist,\" and historically \"Pro-religious liberty.\" For liberal respondents, marriage rights have been closely linked to LGBTQ+ equality, so it may sit near \"LGBTQ+ affirming\" and \"Egalitarian.\" The concept has been a major cultural battleground.",
  },

  "Sexually liberated": {
    evokes: "Freedom from restrictive sexual norms — an affirmative view of diverse sexual expression, curiosity, and bodily autonomy.",
    variation: "Sits near \"LGBTQ+ affirming,\" \"Emphasizes consent,\" and \"Supports multiculturalism\" for liberal respondents. For conservative and religious respondents, it typically sits at a distance from \"Emphasizes moral purity,\" \"Traditionalist,\" and \"Family-oriented.\" Its relationship to \"Emphasizes consent\" (values consent vs. values liberation) is nuanced.",
  },

  "LGBTQ+ affirming": {
    evokes: "Explicit support for the dignity, rights, legal equality, and affirmed identities of lesbian, gay, bisexual, transgender, and queer people.",
    variation: "One of the survey's most discriminating concepts. Liberal respondents cluster it tightly with \"Egalitarian,\" \"Supports multiculturalism,\" and \"Caring.\" Conservative respondents typically place it at greater distance from \"Pro-religious liberty,\" \"Traditionalist,\" and \"Family-oriented.\" Group differences on this concept tend to be among the largest in the dataset.",
  },

  "Pro-religious liberty": {
    evokes: "The right of individuals and institutions to act according to their sincere religious beliefs, even in public and commercial contexts.",
    variation: "For religious and conservative respondents it clusters near \"Traditionalist,\" \"Devout,\" and \"Values personal liberty.\" Liberal respondents may see it in tension with anti-discrimination norms, especially when religious liberty claims conflict with \"LGBTQ+ affirming\" protections. How close these two concepts sit is one of the map's sharpest political indicators.",
  },

  "Supports multiculturalism": {
    evokes: "Appreciation for, and active support of, cultural diversity within a society — the view that multiple traditions, languages, and ways of life can and should coexist.",
    variation: "Liberal respondents cluster it near \"LGBTQ+ affirming,\" \"Egalitarian,\" and \"Supports a welfare state.\" Conservative respondents may see it as potentially undermining national cohesion, shared values, or assimilation, placing it further from \"Patriotic\" and \"Traditionalist.\"",
  },

  // ── Bodies, Harm & Autonomy ──────────────────────────────────────────────

  "Pro-choice": {
    evokes: "Support for the legal right to abortion and for individuals having control over their own reproductive decisions.",
    variation: "The survey's most politically charged concept. Liberal respondents cluster it near \"Emphasizes bodily sovereignty,\" \"Values personal liberty,\" and \"Egalitarian.\" Conservative respondents may place it near concepts involving serious moral stakes (\"Believes in the death penalty\") or at a distance from \"Merciful\" and \"Believes in grace.\" Where this sits on each group's map is one of the most vivid illustrations of different moral architectures.",
  },

  "Emphasizes bodily sovereignty": {
    evokes: "The principle that individuals have final authority over what happens to their own bodies — a right that takes priority over external claims.",
    variation: "Liberal respondents cluster it near \"Pro-choice,\" \"Emphasizes consent,\" and \"Values personal liberty.\" Conservative respondents may apply it selectively (e.g., opposing vaccine mandates) or see it as in tension with duties to others — placing it further from \"Emphasizes human interdependence.\"",
  },

  "Emphasizes consent": {
    evokes: "The requirement of explicit, voluntary agreement as the ethical bedrock of interactions between people — especially in sexual and medical contexts.",
    variation: "Central to contemporary liberal ethics, clustering near \"Emphasizes bodily sovereignty\" and \"LGBTQ+ affirming.\" Conservative respondents may see it as necessary but insufficient — consent without commitment, community, or context leaves something important out. Its distance from \"Emphasizes moral purity\" is diagnostically interesting.",
  },

  "Emphasizes human interdependence": {
    evokes: "The view that people are fundamentally relational beings — dependent on one another — and that we have real obligations to support collective wellbeing.",
    variation: "Liberal respondents may cluster it near \"Supports a welfare state\" and \"Egalitarian.\" Conservative respondents may see interdependence as operating primarily within chosen communities (family, church, neighbors) rather than through the state, placing it near \"Family-oriented\" and \"Loyal.\" Both sides affirm interdependence; they differ on its scope.",
  },

  // ── Law & Justice System ─────────────────────────────────────────────────

  "Pro-police": {
    evokes: "Trust in and support for law enforcement as a force for safety and order — opposition to defunding or substantially restructuring policing.",
    variation: "Strong positive valence for conservative respondents, clustering near \"Values security,\" \"Seeks order,\" and \"Patriotic.\" Liberal respondents are more varied, and may associate it with concerns about systemic racial bias or excessive force. One of the map's clearest political discriminators.",
  },

  "Emphasizes rehabilitative justice": {
    evokes: "The view that the primary goal of criminal punishment is to reform offenders and help them reintegrate as productive members of society.",
    variation: "Liberal respondents cluster it near \"Emphasizes reconciliation,\" \"Merciful,\" and \"Caring.\" Conservative respondents place it further from \"Tough on crime\" and \"Believes in the death penalty.\" Its relationship to \"Just\" (is rehabilitation truly fair to victims?) is a philosophically contested question.",
  },

  "Emphasizes punitive justice": {
    evokes: "The view that punishment should proportionately respond to wrongdoing — that offenders deserve to suffer consequences matching the severity of their crimes.",
    variation: "Conservative respondents cluster it near \"Tough on crime\" and \"Believes in the death penalty,\" often treating retribution as a form of justice in its own right. Liberal respondents may see it as morally outdated or counterproductive, placing it far from \"Emphasizes rehabilitative justice\" and \"Merciful.\"",
  },

  "Tough on crime": {
    evokes: "Strong criminal penalties, vigorous prosecution, and a hard-line approach to law enforcement — the view that deterrence and incapacitation reduce crime.",
    variation: "Conservative respondents cluster it near \"Pro-police,\" \"Values security,\" and \"Seeks order.\" Liberal respondents often associate it with racial disparities in the criminal justice system and mass incarceration, placing it at a distance from \"Egalitarian\" and \"Caring.\"",
  },

  "Emphasizes free speech": {
    evokes: "A near-absolute commitment to protecting the right of individuals to speak without government restriction — including speech that is offensive, false, or harmful to others.",
    variation: "Traditionally associated with liberalism, but now contested across the political spectrum. Libertarians and some conservatives place it near \"Values personal liberty.\" Progressive liberals may see unrestricted platforms for hateful speech as themselves harmful — especially to marginalized groups — and may cluster it differently than they would have a generation ago.",
  },

  "Tolerates government surveillance": {
    evokes: "Acceptance of state monitoring of communications and behavior for national security purposes — a willingness to trade some privacy for safety.",
    variation: "Conservative respondents may cluster it near \"Values security\"; libertarians and civil-liberties-focused liberals place it far from \"Values personal liberty\" and \"Emphasizes free speech.\" Post-Edward Snowden, skepticism of surveillance has spread across the political spectrum, making this a more complex signal than it once was.",
  },

  "Believes in the death penalty": {
    evokes: "Support for capital punishment as an appropriate sentence for the most serious crimes.",
    variation: "Conservative respondents cluster it near \"Tough on crime\" and \"Emphasizes punitive justice.\" Liberal respondents place it far from \"Emphasizes rehabilitative justice\" and \"Merciful.\" Religious respondents show interesting splits: some cite retributive biblical principles; others cite the sanctity of human life as an argument against it.",
  },

  "Emphasizes reconciliation": {
    evokes: "Prioritizing the repair of broken relationships and the restoration of community trust after wrongdoing — justice as healing rather than punishment.",
    variation: "Strong positive valence for religious respondents, clustering near \"Merciful,\" \"Believes in grace,\" and \"Caring.\" Liberal respondents place it near \"Emphasizes rehabilitative justice.\" Some conservative respondents may see it as insufficiently attentive to victims' needs or the demands of accountability.",
  },

  // ── Economy & Social Order ───────────────────────────────────────────────

  "Supports a welfare state": {
    evokes: "Belief that government has a responsibility to provide a social safety net — healthcare, unemployment support, housing, education — for those who need it.",
    variation: "Liberal respondents cluster it near \"Egalitarian,\" \"Caring,\" and \"Cares about promoting economic equality.\" Conservative respondents may see it as fostering dependency, expanding government overreach, or misallocating resources, placing it at a distance from \"Believes in meritocracy\" and \"Supports a free-market economy.\"",
  },

  "Supports a free-market economy": {
    evokes: "Confidence in market mechanisms — prices, competition, and voluntary exchange — to allocate resources efficiently and generate widespread prosperity.",
    variation: "Conservative and libertarian respondents cluster it near \"Values personal liberty\" and \"Believes in meritocracy.\" Liberal respondents may associate an unregulated market with inequality, placing it near \"Tolerates inequality in society.\" Both sides claim to support markets; they disagree about how much regulation is appropriate.",
  },

  "Believes in meritocracy": {
    evokes: "The view that success is determined by individual talent and effort — and that it should be, with rewards flowing to those who work hardest and perform best.",
    variation: "Conservative respondents cluster it near \"Hardworking,\" \"Ambitious,\" and \"Supports a free-market economy.\" Liberal respondents increasingly question whether meritocracy accurately describes actual outcomes (given structural advantages and luck) or whether the belief in it legitimizes inequality. Its proximity to \"Believes in luck\" is a key diagnostic pair.",
  },

  "Tolerates inequality in society": {
    evokes: "Acceptance that unequal outcomes are a natural consequence of differences in talent, effort, choices, or luck — and that this is not necessarily unjust.",
    variation: "Conservative respondents may place it near \"Supports a free-market economy\" and \"Believes in meritocracy\" — inequality as the price of freedom and incentive. Liberal respondents cluster it near concepts they view negatively, far from \"Egalitarian\" and \"Caring.\" Its relationship to \"Believes in luck\" reveals whether inequality is seen as earned or arbitrary.",
  },

  "Cares about promoting economic equality in society": {
    evokes: "Active concern about reducing wealth and income disparities — the view that large gaps in material wellbeing are morally problematic and should be addressed.",
    variation: "Liberal respondents cluster it tightly with \"Egalitarian\" and \"Supports a welfare state.\" Conservative respondents may see it as code for redistribution and government overreach, placing it at a distance from \"Values personal liberty\" and \"Supports a free-market economy.\"",
  },

  // ── Aesthetics & Meta-Values ─────────────────────────────────────────────

  "Driven by the desire for beauty": {
    evokes: "An orientation toward aesthetic experience — the appreciation and creation of beautiful things — as a primary source of meaning.",
    variation: "Generally positive across groups. May sit near \"Mystical\" and \"Spiritual\" for religiously-minded respondents (beauty as a form of divine encounter). Near \"Intellectual\" for others. Its relationship to \"Driven by the desire for truth\" reveals whether a person sees beauty and truth as aligned or in tension.",
  },

  "Driven by the desire for truth": {
    evokes: "The value of honest inquiry, accuracy, and understanding reality as it is — even when the truth is uncomfortable.",
    variation: "Near \"Rational,\" \"Scientific,\" and \"Intellectual\" for secular respondents. Religious respondents may also value truth-seeking but locate it partly in revelation, giving it a different neighbourhood. Its distance from \"Amused by irony\" (irony as a stance of perpetual detachment) is a subtle but recurring signal.",
  },

  "Driven by the desire for power": {
    evokes: "Motivation by dominance, influence, and control — a drive to shape events and other people.",
    variation: "Viewed negatively across most groups as a character trait, but interpreted differently. Some see it as ambitious leadership; others as corruption or manipulation. Its position relative to \"Ambitious\" and \"Principled\" — are power-seekers unprincipled, or can power be sought with integrity? — varies interestingly.",
  },

  "Driven by the desire for meaning": {
    evokes: "An orientation toward purposeful existence — the search for narrative coherence and significance in one's life and actions.",
    variation: "Near \"Spiritual,\" \"Devout,\" and \"Driven by the desire for beauty\" for religious respondents. Near \"Intellectual\" and \"Driven by the desire for truth\" for secular respondents. Broadly valued but through different frameworks — meaning as given (religious) vs. meaning as constructed (existentialist).",
  },

  "Driven by the desire for personal authenticity": {
    evokes: "The value of being genuinely oneself — living in accordance with one's actual values and identity rather than performing what others expect.",
    variation: "Strong resonance with liberal respondents, clustering near \"LGBTQ+ affirming,\" \"Values personal liberty,\" and \"Sexually liberated.\" Conservative respondents may value authenticity too, but understand it differently — as integrity and principled consistency rather than self-expression. Its distance from \"Deferential to authority\" is revealing.",
  },

  "Amused by irony": {
    evokes: "A playful, self-aware orientation toward contradictions, absurdities, and the gap between pretension and reality — finding meaning in what doesn't quite cohere.",
    variation: "Research suggests this correlates with liberal political orientation and epistemic openness. Conservative respondents may see it as cynicism, detachment, or elite condescension. Despite appearing minor, it tends to be a surprisingly reliable discriminator between groups on the map. Its relationship to \"Driven by the desire for truth\" is interesting: does ironic detachment serve or undermine the pursuit of truth?",
  },

  // ── Identity & Character ─────────────────────────────────────────────────

  "Kind": {
    evokes: "Warmth, consideration, and benevolence toward others — the disposition to treat people gently and wish them well.",
    variation: "Universally positive, but its neighbours differ. Religious respondents may cluster it near \"Merciful\" and \"Believes in grace.\" Liberal respondents near \"Caring\" and \"Egalitarian.\" Conservative respondents near \"Humble\" and \"Hardworking.\" These different neighbourhoods reveal different theories of what kindness is for.",
  },

  "Honest": {
    evokes: "Truthfulness, transparency, and integrity in all dealings — a person who tells the truth even when it's inconvenient.",
    variation: "Among the most universally valued concepts in the survey. Its neighbourhood is revealing: if it sits near virtue concepts (\"Principled,\" \"Just\") vs. epistemic concepts (\"Rational,\" \"Scientific\"), it suggests a moral vs. an intellectual framing of honesty. Both are legitimate; they reflect different theories of what makes honesty important.",
  },

  "Ambitious": {
    evokes: "Strong desire to succeed, achieve, and advance — a drive toward goals and a refusal to settle for less.",
    variation: "Positive for most respondents, especially near \"Hardworking\" and \"Believes in meritocracy\" in conservative samples. Some religious and communitarian respondents may see unchecked ambition as a form of pride, placing it at a distance from \"Humble\" and \"Caring.\" Its tension with humility is one of the oldest ethical puzzles.",
  },

  "Humble": {
    evokes: "Modesty, openness to being wrong, and freedom from arrogance — the capacity to hold one's own perspective lightly.",
    variation: "Valued across groups but for different reasons. Religious respondents may cluster it near \"Devout\" and \"Deferential to authority\" — humility before God. Secular respondents may place it near \"Honest\" and \"Kind\" — epistemic humility and gentleness. Its distance from \"Ambitious\" is an interesting cross-group signal.",
  },

  "Hardworking": {
    evokes: "Diligence, industriousness, and sustained commitment to one's responsibilities — the work ethic that takes pride in effort.",
    variation: "Near-universally positive. Conservative respondents often cluster it near \"Believes in meritocracy\" and \"Ambitious\" — hard work as the engine of deserved success. Its proximity to \"Humble\" vs. \"Ambitious\" reveals whether respondents see work as a form of self-improvement or as the basis for justified reward.",
  },

  "Believes in luck": {
    evokes: "The view that chance, circumstance, and unearned advantage play a significant role in determining life outcomes — that success is not purely the product of individual effort.",
    variation: "Liberal respondents often cluster it near critiques of meritocracy — far from \"Believes in meritocracy\" and near \"Tolerates inequality in society\" (as a critique: if outcomes depend on luck, inequality is less justified). Conservative respondents tend to place it further from \"Hardworking\" — because acknowledging luck can undermine the case for individual responsibility. A quietly powerful discriminating concept.",
  },
};

/** Shared 22-question framework (pillar, text, description, maxScore, weight, order, evidenceRequired). */
export const QUESTIONS = [
  // Research & Innovation (5)
  { pillar: "research", text: "AI-related peer-reviewed publications in the last 3 years", description: "Count of peer-reviewed AI/ML publications.", maxScore: 20, weight: 1, order: 1, evidenceRequired: false },
  { pillar: "research", text: "AI research funding secured (USD millions) in the last 3 years", description: "Total external AI research funding.", maxScore: 20, weight: 1, evidenceRequired: true, order: 2 },
  { pillar: "research", text: "Dedicated AI research labs/centers", description: "Number of dedicated AI labs or centers.", maxScore: 20, weight: 1, evidenceRequired: false, order: 3 },
  { pillar: "research", text: "AI-related patents filed in the last 3 years", description: "Patents filed with AI subject matter.", maxScore: 20, weight: 1, evidenceRequired: false, order: 4 },
  { pillar: "research", text: "Interdisciplinary AI research initiatives", description: "Cross-department AI research programs.", maxScore: 20, weight: 1, evidenceRequired: false, order: 5 },
  // Curriculum & Education (5)
  { pillar: "curriculum", text: "AI/ML courses at undergraduate level", description: "Number of undergraduate AI/ML courses.", maxScore: 20, weight: 1, evidenceRequired: false, order: 6 },
  { pillar: "curriculum", text: "AI/ML courses at graduate level", description: "Number of graduate AI/ML courses.", maxScore: 20, weight: 1, evidenceRequired: false, order: 7 },
  { pillar: "curriculum", text: "Interdisciplinary AI programs", description: "AI + ethics, healthcare, etc.", maxScore: 20, weight: 1, evidenceRequired: false, order: 8 },
  { pillar: "curriculum", text: "AI literacy programs for non-CS students", description: "AI literacy offerings outside CS.", maxScore: 20, weight: 1, evidenceRequired: false, order: 9 },
  { pillar: "curriculum", text: "Faculty professional development in AI teaching", description: "Training programs for faculty.", maxScore: 20, weight: 1, evidenceRequired: false, order: 10 },
  // Infrastructure & Compute (4)
  { pillar: "infrastructure", text: "GPU compute capacity", description: "FLOPS or GPU count available.", maxScore: 25, weight: 1, evidenceRequired: true, order: 11 },
  { pillar: "infrastructure", text: "Cloud computing partnerships", description: "AWS, Azure, GCP partnerships.", maxScore: 25, weight: 1, evidenceRequired: false, order: 12 },
  { pillar: "infrastructure", text: "HPC access for AI research", description: "High-Performance Computing access.", maxScore: 25, weight: 1, evidenceRequired: false, order: 13 },
  { pillar: "infrastructure", text: "Data storage and management infrastructure", description: "Infrastructure for AI datasets.", maxScore: 25, weight: 1, evidenceRequired: false, order: 14 },
  // Ethics & Governance (4)
  { pillar: "ethics", text: "AI ethics review board", description: "Existence of an AI ethics board.", maxScore: 25, weight: 1, evidenceRequired: true, order: 15 },
  { pillar: "ethics", text: "Bias audit and fairness testing protocols", description: "Documented fairness testing.", maxScore: 25, weight: 1, evidenceRequired: true, order: 16 },
  { pillar: "ethics", text: "Data privacy policies for AI systems", description: "Student/faculty privacy policies.", maxScore: 25, weight: 1, evidenceRequired: true, order: 17 },
  { pillar: "ethics", text: "AI governance framework documentation", description: "Published governance framework.", maxScore: 25, weight: 1, evidenceRequired: true, order: 18 },
  // Industry & Partnership (4)
  { pillar: "industry", text: "Active industry partnerships for AI research", description: "Number of active partnerships.", maxScore: 25, weight: 1, evidenceRequired: false, order: 19 },
  { pillar: "industry", text: "AI internship and placement programs", description: "Industry internship programs.", maxScore: 25, weight: 1, evidenceRequired: false, order: 20 },
  { pillar: "industry", text: "Technology transfer and commercialization", description: "Tech transfer initiatives.", maxScore: 25, weight: 1, evidenceRequired: false, order: 21 },
  { pillar: "industry", text: "Joint AI research centers with industry", description: "Joint centers with partners.", maxScore: 25, weight: 1, evidenceRequired: false, order: 22 },
];

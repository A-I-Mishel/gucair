import type { Timestamp } from "firebase/firestore";

export type Region =
  | "North America"
  | "Europe"
  | "Asia"
  | "Africa"
  | "South America"
  | "Oceania";

export type PillarKey = "research" | "curriculum" | "infrastructure" | "ethics" | "industry";

export type PillarScores = Record<PillarKey, number>;

export const PILLARS: { key: PillarKey; label: string; weight: number; description: string }[] = [
  { key: "research", label: "Research & Innovation", weight: 0.25, description: "AI publications, patents, funding, labs" },
  { key: "curriculum", label: "Curriculum & Education", weight: 0.25, description: "AI courses, programs, enrollment, training" },
  { key: "infrastructure", label: "Infrastructure & Compute", weight: 0.2, description: "GPU clusters, cloud, HPC, data centers" },
  { key: "ethics", label: "Ethics & Governance", weight: 0.15, description: "Ethics board, bias audits, privacy, governance" },
  { key: "industry", label: "Industry & Partnership", weight: 0.15, description: "Partnerships, internships, tech transfer" },
];

export const REGIONS: Region[] = [
  "North America",
  "Europe",
  "Asia",
  "Africa",
  "South America",
  "Oceania",
];

export type Role = "public" | "rep" | "admin";

export interface University {
  id: string;
  name: string;
  country: string;
  region: Region;
  city: string;
  lat: number;
  lng: number;
  website: string | null;
  type: "public" | "private" | "research_institute";
  studentCount: number | null;
  facultyCount: number | null;
  year: number | null;
  status: "pending" | "approved" | "suspended";
  representatives: string[];
  /** Null until the first validated assessment. */
  score: number | null;
  pillarScores: PillarScores | null;
  assessmentCount: number;
  logoUrl: string | null;
  lastAssessmentAt: Timestamp | null;
  joinedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AssessmentResponse {
  questionId: string;
  pillar: PillarKey;
  answer: number;
  maxScore: number;
  evidenceUrl?: string;
  notes?: string;
}

export interface Assessment {
  id: string;
  universityId: string;
  userId: string;
  version: number;
  previousAssessmentId?: string | null;
  status: "draft" | "submitted" | "validated";
  pillarScores: PillarScores;
  overallScore: number;
  responses: AssessmentResponse[];
  submittedAt: Timestamp | null;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
  universityId?: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
}

export interface Question {
  id: string;
  pillar: PillarKey;
  text: string;
  description: string;
  maxScore: number;
  weight: number;
  order: number;
  evidenceRequired: boolean;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  /** HTML produced by the TipTap editor. */
  content: string;
  excerpt: string;
  authorId: string;
  imageUrl: string | null;
  tags: string[];
  status: "draft" | "published";
  publishedAt: Timestamp | null;
  createdAt: Timestamp;
}

export interface Stats {
  totalUniversities: number;
  totalAssessments: number;
  avgScore: number | null;
  topUniversities: { rank: number; id: string; name: string; country: string; score: number; pillarScores: PillarScores | null }[];
  regionAvgs: Record<string, { count: number; avgScore: number | null }>;
  updatedAt: Timestamp;
}

export interface RankingEntry {
  rank: number;
  id: string;
  name: string;
  country: string;
  score: number;
  pillarScores: PillarScores | null;
}

export interface RegionRanking {
  region: string;
  list: RankingEntry[];
  updatedAt: Timestamp;
}

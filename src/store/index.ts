'use client';
import { create } from "zustand";

interface AssessmentDraft {
  responses: Record<string, { answer: number; notes?: string; evidenceUrl?: string }>;
  currentStep: number;
  setResponse: (questionId: string, value: { answer: number; notes?: string; evidenceUrl?: string }) => void;
  setStep: (step: number) => void;
  reset: () => void;
}

export const useAssessmentStore = create<AssessmentDraft>((set) => ({
  responses: {},
  currentStep: 0,
  setResponse: (questionId, value) =>
    set((s) => ({ responses: { ...s.responses, [questionId]: value } })),
  setStep: (step) => set({ currentStep: step }),
  reset: () => set({ responses: {}, currentStep: 0 }),
}));

interface FilterState {
  search: string;
  region: string;
  type: string;
  minScore: number;
  set: (patch: Partial<FilterState>) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  search: "",
  region: "all",
  type: "all",
  minScore: 0,
  set: (patch) => set(patch),
}));

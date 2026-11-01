export type SdgKey = "health" | "work" | "consumption";

export interface SdgMetric {
  key: SdgKey;
  goal: string;
  shortGoal: string;
  label: string;
  value: string;
  detail: string;
  progress: number;
  accent: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  impact: number;
  time: string;
  detail: string;
  accent: string;
  completed: boolean;
}

export interface Integration {
  id: string;
  provider: string;
  label: string;
  status: "connected" | "available";
  tone: string;
}

export interface BareMinimumProfile {
  id: string;
  name: string;
  initials: string;
  role: string;
  bio: string;
  focusArea: string;
  tier: "Free" | "Pro" | "Enterprise";
  alignmentScore: number;
  screenReaderEnabled: boolean;
  integrations: Integration[];
}

export interface DashboardSnapshot {
  profile: BareMinimumProfile;
  metrics: SdgMetric[];
  activities: ActivityItem[];
  summary: {
    impactScore: number;
    impactDelta: string;
    streak: number;
    deepWork: string;
    deepWorkDelta: string;
    carbonSaved: string;
    carbonDelta: string;
  };
}

export const dashboardSnapshot: DashboardSnapshot = {
  profile: {
    id: "profile-alex-01",
    name: "Alex Morgan",
    initials: "AM",
    role: "Product designer",
    bio: "Designing calmer systems for teams that care about people and the planet.",
    focusArea: "Cognitive ergonomics",
    tier: "Pro",
    alignmentScore: 88,
    screenReaderEnabled: true,
    integrations: [
      { id: "calendar", provider: "GC", label: "Google Calendar", status: "connected", tone: "violet" },
      { id: "github", provider: "GH", label: "GitHub", status: "connected", tone: "ink" },
      { id: "oura", provider: "O", label: "Oura Ring", status: "available", tone: "gold" },
    ],
  },
  metrics: [
    {
      key: "health",
      goal: "Goal 3",
      shortGoal: "Health",
      label: "Well-being",
      value: "7h 42m",
      detail: "sleep average",
      progress: 78,
      accent: "mint",
    },
    {
      key: "work",
      goal: "Goal 8",
      shortGoal: "Work",
      label: "Decent work",
      value: "4h 16m",
      detail: "deep focus today",
      progress: 64,
      accent: "blue",
    },
    {
      key: "consumption",
      goal: "Goal 12",
      shortGoal: "Consume",
      label: "Less waste",
      value: "2.8 kg",
      detail: "carbon avoided",
      progress: 52,
      accent: "gold",
    },
  ],
  activities: [
    {
      id: "activity-1",
      title: "Took a 5 min reset",
      category: "health",
      categoryLabel: "Goal 3 · Well-being",
      impact: 12,
      time: "8 min ago",
      detail: "Neck + eye mobility after your focus block.",
      accent: "mint",
      completed: true,
    },
    {
      id: "activity-2",
      title: "Protected a focus block",
      category: "work",
      categoryLabel: "Goal 8 · Decent work",
      impact: 18,
      time: "42 min ago",
      detail: "A quiet 90-minute block without notification noise.",
      accent: "blue",
      completed: true,
    },
    {
      id: "activity-3",
      title: "Chose a digital receipt",
      category: "consumption",
      categoryLabel: "Goal 12 · Less waste",
      impact: 8,
      time: "2 hrs ago",
      detail: "One small choice that keeps paper out of the loop.",
      accent: "gold",
      completed: true,
    },
    {
      id: "activity-4",
      title: "Clear 10 items from your desktop",
      category: "consumption",
      categoryLabel: "Goal 12 · Digital clutter",
      impact: 6,
      time: "Suggested",
      detail: "A two-minute reset for calmer, lighter work.",
      accent: "gold",
      completed: false,
    },
  ],
  summary: {
    impactScore: 82,
    impactDelta: "+12%",
    streak: 6,
    deepWork: "4h 16m",
    deepWorkDelta: "+36m",
    carbonSaved: "2.8 kg",
    carbonDelta: "+0.6 kg",
  },
};

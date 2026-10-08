/**
 * Admin Panel & Broadcast Management Types.
 */

export type BroadcastTarget = "survey_respondents" | "willing" | "all_users";

export type BroadcastChannel = "email" | "push";

export interface BroadcastPayload {
  subject: string;
  paragraphs: string[];
  target?: BroadcastTarget;
  channels?: BroadcastChannel[];
  ctaText?: string;
  ctaUrl?: string;
}

export interface BroadcastApiResponse {
  ok: boolean;
  recipientsTargeted: number;
  totalTargeted?: number;
  emailsSent: number;
  pushSent: number;
  inAppNotificationsInserted?: number;
  emailError?: string | null;
  timestamp?: string;
  error?: string;
}

export interface SurveyAnalyticsSummary {
  totalCount: number;
  averageRating: number;
  willingnessBreakdown: Record<string, number>;
  pricingTierBreakdown: Record<string, number>;
}

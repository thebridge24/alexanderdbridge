/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Centralized verification tier and badge configuration.
 * Three verification tiers with distinct badge colors:
 * - Supporter: Blue (#3b82f6 / text-blue-500)
 * - Sponsor: Purple (#8b5cf6 / text-purple-500)
 * - Patron: Metallic Gold (#f59e0b / text-amber-400)
 */

export type VerificationTier = "supporter" | "sponsor" | "partner" | "patron";

export interface VerificationTierInfo {
  tier: VerificationTier;
  label: string;
  hexColor: string;
  gradientClass?: string;
  textColorClass: string;
  badgeBgClass: string;
  iconColorClass: string;
  description: string;
}

export const VERIFICATION_TIERS: Record<
  VerificationTier,
  VerificationTierInfo
> = {
  supporter: {
    tier: "supporter",
    label: "Supporter",
    hexColor: "#3b82f6",
    textColorClass: "text-blue-500",
    iconColorClass: "text-blue-400",
    badgeBgClass: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    description: "Helps us improve and reach more believers.",
  },
  sponsor: {
    tier: "sponsor",
    label: "Sponsor",
    hexColor: "#8b5cf6",
    textColorClass: "text-purple-500",
    iconColorClass: "text-purple-400",
    badgeBgClass: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    description: "Keeps Bridge Daily accessible to the world.",
  },
  partner: {
 tier: "partner",
    label: "Partner",
    hexColor: "#dc2626",
    textColorClass: "text-red-600",
    iconColorClass: "text-red-500",
    badgeBgClass: "bg-red-600/10 text-red-400 border-red-600/30",
    description: "Help us reach more lives through God's Word.",
  },
  patron: {
    tier: "patron",
    label: "Patron",
    hexColor: "#f59e0b", // Rich warm gold
    textColorClass: "text-amber-400 font-bold",
    iconColorClass: "text-amber-400 fill-amber-400", // Guarantees full visibility for SVG icons
    badgeBgClass:
      "bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.35)]",
    description: "Builds the future of Bridge Daily.",
  },
};

// 1. Dedicated Patron Tier Lists (Alexander D Bridge & Christ)
const PATRON_EMAILS = [
  "alexanderdbridge@gmail.com",
  "alexanderchrist203@gmail.com",
  "imatessy49@gmail.com",
];

const PATRON_NAMES = [
  "alexander d bridge",
  "alexander d. bridge",
  "alexander christ",
  "tessy ima",
];

// 2. Supporter Tier Lists (All other verified members)
const SUPPORTER_EMAILS = [
  "binahcharlesagidigbi@gmail.com",
  "johnedheke@gmail.com",
  "madukuedith@gmail.com",
];

const SUPPORTER_NAMES = [
  "edith maduku",
  "john edheke",
  "binah charles-agidigbi",
];

// Sponsor Tier Lists
const SPONSOR_EMAILS = ["giftangelwite@gmail.com"];

const SPONSOR_NAMES = ["gift angelwite"];

/**
 * Determines whether a user is verified and returns their tier.
 */
export function getUserVerificationTier(params?: {
  metadata?: Record<string, any> | null;
  email?: string | null;
  name?: string | null;
}): VerificationTier | null {
  if (!params) return null;

  // 1. Check user metadata for explicit tier
  if (params.metadata?.verification_tier) {
    const tier =
      params.metadata.verification_tier.toLowerCase() as VerificationTier;
    if (tier in VERIFICATION_TIERS) return tier;
  }

  // If user metadata explicitly has support_plan
  if (params.metadata?.support_plan) {
    const plan = params.metadata.support_plan.toLowerCase() as VerificationTier;
    if (plan in VERIFICATION_TIERS) return plan;
  }

  // Clean email and name inputs for matching
  const cleanEmail = params.email ? params.email.trim().toLowerCase() : "";
  const cleanName = params.name ? params.name.trim().toLowerCase() : "";

  // 2. Email verification takes absolute precedence (prevents duplicate name spoofing)
  if (cleanEmail) {
    if (PATRON_EMAILS.includes(cleanEmail)) return "patron";
    if (SPONSOR_EMAILS.includes(cleanEmail)) return "sponsor";
    if (SUPPORTER_EMAILS.includes(cleanEmail)) return "supporter";
    return null;
  }

  // 3. Fallback name verification (only when email is not available)
  if (cleanName) {
    if (PATRON_NAMES.includes(cleanName)) return "patron";
    if (SPONSOR_NAMES.includes(cleanName)) return "sponsor";
    if (SUPPORTER_NAMES.includes(cleanName)) return "supporter";
  }
  return null;
}

export function isUserVerified(params?: {
  metadata?: Record<string, any> | null;
  email?: string | null;
  name?: string | null;
}): boolean {
  return getUserVerificationTier(params) !== null;
}

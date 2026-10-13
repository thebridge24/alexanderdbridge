/**
 * Centralized verification tier and badge configuration.
 * Three verification tiers with distinct badge colors:
 * - Supporter: Blue (#3b82f6 / text-blue-500)
 * - Sponsor: Purple (#8b5cf6 / text-purple-500)
 * - Patron: Gold/Yellow (#d4a017 / text-yellow-600)
 */

export type VerificationTier = "supporter" | "sponsor" | "patron";

export interface VerificationTierInfo {
  tier: VerificationTier;
  label: string;
  hexColor: string;
  textColorClass: string;
  badgeBgClass: string;
  description: string;
}

export const VERIFICATION_TIERS: Record<VerificationTier, VerificationTierInfo> = {
  supporter: {
    tier: "supporter",
    label: "Supporter",
    hexColor: "#3b82f6",
    textColorClass: "text-blue-500",
    badgeBgClass: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    description: "Helps us improve and reach more believers.",
  },
  sponsor: {
    tier: "sponsor",
    label: "Sponsor",
    hexColor: "#8b5cf6",
    textColorClass: "text-purple-500",
    badgeBgClass: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    description: "Keeps Bridge Daily accessible to the world.",
  },
  patron: {
    tier: "patron",
    label: "Patron",
    hexColor: "#d4a017",
    textColorClass: "text-yellow-600 dark:text-yellow-500",
    badgeBgClass: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    description: "Builds the future of Bridge Daily.",
  },
};

// 1. Dedicated Patron Tier Lists (Alexander D Bridge & Christ)
const PATRON_EMAILS = [
  "alexanderdbridge@gmail.com",
  "alexanderchrist203@gmail.com",
];

const PATRON_NAMES = [
  "alexander d bridge",
  "alexander d. bridge",
  "alexander christ",
  "christ",
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
    const tier = params.metadata.verification_tier.toLowerCase() as VerificationTier;
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

  // 2. Check for PATRON match (Alexander D Bridge & Christ)
  if (
    (cleanEmail && PATRON_EMAILS.includes(cleanEmail)) ||
    (cleanName && PATRON_NAMES.includes(cleanName))
  ) {
    return "patron";
  }

  // 3. Check for SUPPORTER match (Rest of the team)
  if (
    (cleanEmail && SUPPORTER_EMAILS.includes(cleanEmail)) ||
    (cleanName && SUPPORTER_NAMES.includes(cleanName))
  ) {
    return "supporter";
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

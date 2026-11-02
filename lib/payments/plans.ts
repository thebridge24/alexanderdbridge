// Plain (non-client) module so API routes can import the plan prices. Importing these from a
// "use client" component gives server code an empty reference and breaks with
// "Cannot read properties of undefined (reading 'monthlyAmount')".

export type PlanType =
  | "reader"
  | "supporter"
  | "sponsor"
  | "patron"
  | "partner"
  | "visionary";
export type BillingCycle = "monthly" | "yearly";

export interface SupportPlanConfig {
  id: PlanType;
  badge: string;
  badgeColor: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyAmount: number;
  yearlyAmount: number;
  heading: string;
  description: string;
  buttonText: string;
  heroBgClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
  verifiedIconColor: string;
  imagePlaceholderPath: string;
  showVerifiedIcon: boolean;
}

export const PLAN_CONFIGS: Record<PlanType, SupportPlanConfig> = {
  reader: {
    id: "reader",
    badge: "READER",
    badgeColor: "#ef4444",
    monthlyPrice: "₦500 / month",
    yearlyPrice: "₦5,500 / year",
    monthlyAmount: 500,
    yearlyAmount: 5500,
    heading: "Stay Connected",
    description: "Support Bridge Daily as you grow in God's Word.",
    buttonText: "Become a Reader",
    heroBgClass: "bg-primary",
    badgeBgClass: "bg-red-100 text-red-600 border-red-200",
    badgeTextClass: "text-red-600",
    verifiedIconColor: "",
    imagePlaceholderPath:
      "https://res.cloudinary.com/glqzvvh2/image/upload/v1791524487/Photoroom-20261009_063821_hgo5tu.png",
    showVerifiedIcon: false,
  },

  supporter: {
    id: "supporter",
    badge: "SUPPORTER",
    badgeColor: "#3b82f6",
    monthlyPrice: "₦1,000 / month",
    yearlyPrice: "₦11,000 / year",
    monthlyAmount: 1000,
    yearlyAmount: 11000,
    heading: "Help Us Grow",
    description: "Help us improve and reach more people.",
    buttonText: "Become a Supporter",
    heroBgClass: "bg-blue-500",
    badgeBgClass: "bg-blue-100 text-blue-600 border-blue-200",
    badgeTextClass: "text-blue-600",
    verifiedIconColor: "text-blue-500",
    imagePlaceholderPath:
      "https://res.cloudinary.com/glqzvvh2/image/upload/v1791524486/Photoroom-20261009_063840_ibrlnw.png",

    showVerifiedIcon: true,
  },

  sponsor: {
    id: "sponsor",
    badge: "SPONSOR",
    badgeColor: "#8b5cf6",
    monthlyPrice: "₦1,500 / month",
    yearlyPrice: "₦16,500 / year",
    monthlyAmount: 1500,
    yearlyAmount: 16500,
    heading: "Keep the Word Available",
    description: "Help keep Bridge Daily running and accessible.",
    buttonText: "Become a Sponsor",
    heroBgClass: "bg-purple-600",
    badgeBgClass: "bg-purple-100 text-purple-600 border-purple-200",
    badgeTextClass: "text-purple-600",
    verifiedIconColor: "text-purple-500",
    imagePlaceholderPath:
      "https://res.cloudinary.com/glqzvvh2/image/upload/v1791524487/Photoroom-20261009_063427_okept4.png",
    showVerifiedIcon: true,
  },
  partner: {
    id: "partner",
    badge: "Partner",
    badgeColor: "#dc2626",
    monthlyPrice: "₦2,500 / month",
    yearlyPrice: "₦27,500 / year",
    monthlyAmount: 2500,
    yearlyAmount: 27500,
    heading: "Build This Together",
    description: "Help us reach more lives through God's Word.",
    buttonText: "Become a Partner",
    heroBgClass: "bg-red-600",
    badgeBgClass: "bg-red-100 text-red-700 border-red-200",
    badgeTextClass: "text-red-700",
    verifiedIconColor: "text-red-600",
    showVerifiedIcon: true,
    imagePlaceholderPath:
      "/partnership.png"
  },
  patron: {
    id: "patron",
    badge: "PATRON",
    badgeColor: "#d4a017",
    monthlyPrice: "₦5,000 / month",
    yearlyPrice: "₦55,000 / year",
    monthlyAmount: 5000,
    yearlyAmount: 55000,
    heading: "Take Us Further",
    description: "Help us build the future of Bridge Daily.",
    buttonText: "Become a Patron",
    heroBgClass: "bg-yellow-600",
    badgeBgClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
    badgeTextClass: "text-yellow-700",
    verifiedIconColor: "text-yellow-600",
    imagePlaceholderPath:
      "https://res.cloudinary.com/glqzvvh2/image/upload/v1791524488/Photoroom-20261009_063401_vghz3k.png",
    showVerifiedIcon: true,
  },
  visionary: {
    id: "visionary",
    badge: "VISIONARY",
    badgeColor: "#10b981",
    monthlyPrice: "₦10,000 / month",
    yearlyPrice: "₦110,000 / year",
    monthlyAmount: 10000,
    yearlyAmount: 110000,
    heading: "Shape the Future",
    description:
      "Help us bring the Bridge Daily mobile app and offline reading experience to life.",
    buttonText: "Become a Visionary",
    heroBgClass: "bg-emerald-600",
    badgeBgClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    badgeTextClass: "text-emerald-700",
    verifiedIconColor: "text-emerald-500",
    // No illustration yet; the card hides the image when this is empty
    imagePlaceholderPath: "",
    showVerifiedIcon: true,
  },
};

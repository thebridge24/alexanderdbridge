import { SurveyConfig } from "@/types/survey";

export const devotionalSurveyConfig: SurveyConfig = {
  id: "devotional-feedback-2026",
  title: "Devotional Feedback Survey",
  intro: {
    heading: "Help us understand what this has become for you. ❤️",
    subheading: "A note from Alexander",
    description: [
      "We're approaching 200+ people on the devotional platform, and before we enter this next phase, I want to hear from you.",
      "This isn't just about features. I want to know whether these devotionals are actually helping you, what you love, what needs to improve, and what you would like us to build next.",
      "It will take about 2 minutes. Your honest answers will help shape the next chapter of the platform."
    ],
    buttonText: "Let's begin"
  },
  completion: {
    title: "Thank you ❤️",
    message: "Your response has been received. Thank you for helping us shape the next chapter of the devotional platform."
  },
  questions: [
    {
      id: "rating_overall",
      type: "rating",
      title: "How would you rate your overall experience with Bridge Daily Devotional?",
      description: "1 = Poor, 5 = Life-changing",
      min: 1,
      max: 5,
      required: true
    },
    {
      id: "like_most",
      type: "text",
      title: "What do you like most about the devotional platform?",
      placeholder: "Share what stands out to you...",
      required: false
    },
    {
      id: "excites_most",
      type: "text",
      title: "What excites you most about being part of this platform?",
      placeholder: "Your thoughts...",
      required: false
    },
    {
      id: "helped_walk_with_god",
      type: "textarea",
      title: "Has the devotional helped you in your personal walk with God? If yes, how?",
      placeholder: "Tell us a bit about your journey...",
      required: false
    },
    {
      id: "impactful_moment",
      type: "textarea",
      title: "Can you remember a particular devotional, teaching, or moment on the platform that impacted you? Tell us about it.",
      placeholder: "Share your experience...",
      required: false
    },
    {
      id: "dislikes_or_difficulties",
      type: "textarea",
      title: "What do you currently dislike or find difficult about using the platform?",
      placeholder: "Be as honest as possible...",
      required: false
    },
    {
      id: "wish_feature",
      type: "text",
      title: "What is one thing you wish you could do on the platform right now?",
      placeholder: "I wish I could...",
      required: false
    },
    {
      id: "consistency_drivers",
      type: "multiple-choice",
      title: "What would make you want to use the platform more consistently?",
      description: "Select all that apply",
      options: [
        { label: "Better reminders", value: "reminders" },
        { label: "Audio devotionals", value: "audio" },
        { label: "More community interaction", value: "community" },
        { label: "Personal journal / reflections", value: "journal" },
        { label: "Prayer features", value: "prayer" },
        { label: "More engaging content", value: "content" },
        { label: "Better website performance", value: "performance" },
        { label: "Other", value: "other" }
      ],
      required: true
    },
    {
      id: "membership_willingness",
      type: "single-choice",
      title: "If the platform introduced a small monthly membership to help us maintain and grow it, would you be willing to support it?",
      options: [
        { label: "Yes, definitely", value: "yes_definitely" },
        { label: "Maybe, depending on the price", value: "maybe" },
        { label: "I'm not sure", value: "unsure" },
        { label: "No", value: "no" }
      ],
      required: true
    },
    {
      id: "monthly_amount",
      type: "single-choice",
      title: "What monthly amount would feel reasonable to you for continued access and new features?",
      options: [
        { label: "₦500", value: "500" },
        { label: "₦800", value: "800" },
        { label: "₦1,000", value: "1000" },
        { label: "₦1,500", value: "1500" },
        { label: "₦2,000", value: "2000" },
        { label: "More than ₦2,000", value: "above_2000" },
        { label: "I would prefer to keep it free", value: "keep_free" }
      ],
      required: true
    }
  ]
};

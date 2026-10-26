export interface UserProfileSettings {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bannerUrl?: string;
  birthday?: string;
  location?: string;
  bio?: string;
  verificationTier?: string | null;
}

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export interface SettingsSection {
  title: string;
  items: SettingsNavItem[];
}
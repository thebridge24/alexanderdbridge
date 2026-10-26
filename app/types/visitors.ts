export interface Visitor {
  id: string;
  user_id?: string;
  display_name: string;
  avatar_url: string;
  banner_url?: string;
  email?: string;
  bio?: string;
  visited_at: string;
  verification_tier?: string | null;
  streakCount?: number;
  bestStreak?: number;
  currentMilestoneName?: string;
  mutual_friends?: {
    id: string;
    name: string;
    avatarUrl: string;
  }[];
  isFollowing?: boolean;
}
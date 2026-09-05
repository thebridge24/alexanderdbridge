export type DevotionalComment = {
  id: string;
  devotional_date: string;
  author_name: string;
  body: string;
  created_at: string;
};

export type DevotionalStats = {
  viewCount: number;
  likeCount: number;
  liked: boolean;
};

export type DevotionalLikeResult = {
  like_count: number;
  liked: boolean;
};

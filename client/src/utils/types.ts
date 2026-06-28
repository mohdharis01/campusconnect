export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar: string;
  coverImage?: string;
  bio?: string;
  college?: string;
  degree?: string;
  semester?: number;
  branch?: string;
  skills?: string[];
  interests?: string[];
  github?: string;
  linkedin?: string;
  website?: string;
  xp: number;
  level: number;
  streak: number;
  coins?: number;
  badges?: Badge[];
  notesCount: number;
  blogsCount: number;
  followersCount: number;
  followingCount: number;
  isEmailVerified: boolean;
  isProfilePublic: boolean;
  theme?: string;
  accentColor?: string;
  isFollowing?: boolean;
  lastSeen?: string;
  createdAt: string;
}

export interface Note {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  semester?: number;
  branch?: string;
  tags: string[];
  author: User;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  likesCount: number;
  commentsCount: number;
  downloadsCount: number;
  bookmarksCount: number;
  viewsCount: number;
  rating: number;
  verificationStatus: 'community' | 'teacher_verified' | 'admin_verified';
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: string;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author: User;
  tags: string[];
  category: string;
  status: 'draft' | 'published' | 'archived';
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  viewsCount: number;
  readTime: number;
  verificationStatus: 'community' | 'teacher_verified' | 'admin_verified';
  isLiked?: boolean;
  isBookmarked?: boolean;
  publishedAt?: string;
  createdAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: User;
  targetType: string;
  targetId: string;
  parentComment?: string;
  replies?: Comment[];
  likesCount: number;
  isEdited: boolean;
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender?: User;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Roadmap {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  coverImage?: string;
  levels: RoadmapLevel[];
  author: User;
  enrolledCount: number;
  isOfficial: boolean;
  estimatedWeeks: number;
  userProgress?: Progress;
}

export interface RoadmapLevel {
  _id: string;
  title: string;
  description?: string;
  topics: Topic[];
  order: number;
  xpReward: number;
}

export interface Topic {
  _id: string;
  title: string;
  description?: string;
  resources: Resource[];
  difficulty: string;
  estimatedHours: number;
}

export interface Resource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'practice' | 'docs';
}

export interface Progress {
  _id: string;
  user: string;
  roadmap: string;
  completedTopics: string[];
  completedLevels: string[];
  progressPercent: number;
  studyHours: number;
  startedAt: string;
  completedAt?: string;
}

export interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: User;
  category: string;
  tags: string[];
  upvoteCount: number;
  commentsCount: number;
  viewsCount: number;
  isSolved: boolean;
  createdAt: string;
}

export interface Message {
  _id: string;
  sender: User;
  receiver: string;
  content?: string;
  fileUrl?: string;
  fileType?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Badge {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface LeaderboardUser extends User {
  rank?: number;
}

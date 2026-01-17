export interface RoastRequest {
  username: string;
  intensity: 'mild' | 'medium' | 'spicy';
  includeReadme?: boolean;
  maxRepos?: number;
}

export interface GitHubProfile {
  login: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  bio?: string | null;
  location?: string | null;
  company?: string | null;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  description: string | null;
  default_branch: string;
  readme_content?: string | null;
}

export interface GitHubSignals {
  profile: {
    public_repos: number;
    followers: number;
    created_at: string;
    bio?: string | null;
    location?: string | null;
    company?: string | null;
  };
  top_repos: Array<{
    name: string;
    language: string | null;
    stars: number;
    forks: number;
    updated_at: string;
    description?: string | null;
    readme_snippet?: string | null;
  }>;
}

export interface RoastResult {
  roast: string;
  advice: string[];
  profile: {
    archetype: string;
    strengths: string[];
    blind_spots: string[];
  };
}

export interface RoastResponse {
  request_id: string;
  username: string;
  signals: GitHubSignals;
  result: RoastResult;
}

export interface ErrorResponse {
  error: {
    code: 'BAD_REQUEST' | 'GITHUB_ERROR' | 'OPENAI_ERROR' | 'RATE_LIMIT' | 'INTERNAL_ERROR';
    message: string;
  };
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  modelId?: string;
}

export interface CompareRequest {
  username1: string;
  username2: string;
  language?: string; // ISO language code (e.g., 'en', 'es', 'fr')
}

export interface CompareResponse {
  request_id: string;
  user1: {
    username: string;
    signals: GitHubSignals;
    roast: RoastResult;
  };
  user2: {
    username: string;
    signals: GitHubSignals;
    roast: RoastResult;
  };
  verdict: {
    winner: 'user1' | 'user2' | 'tie';
    reasoning: string;
    score_user1: number;
    score_user2: number;
  };
}

export interface TranslateRequest {
  text: string;
  targetLanguage: string; // ISO language code
}

export interface TranslateResponse {
  translated_text: string;
  source_language: string;
  target_language: string;
}

export interface LeaderboardEntry {
  username: string;
  wins: number;
  losses: number;
  win_rate: number;
  total_matches: number;
  last_match: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total_entries: number;
}

export interface UserSession {
  githubId: string;
  username: string;
  accessToken: string;
  avatarUrl?: string;
}

export interface PVPMatch {
  matchId: string;
  player1: {
    username: string;
    githubId: string;
    ready: boolean;
  } | null;
  player2: {
    username: string;
    githubId: string;
    ready: boolean;
  } | null;
  status: 'waiting' | 'ready' | 'in_progress' | 'completed';
  result: CompareResponse | null;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CreateMatchRequest {
  username: string;
}

export interface JoinMatchRequest {
  matchId: string;
  username: string;
}

export interface MatchResponse {
  match: PVPMatch;
}

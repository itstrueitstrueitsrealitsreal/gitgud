export interface CompareResult {
  request_id: string;
  user1: {
    username: string;
    signals: {
      profile: {
        public_repos: number;
        followers: number;
        created_at: string;
      };
      top_repos: Array<{
        name: string;
        language: string | null;
        stars: number;
        forks: number;
      }>;
    };
    roast: {
      roast: string;
      advice: string[];
      profile: {
        archetype: string;
        strengths: string[];
        blind_spots: string[];
      };
    };
  };
  user2: {
    username: string;
    signals: {
      profile: {
        public_repos: number;
        followers: number;
        created_at: string;
      };
      top_repos: Array<{
        name: string;
        language: string | null;
        stars: number;
        forks: number;
      }>;
    };
    roast: {
      roast: string;
      advice: string[];
      profile: {
        archetype: string;
        strengths: string[];
        blind_spots: string[];
      };
    };
  };
  verdict: {
    winner: 'user1' | 'user2' | 'tie';
    reasoning: string;
    score_user1: number;
    score_user2: number;
  };
}

export interface User {
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
  result: CompareResult | null;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

import { PVPMatch, CompareResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class PVPService {
  private matches: Map<string, PVPMatch>;
  private userMatches: Map<string, string>; // userId -> matchId

  constructor() {
    this.matches = new Map();
    this.userMatches = new Map();
  }

  createMatch(player1Username: string, player1GithubId: string): PVPMatch {
    const matchId = uuidv4();
    const match: PVPMatch = {
      matchId,
      player1: {
        username: player1Username,
        githubId: player1GithubId,
        ready: false,
      },
      player2: null,
      status: 'waiting',
      result: null,
      createdAt: new Date().toISOString(),
    };

    this.matches.set(matchId, match);
    this.userMatches.set(player1GithubId, matchId);

    return match;
  }

  joinMatch(matchId: string, player2Username: string, player2GithubId: string): PVPMatch | null {
    const match = this.matches.get(matchId);
    if (!match) {
      return null;
    }

    if (match.player1?.githubId === player2GithubId) {
      throw new Error('Cannot join your own match');
    }

    if (match.player2) {
      throw new Error('Match is already full');
    }

    match.player2 = {
      username: player2Username,
      githubId: player2GithubId,
      ready: false,
    };

    match.status = 'ready';
    this.userMatches.set(player2GithubId, matchId);

    return match;
  }

  setReady(matchId: string, githubId: string): PVPMatch | null {
    const match = this.matches.get(matchId);
    if (!match) {
      return null;
    }

    if (match.player1?.githubId === githubId) {
      match.player1.ready = true;
    } else if (match.player2?.githubId === githubId) {
      match.player2.ready = true;
    } else {
      return null;
    }

    // Check if both players are ready
    if (match.player1?.ready && match.player2?.ready) {
      match.status = 'in_progress';
      match.startedAt = new Date().toISOString();
    }

    return match;
  }

  setMatchResult(matchId: string, result: CompareResponse): void {
    const match = this.matches.get(matchId);
    if (!match) {
      return;
    }

    match.result = result;
    match.status = 'completed';
    match.completedAt = new Date().toISOString();
  }

  getMatch(matchId: string): PVPMatch | undefined {
    return this.matches.get(matchId);
  }

  getUserMatch(githubId: string): PVPMatch | null {
    const matchId = this.userMatches.get(githubId);
    if (!matchId) {
      return null;
    }
    return this.matches.get(matchId) || null;
  }

  deleteMatch(matchId: string): void {
    const match = this.matches.get(matchId);
    if (match) {
      if (match.player1) {
        this.userMatches.delete(match.player1.githubId);
      }
      if (match.player2) {
        this.userMatches.delete(match.player2.githubId);
      }
      this.matches.delete(matchId);
    }
  }

  // Clean up old completed matches (older than 1 hour)
  cleanupOldMatches(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [matchId, match] of this.matches.entries()) {
      if (match.status === 'completed' && match.completedAt) {
        const completedTime = new Date(match.completedAt).getTime();
        if (completedTime < oneHourAgo) {
          this.deleteMatch(matchId);
        }
      }
    }
  }
}

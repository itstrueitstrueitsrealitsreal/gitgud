import { LeaderboardEntry } from '../types';

interface MatchRecord {
  username: string;
  wins: number;
  losses: number;
  last_match: string;
}

export class LeaderboardService {
  private records: Map<string, MatchRecord>;

  constructor() {
    this.records = new Map();
  }

  recordMatch(winner: string, loser: string): void {
    const now = new Date().toISOString();

    // Update winner
    const winnerRecord = this.records.get(winner) || { username: winner, wins: 0, losses: 0, last_match: now };
    winnerRecord.wins++;
    winnerRecord.last_match = now;
    this.records.set(winner, winnerRecord);

    // Update loser
    const loserRecord = this.records.get(loser) || { username: loser, wins: 0, losses: 0, last_match: now };
    loserRecord.losses++;
    loserRecord.last_match = now;
    this.records.set(loser, loserRecord);
  }

  getLeaderboard(limit: number = 50): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];

    for (const record of this.records.values()) {
      const totalMatches = record.wins + record.losses;
      const winRate = totalMatches > 0 ? (record.wins / totalMatches) * 100 : 0;

      entries.push({
        username: record.username,
        wins: record.wins,
        losses: record.losses,
        win_rate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
        total_matches: totalMatches,
        last_match: record.last_match,
      });
    }

    // Sort by win rate (descending), then by total wins (descending)
    entries.sort((a, b) => {
      if (b.win_rate !== a.win_rate) {
        return b.win_rate - a.win_rate;
      }
      return b.wins - a.wins;
    });

    return entries.slice(0, limit);
  }

  getUserStats(username: string): LeaderboardEntry | null {
    const record = this.records.get(username);
    if (!record) {
      return null;
    }

    const totalMatches = record.wins + record.losses;
    const winRate = totalMatches > 0 ? (record.wins / totalMatches) * 100 : 0;

    return {
      username: record.username,
      wins: record.wins,
      losses: record.losses,
      win_rate: Math.round(winRate * 100) / 100,
      total_matches: totalMatches,
      last_match: record.last_match,
    };
  }
}

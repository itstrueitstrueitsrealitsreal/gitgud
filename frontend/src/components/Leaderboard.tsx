import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Trophy, RefreshCw, Github, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  username: string;
  wins: number;
  losses: number;
  win_rate: number;
  total_matches: number;
  last_match: string;
}

interface LeaderboardProps {
  apiBase: string;
}

export default function Leaderboard({ apiBase }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <Card className="border-2 shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Leaderboard</CardTitle>
          </div>
          <Button
            onClick={fetchLeaderboard}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
        <CardDescription>Top developers ranked by win rate</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-center text-muted-foreground py-8">Loading leaderboard...</div>
        )}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
            <p className="font-medium">❌ {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div>
            {entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-lg">
                No battles yet! Be the first to compare developers.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Wins</TableHead>
                    <TableHead>Losses</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>Total Matches</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow
                      key={entry.username}
                      className={cn(
                        index === 0 && 'bg-yellow-50/50',
                        index === 1 && 'bg-gray-50/50',
                        index === 2 && 'bg-orange-50/50'
                      )}
                    >
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Medal className="h-4 w-4 text-yellow-500" />}
                          {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                          {index === 2 && <Medal className="h-4 w-4 text-orange-500" />}
                          #{index + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://github.com/${entry.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium flex items-center gap-2"
                        >
                          <Github className="h-4 w-4" />
                          {entry.username}
                        </a>
                      </TableCell>
                      <TableCell>{entry.wins}</TableCell>
                      <TableCell>{entry.losses}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-semibold">
                          {entry.win_rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.total_matches}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


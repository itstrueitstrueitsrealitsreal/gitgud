import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import Spinner from "./Spinner";
import Results from "./Results";
import { PVPMatch, User, CompareResult } from "../types";
import { Github, LogOut, Users, CheckCircle2, Clock, Play, X } from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : window.location.origin);

interface PVPModeProps {
  user: User | null;
  onLogout: () => void;
}

export default function PVPMode({ user, onLogout }: PVPModeProps) {
  const [match, setMatch] = useState<PVPMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchIdInput, setMatchIdInput] = useState("");
  const [pollingInterval, setPollingInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);

  // Fetch current user's match
  const fetchMyMatch = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE}/pvp/my-match`, {
        credentials: "include",
      });

      if (response.status === 404) {
        setMatch(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch match");
      }

      const data = await response.json();
      setMatch(data.match);
    } catch (err) {
      console.error("Failed to fetch match:", err);
    }
  }, [user]);

  // Poll for match updates
  useEffect(() => {
    if (match && match.status !== "completed") {
      const interval = setInterval(() => {
        if (match.matchId) {
          fetch(`${API_BASE}/pvp/match/${match.matchId}`, {
            credentials: "include",
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.match) {
                setMatch(data.match);
              }
            })
            .catch(console.error);
        }
      }, 2000); // Poll every 2 seconds

      setPollingInterval(interval);
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [match?.matchId, match?.status]);

  // Initial fetch
  useEffect(() => {
    fetchMyMatch();
  }, [fetchMyMatch]);

  const handleCreateMatch = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/pvp/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: user.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to create match");
      }

      const data = await response.json();
      setMatch(data.match);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create match");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMatch = async () => {
    if (!user || !matchIdInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/pvp/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          matchId: matchIdInput.trim(),
          username: user.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to join match");
      }

      const data = await response.json();
      setMatch(data.match);
      setMatchIdInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join match");
    } finally {
      setLoading(false);
    }
  };

  const handleSetReady = async () => {
    if (!match) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/pvp/ready/${match.matchId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to set ready");
      }

      const data = await response.json();
      setMatch(data.match);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set ready");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveMatch = async () => {
    if (!match) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/pvp/leave`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to leave match");
      }

      // Clear match state to show create/join options
      setMatch(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave match");
    } finally {
      setLoading(false);
    }
  };

  const isPlayer1 = match?.player1?.githubId === user?.githubId;
  const isPlayer2 = match?.player2?.githubId === user?.githubId;
  const isPlayer = isPlayer1 || isPlayer2;
  const currentPlayer = isPlayer1 ? match?.player1 : match?.player2;
  const opponent = isPlayer1 ? match?.player2 : match?.player1;
  const isReady = currentPlayer?.ready || false;

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Please log in to play PVP mode
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold">@{user.username}</p>
              <p className="text-sm text-muted-foreground">
                Logged in with GitHub
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive border-2">
          <CardContent className="p-4 bg-destructive/10">
            <p className="font-medium text-destructive">❌ {error}</p>
          </CardContent>
        </Card>
      )}

      {/* No Match - Create or Join */}
      {!match && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Create Match
              </CardTitle>
              <CardDescription>
                Start a new PVP battle and wait for an opponent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCreateMatch}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? <Spinner size="sm" /> : "Create Match"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Join Match
              </CardTitle>
              <CardDescription>
                Enter a match ID to join an existing battle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Match ID"
                value={matchIdInput}
                onChange={(e) => setMatchIdInput(e.target.value)}
                disabled={loading}
              />
              <Button
                onClick={handleJoinMatch}
                disabled={loading || !matchIdInput.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? <Spinner size="sm" /> : "Join Match"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Match Waiting */}
      {match && match.status === "waiting" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Waiting for Opponent
                </CardTitle>
                <CardDescription>
                  Share your match ID:{" "}
                  <code className="bg-muted px-2 py-1 rounded">
                    {match.matchId}
                  </code>
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeaveMatch}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Leave Match
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5" />
                  <span className="font-semibold">
                    @{match.player1?.username}
                  </span>
                </div>
                <Badge>Player 1</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border-2 border-dashed rounded-lg">
                <span className="text-muted-foreground flex items-center gap-1">
                  Waiting for Player 2
                  <span className="dots" aria-hidden="true"></span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Ready */}
      {match && match.status === "ready" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Match Ready
                </CardTitle>
                <CardDescription>
                  Both players joined. Click ready when you're prepared!
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeaveMatch}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Leave Match
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-lg border-2 ${isPlayer1 ? "border-primary bg-primary/5" : "bg-muted"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    <span className="font-semibold">
                      @{match.player1?.username}
                    </span>
                  </div>
                  {match.player1?.ready ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Ready</Badge>
                  )}
                </div>
                {isPlayer1 && !isReady && (
                  <Button
                    onClick={handleSetReady}
                    disabled={loading}
                    className="w-full mt-2"
                    size="sm"
                  >
                    {loading ? <Spinner size="sm" /> : "Mark Ready"}
                  </Button>
                )}
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${isPlayer2 ? "border-primary bg-primary/5" : "bg-muted"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    <span className="font-semibold">
                      @{match.player2?.username}
                    </span>
                  </div>
                  {match.player2?.ready ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Ready</Badge>
                  )}
                </div>
                {isPlayer2 && !isReady && (
                  <Button
                    onClick={handleSetReady}
                    disabled={loading}
                    className="w-full mt-2"
                    size="sm"
                  >
                    {loading ? <Spinner size="sm" /> : "Mark Ready"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match In Progress */}
      {match && match.status === "in_progress" && (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Spinner size="lg" />
              <p className="text-lg font-medium">Battle in Progress!</p>
              <p className="text-sm text-muted-foreground">
                AI is analyzing both developers...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Completed */}
      {match && match.status === "completed" && match.result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Battle Complete!</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeaveMatch}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Leave Match
                </Button>
              </div>
            </CardHeader>
          </Card>
          <Results result={match.result} />
        </div>
      )}
    </div>
  );
}

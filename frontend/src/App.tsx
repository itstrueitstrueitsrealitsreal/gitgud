import { useState, useEffect } from "react";
import ComparisonForm from "./components/ComparisonForm";
import Results from "./components/Results";
import Leaderboard from "./components/Leaderboard";
import PVPMode from "./components/PVPMode";
import Spinner from "./components/Spinner";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { CompareResult, User } from "./types";
import { Github, Users, LogOut } from "lucide-react";

// In development, use Vite proxy (/api) or direct connection
// In production, use the actual backend URL
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : window.location.origin);

type Mode = "offline" | "pvp";

function App() {
  const [mode, setMode] = useState<Mode>("offline");
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Check authentication on mount and when mode changes
  useEffect(() => {
    // Check for OAuth callback params
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get("auth");
    if (authStatus === "success") {
      setMode("pvp");
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Always check for user session (on mount and when mode changes)
    fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        setUser(null);
      });
  }, [mode]);

  const handleLogin = () => {
    window.location.href = `${API_BASE}/auth/github`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleCompare = async (
    username1: string,
    username2: string,
    language: string,
  ) => {
    setLoading(true);
    setError(null);
    setSelectedLanguage(language);

    try {
      const response = await fetch(`${API_BASE}/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username1,
          username2,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to compare users");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!results) return;

    setLoading(true);
    try {
      // Translate verdict reasoning
      const translateResponse = await fetch(`${API_BASE}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: results.verdict.reasoning,
          targetLanguage: selectedLanguage,
        }),
      });

      if (translateResponse.ok) {
        const translateData = await translateResponse.json();
        setResults({
          ...results,
          verdict: {
            ...results.verdict,
            reasoning: translateData.translated_text,
          },
        });
      }
    } catch (err) {
      console.error("Translation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="text-center text-white mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 drop-shadow-lg">
            ⚔️ GitGud
          </h1>
          <p className="text-xl md:text-2xl text-purple-100">
            GitHub Developer Battle Arena
          </p>
        </header>

        {/* Mode Switcher */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex gap-4 justify-center items-center">
              <Button
                variant={mode === "offline" ? "default" : "outline"}
                onClick={() => setMode("offline")}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Offline Mode
              </Button>
              <Button
                variant={mode === "pvp" ? "default" : "outline"}
                onClick={() => setMode("pvp")}
                className="flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                PVP Mode
              </Button>
              {user && (
                <div className="ml-auto flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                  {user.avatarUrl && (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="text-sm">
                    <p className="font-semibold">@{user.username}</p>
                    <p className="text-xs text-muted-foreground">Logged in</p>
                  </div>
                  {mode === "pvp" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="ml-2"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <main className="space-y-8">
          {mode === "offline" ? (
            <>
              <ComparisonForm
                onCompare={handleCompare}
                loading={loading}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
              />

              {error && (
                <Card className="border-destructive border-2">
                  <CardContent className="p-4 bg-destructive/10">
                    <p className="font-medium text-destructive">❌ {error}</p>
                  </CardContent>
                </Card>
              )}

              {loading && !results && (
                <Card className="border-2 shadow-xl">
                  <CardContent className="p-12">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Spinner size="lg" />
                      <p className="text-lg font-medium">
                        AI is analyzing the developers...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This may take 10-20 seconds
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {results && (
                <>
                  <Results result={results} />
                  <Button
                    onClick={handleTranslate}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    🌐 Translate Results to {selectedLanguage.toUpperCase()}
                  </Button>
                </>
              )}

              <Leaderboard apiBase={API_BASE} />
            </>
          ) : (
            <>
              {!user ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Github className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-2xl font-bold mb-2">
                      Login with GitHub
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Sign in with your GitHub account to play PVP mode
                    </p>
                    <Button
                      onClick={handleLogin}
                      size="lg"
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Github className="w-5 h-5" />
                      Login with GitHub
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <PVPMode user={user} onLogout={handleLogout} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

import { CompareResult } from '../types';
import { useTypewriter } from '../hooks/useTypewriter';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Github, Star, Users, FolderOpen } from 'lucide-react';

interface ResultsProps {
  result: CompareResult;
}

export default function Results({ result }: ResultsProps) {
  const { user1, user2, verdict } = result;
  const isUser1Winner = verdict.winner === 'user1';
  const isUser2Winner = verdict.winner === 'user2';
  const isTie = verdict.winner === 'tie';
  
  const [startTypewriter, setStartTypewriter] = useState(false);
  
  // Start typewriter effect after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => setStartTypewriter(true), 100);
    return () => clearTimeout(timer);
  }, [result]);

  const verdictTypewriter = useTypewriter({
    text: verdict.reasoning,
    speed: 20,
    enabled: startTypewriter,
  });

  const user1RoastTypewriter = useTypewriter({
    text: user1.roast.roast,
    speed: 15,
    enabled: startTypewriter,
  });

  const user2RoastTypewriter = useTypewriter({
    text: user2.roast.roast,
    speed: 15,
    enabled: startTypewriter,
  });

  return (
    <Card className="border-2 shadow-xl">
      <CardContent className="p-0">
        <div
          className={`text-center p-8 rounded-t-lg ${
            isTie
              ? 'bg-gradient-to-r from-pink-500 to-red-500'
              : isUser1Winner
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
              : 'bg-gradient-to-r from-green-500 to-emerald-500'
          } text-white`}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-8 w-8" />
            <h2 className="text-4xl font-bold">
              {isTie
                ? "It's a Tie!"
                : isUser1Winner
                ? `${user1.username} Wins!`
                : `${user2.username} Wins!`}
            </h2>
          </div>
          <p className="text-lg leading-relaxed mb-4 min-h-[4rem]">
            {verdictTypewriter.isTyping ? (
              <span>
                {verdictTypewriter.displayedText}
                <span className="animate-pulse">|</span>
              </span>
            ) : (
              verdictTypewriter.displayedText
            )}
          </p>
          <div className="flex justify-center gap-8 mt-6">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {user1.username}: <strong className="text-2xl ml-2">{verdict.score_user1}/100</strong>
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {user2.username}: <strong className="text-2xl ml-2">{verdict.score_user2}/100</strong>
            </Badge>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={`${isUser1Winner ? 'border-green-500 bg-green-50/50' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">
                    <a
                      href={`https://github.com/${user1.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <Github className="h-5 w-5" />
                      {user1.username}
                    </a>
                  </CardTitle>
                  <Badge className="text-lg px-4 py-2">
                    {verdict.score_user1}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <FolderOpen className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{user1.signals.profile.public_repos}</div>
                    <div className="text-xs text-muted-foreground">Repos</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{user1.signals.profile.followers}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Star className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">
                      {user1.signals.top_repos.reduce((sum, repo) => sum + repo.stars, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Stars</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">🔥 Roast</h4>
                  <p className="text-sm leading-relaxed min-h-[3rem] text-muted-foreground">
                    {user1RoastTypewriter.isTyping ? (
                      <span>
                        {user1RoastTypewriter.displayedText}
                        <span className="animate-pulse">|</span>
                      </span>
                    ) : (
                      user1RoastTypewriter.displayedText
                    )}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-semibold text-primary">🎭 Profile</h4>
                  <p className="text-sm">
                    <strong>Archetype:</strong> {user1.roast.profile.archetype}
                  </p>
                  <div>
                    <strong className="text-sm">Strengths:</strong>
                    <ul className="list-none mt-2 space-y-1">
                      {user1.roast.profile.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${isUser2Winner ? 'border-green-500 bg-green-50/50' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">
                    <a
                      href={`https://github.com/${user2.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <Github className="h-5 w-5" />
                      {user2.username}
                    </a>
                  </CardTitle>
                  <Badge className="text-lg px-4 py-2">
                    {verdict.score_user2}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <FolderOpen className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{user2.signals.profile.public_repos}</div>
                    <div className="text-xs text-muted-foreground">Repos</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{user2.signals.profile.followers}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Star className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">
                      {user2.signals.top_repos.reduce((sum, repo) => sum + repo.stars, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Stars</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">🔥 Roast</h4>
                  <p className="text-sm leading-relaxed min-h-[3rem] text-muted-foreground">
                    {user2RoastTypewriter.isTyping ? (
                      <span>
                        {user2RoastTypewriter.displayedText}
                        <span className="animate-pulse">|</span>
                      </span>
                    ) : (
                      user2RoastTypewriter.displayedText
                    )}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-semibold text-primary">🎭 Profile</h4>
                  <p className="text-sm">
                    <strong>Archetype:</strong> {user2.roast.profile.archetype}
                  </p>
                  <div>
                    <strong className="text-sm">Strengths:</strong>
                    <ul className="list-none mt-2 space-y-1">
                      {user2.roast.profile.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

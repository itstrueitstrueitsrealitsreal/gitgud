import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Button } from './ui/button';
import { Swords } from 'lucide-react';

interface ComparisonFormProps {
  onCompare: (username1: string, username2: string, language: string) => void;
  loading: boolean;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export default function ComparisonForm({
  onCompare,
  loading,
  selectedLanguage,
  onLanguageChange,
}: ComparisonFormProps) {
  const [username1, setUsername1] = useState('');
  const [username2, setUsername2] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username1.trim() && username2.trim() && username1 !== username2) {
      onCompare(username1.trim(), username2.trim(), selectedLanguage);
    }
  };

  return (
    <Card className="border-2 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Start a Battle</CardTitle>
        <CardDescription>Compare two GitHub developers and see who comes out on top</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label htmlFor="username1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                👤 Developer 1
              </label>
              <Input
                id="username1"
                value={username1}
                onChange={(e) => setUsername1(e.target.value)}
                placeholder="github_username"
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-xl">
                VS
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="username2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                👤 Developer 2
              </label>
              <Input
                id="username2"
                value={username2}
                onChange={(e) => setUsername2(e.target.value)}
                placeholder="github_username"
                required
                disabled={loading}
                className="h-11"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <label htmlFor="language" className="text-sm font-medium">
              🌐 Language:
            </label>
            <Select
              id="language"
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              disabled={loading}
              className="w-40"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
              <option value="ru">Russian</option>
            </Select>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full text-lg h-12"
            disabled={loading || !username1 || !username2 || username1 === username2}
          >
            <Swords className="mr-2 h-5 w-5" />
            {loading ? 'Analyzing...' : 'Battle!'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

import { GitHubProfile, GitHubRepo, GitHubSignals } from '../types';
import { fetch } from 'undici';

const GITHUB_API_BASE = 'https://api.github.com';

export class GitHubService {
  private token: string | undefined;

  constructor(token?: string) {
    this.token = token;
  }

  private async fetchGitHub<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitGud-Backend/1.0',
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    try {
      const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, { headers });

      if (!response.ok) {
        if (response.status === 401) {
          // If we have a token but got 401, it's invalid - try without token
          if (this.token) {
            // Retry without token (unauthenticated requests have lower rate limits but work)
            const retryHeaders: Record<string, string> = {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'GitGud-Backend/1.0',
            };
            const retryResponse = await fetch(`${GITHUB_API_BASE}${endpoint}`, { headers: retryHeaders });
            if (retryResponse.ok) {
              return retryResponse.json() as Promise<T>;
            }
            throw new Error('GitHub API authentication failed. Please check your GITHUB_TOKEN or remove it to use unauthenticated requests (with rate limits).');
          }
          throw new Error('GitHub API authentication failed');
        }
        if (response.status === 404) {
          throw new Error('GitHub user not found');
        }
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Consider setting a valid GITHUB_TOKEN for higher rate limits.');
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      // Provide more detailed error information
      if (error instanceof Error) {
        // Check if it's a network error
        if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
          throw new Error(`Network error connecting to GitHub API: ${error.message}. Please check your internet connection.`);
        }
        throw error;
      }
      throw new Error(`Unknown error fetching from GitHub API: ${String(error)}`);
    }
  }

  async getUserProfile(username: string): Promise<GitHubProfile> {
    return this.fetchGitHub<GitHubProfile>(`/users/${username}`);
  }

  async getUserRepos(username: string, perPage: number = 100): Promise<GitHubRepo[]> {
    return this.fetchGitHub<GitHubRepo[]>(
      `/users/${username}/repos?per_page=${perPage}&sort=updated&direction=desc`
    );
  }

  async getRepoReadme(owner: string, repo: string, branch: string = 'main'): Promise<string | null> {
    try {
      // Try common README filenames
      const readmeFiles = ['README.md', 'readme.md', 'Readme.md'];
      
      for (const filename of readmeFiles) {
        try {
          const response = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filename}`,
            {
              headers: {
                'Accept': 'text/plain',
                'User-Agent': 'GitGud-Backend/1.0',
              },
            } as RequestInit
          );

          if (response.ok) {
            const content = await response.text();
            // Return first 2000 characters as snippet
            return content.substring(0, 2000);
          }
        } catch {
          continue;
        }
      }
    } catch (error) {
      // Silently fail - README is optional
    }

    return null;
  }

  async getSignals(
    username: string,
    maxRepos: number = 5,
    includeReadme: boolean = false
  ): Promise<GitHubSignals> {
    const [profile, repos] = await Promise.all([
      this.getUserProfile(username),
      this.getUserRepos(username),
    ]);

    // Sort repos by stars (descending) and take top N
    const topRepos = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, maxRepos);

    // Fetch READMEs if requested
    const reposWithReadme = includeReadme
      ? await Promise.all(
          topRepos.map(async (repo) => {
            const [owner] = repo.full_name.split('/');
            const readmeContent = await this.getRepoReadme(owner, repo.name, repo.default_branch);
            return {
              ...repo,
              readme_content: readmeContent,
            };
          })
        )
      : topRepos;

    return {
      profile: {
        public_repos: profile.public_repos,
        followers: profile.followers,
        created_at: profile.created_at,
        bio: profile.bio,
        location: profile.location,
        company: profile.company,
      },
      top_repos: reposWithReadme.map((repo) => ({
        name: repo.name,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        updated_at: repo.updated_at,
        description: repo.description,
        readme_snippet: repo.readme_content || undefined,
      })),
    };
  }
}

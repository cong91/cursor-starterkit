# PR

Create a GitHub pull request for the current branch.

## Steps

1. Run in parallel: `git status`, `git diff`, check remote tracking, `git log` and `git diff main...HEAD` (or appropriate base)
2. Analyze all commits that will be in the PR
3. Push with `-u` if branch not on remote
4. `gh pr create` with title, summary bullets, test plan checklist

Never update git config. Do not push unless the user asked. Use HEREDOC for PR body.

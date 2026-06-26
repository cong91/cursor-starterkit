# Explore

Explore the codebase to answer a question or locate code.

## Steps

1. State the question precisely
2. Load `code-navigation` skill
3. Use Glob/Grep/ripgrep MCP/SemanticSearch as appropriate
4. Read the relevant files/ranges
5. Answer with `file:line` citations

For broad exploration, delegate to an `explore` subagent. For a specific symbol, use Grep directly — don't delegate.

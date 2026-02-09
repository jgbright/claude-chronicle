# Research notes: feedback/outreach plan sources

## Network access constraints

Attempted to access primary sources for community rules and posting guidelines (Hacker News, Reddit, subreddit rules pages). All outbound HTTPS requests returned a 403 "CONNECT tunnel failed" response from the network proxy. As a result, I could not retrieve or quote the current, authoritative rules in this environment. Please re-run these requests in an environment with outbound web access and replace the placeholders in the plan with exact links and rule excerpts.

### Failed fetch attempts (examples)
- `curl -I -L https://news.ycombinator.com/newsguidelines.html` -> 403 CONNECT tunnel failed
- `curl -I -L https://www.reddit.com/wiki/selfpromotion` -> 403 CONNECT tunnel failed
- `curl -I -L https://www.reddit.com/r/ClaudeAI/about/rules.json` -> 403 CONNECT tunnel failed

## Intended primary sources (to verify externally)

### Hacker News
- HN Guidelines: https://news.ycombinator.com/newsguidelines.html
- Show HN: https://news.ycombinator.com/showhn.html

### Reddit (global)
- Reddit self-promotion guidelines: https://www.reddit.com/wiki/selfpromotion

### Subreddit rules (JSON endpoints)
Replace `<subreddit>` with each target subreddit name:
- https://www.reddit.com/r/<subreddit>/about/rules.json

## Additional communities to verify
- Reactiflux Discord rules and posting norms
- Gophers Slack rules and posting norms
- Anthropic/Claude community Discord(s) and rules
- Indie Hackers posting guidelines
- Dev.to posting guidelines
- Stack Overflow/Stack Exchange self-promotion policy


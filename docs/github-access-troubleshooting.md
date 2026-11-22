# Diagnose GitHub CLI access errors

Use this guide when `gh` cannot read or write a repository. Never print or paste an access token.

## Check the CLI account and network

Run these commands in the same terminal and environment used for the repository task:

```bash
gh auth status
gh api rate_limit --jq '.rate.remaining'
```

If the request fails with a timeout, DNS, TLS, connection, or sandbox network error, the result does not prove that the token is invalid. Retry the same read-only check in an approved network-enabled environment. Do not change credentials until a GitHub request reaches the server.

If GitHub returns `401` after the network request succeeds, refresh the CLI login. If authentication succeeds but GitHub returns `403`, check the required OAuth scopes, repository role, organization policy, and branch protection. A missing scope and a protected branch require different fixes. Use the normal PR workflow when branch rules block a write.

## Request a missing scope

Ask for only the scope required by the rejected operation. For GitHub CLI, a user can refresh granted scopes with:

```bash
gh auth refresh --hostname github.com --scopes workflow
```

The user completes GitHub's browser consent. Then confirm the granted scopes with `gh auth status` and retry the original operation. Do not request a broader scope as a shortcut.

## Keep credentials private

- Do not run `gh auth token`, print environment variables, or enable shell tracing around authentication commands.
- Do not ask the user to paste a token or one-time device code into chat.
- Report the account name, granted scope names, HTTP status, and whether the request reached GitHub. Omit token values and authorization headers.

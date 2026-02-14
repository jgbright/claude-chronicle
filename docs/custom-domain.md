# Custom Domain and HTTPS Checklist

Use this checklist to enable GitHub Pages TLS for `https://www.claudechronicle.com`.

## 1) GitHub Pages settings

1. Go to the repo: `Settings` -> `Pages`.
2. In `Custom domain`, set: `www.claudechronicle.com` and save.
3. Wait for DNS verification and certificate provisioning.
4. Enable `Enforce HTTPS` as soon as the toggle becomes available.

## 2) Hover DNS changes

Required goal: GitHub Pages serves the domain directly (no Hover forwarding).

1. Delete any forwarding A records for `@` or `*` that point to `216.40.34.41`.
2. Keep (or add) GitHub Pages apex records for `@`:
   - A `185.199.108.153`
   - A `185.199.109.153`
   - A `185.199.110.153`
   - A `185.199.111.153`
   - AAAA `2606:50c0:8000::153`
   - AAAA `2606:50c0:8001::153`
   - AAAA `2606:50c0:8002::153`
   - AAAA `2606:50c0:8003::153`
3. Keep (or add) `www` as CNAME to `jgbright.github.io`.

Note: Hover URL forwarding will not provide a valid GitHub-managed TLS certificate for your site. Use GitHub Pages custom domain mapping instead.

## 3) PowerShell DNS verification

Run:

```powershell
Resolve-DnsName www.claudechronicle.com -Type CNAME
Resolve-DnsName claudechronicle.com -Type A
```

Expected:
- `www.claudechronicle.com` resolves as a CNAME to `jgbright.github.io`.
- `claudechronicle.com` returns GitHub Pages A records (185.199.108.153 - 185.199.111.153).

## 4) Build base path behavior

Astro uses `DEPLOY_BASE`:
- Default (unset): `/` for custom domain root deploys.
- Legacy project-pages path: set `DEPLOY_BASE=/claude-chronicle/` before `npm run build`.

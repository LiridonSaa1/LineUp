---
name: External Render deploy vs Replit Deployments
description: Why a git-linked Render deployment kept showing stale errors despite fixes made in this Replit workspace
---

Render was git-linked (push -> auto-deploy) but was NOT receiving code changes made in this Replit workspace automatically — this workspace is not the same repo Render pulls from unless the user explicitly pushes/syncs. Symptom: new endpoints (e.g. a health-check route) returned 500/empty on the Render URL long after being added and verified working locally.

**Why:** Two independent deploy targets existed for the same app — Render (external, git-triggered) and Replit's own Deployments (build/run natively in this environment). Fixes applied here only affect Replit's copy until pushed to whatever repo Render tracks.

**How to apply:** When a user reports a live/production bug on an external host (Render, Vercel, etc.) that isn't reproducible locally after a fix, first verify whether that host is actually running the current code (e.g. hit a canary endpoint added in this session). If it's stale, either get the fix pushed to the host's source repo, or — simpler when the user is already secrets-configured here — recommend switching to Replit Deployments so this agent can fully manage deploys/env vars/logs directly instead of debugging a black-box external dashboard.

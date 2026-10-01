---
name: modify-website
description: Make scoped, reversible UI and interaction changes to the linashouWangZhan React/Vite website, verify the build, show the real local result, wait for user approval, and publish to production only after separate explicit consent. Use when the user selects `$修改网站` or `$modify-website`, asks to modify this website, requests a visual preview, continues an approved UI iteration, or asks to restore the latest unapproved change.
---

# 修改网站

Use this skill only for the `linashouWangZhan` repository. Let the user's current request determine which page, component, behavior, or style to change; keep the workflow and safety gates below fixed.

## 1. Establish scope and baseline

1. Confirm the working directory is the `linashouWangZhan` repository and inspect `package.json`, the relevant source files, and the current Git branch.
2. Read `视觉统一标准.md` when the request affects appearance. Read `网站修改需求文档.md` when the request affects product behavior or page structure. Treat current code as the source of truth when documents are stale.
3. Inspect `git status --short` before editing. Record existing modified and untracked files as user-owned work; do not alter, stage, or delete them unless the user explicitly includes them.
4. Identify the exact target, desired visible result, and prohibited scope from the request, screenshot, browser marker, or reference image. Ask a question only when the missing answer would materially change the result.
5. State the intended small change before implementation. Do not add unrelated redesigns, dependencies, refactors, or page-wide style changes.

## 2. Implement one reversible pass

1. Inspect the live component and its surrounding styles before editing.
2. Make the smallest coherent change that produces the requested result.
3. Preserve existing behavior, responsive layout, accessibility, privacy-safe logged-out states, and the shared visual language outside the requested area.
4. Keep the current pass easy to reverse. Never use destructive Git commands to create or perform a rollback.

## 3. Build and verify locally

1. Run `npm run build`. If Windows returns a likely sandbox-related `spawn EPERM`, retry once with the required permission before treating it as a code failure.
2. Start or reuse the Vite development server and verify the actual changed state in the in-app browser.
3. Test the directly affected interaction and a nearby regression-sensitive path. For visual changes, inspect at a practical desktop viewport and capture a screenshot when it materially helps review.
4. Give the user the exact local preview URL and label it as local. Do not claim the production site has changed.
5. Summarize only the current pass and wait for the user to inspect it.

## 4. Respond to review

- If the user requests adjustments, repeat one small reversible pass and re-run the relevant checks.
- If the user rejects the pass, restore only files and values introduced by that unapproved pass. Preserve all earlier approved work and user-owned changes.
- If the user approves the local result, ask exactly: `本地效果已通过。是否提交并更新线上网站？`
- Treat approval of the visual result and approval to publish as separate decisions. Do not stage, commit, push, or deploy until the user explicitly agrees to the second question.

## 5. Publish only after explicit consent

After the user explicitly agrees to submit and update production:

1. Recheck `git status`, `git diff`, the current branch, and the remote. Production publishing for this project is `main` -> `origin` -> Vercel.
2. If the branch is not `main`, the remote is unexpected, the branch has diverged, or unrelated changes overlap the requested files, stop and ask before publishing.
3. Run `npm run build` again.
4. Stage only files belonging to the approved website change. Never use broad staging when unrelated or untracked files exist.
5. Create one focused commit with a concise message and push `main` to `origin`.
6. Wait for Vercel to deploy, then verify the production domain `https://image-notes-starter.vercel.app/` in the browser. Check the requested visible change rather than relying only on a successful push.
7. Report the commit identifier, push result, production verification result, and production URL. If deployment or verification fails, say that production is not confirmed and do not claim completion.

## 6. Handle post-publish rollback safely

If the user wants to undo an already-published change, explain that production history has changed and request confirmation before creating a normal revert or corrective commit. Do not rewrite shared history or force-push.


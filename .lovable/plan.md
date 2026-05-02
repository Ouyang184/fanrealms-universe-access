## Goal

Make forum thread replies use the same visual format as the original post (OP) at the top of the thread page.

## Current state

- **OP card**: padded `p-6`, title row with optional category badge, author line prefixed with "by", markdown body.
- **Reply cards**: smaller padding `p-4`, no title, no "by" prefix, just username · date and markdown body.

## Changes (single file: `src/pages/ForumThread.tsx`)

Update the reply `Card` to mirror the OP card:

1. Use the same `CardContent` padding (`p-6`) as the OP.
2. Render a header row matching the OP — but since replies don't have a title or category, use a consistent reply header:
   - Show "Reply" label (or reply index like "Reply #1") at the same heading weight/size as the OP title row, OR
   - Keep no title and just match the author meta line format.
3. Match the author meta line exactly: `by {username} · {formatted date}` using the same `text-sm text-muted-foreground mb-4` classes as the OP (currently `mb-2`).
4. Keep the `MarkdownContent` rendering as-is (already shared).

## Open detail

Replies have no title or category. Two reasonable interpretations of "same format":

- **A. Match container/spacing/meta only** — same padding (`p-6`), same `by ... · date` author line, same bottom margin before content. No title row added. (Recommended — least invasive, visually consistent.)
- **B. Add a "Reply #N" pseudo-title** so replies have a title row like the OP.

Default to **A** unless you prefer B.

## Technical details

```text
Reply Card (after):
┌─────────────────────────────────────────┐
│ p-6                                     │
│  by {username} · {Mon D, YYYY h:mm a}   │  text-sm text-muted-foreground mb-4
│                                         │
│  <MarkdownContent />                    │
└─────────────────────────────────────────┘
```

No new dependencies, no other files touched.
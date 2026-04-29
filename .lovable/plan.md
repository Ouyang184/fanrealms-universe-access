## Update the Game Jam forum post

Rewrite the existing Game Jam thread (id `7e40e6ad-bc74-45c2-bd99-dd81128646b4`) with the new rules. No emojis, plain tone, no AI flourishes.

### Changes

- **Duration:** 1 week (was 72 hours)
- **Theme:** Open — any indie game, any genre, any style (was "3 Buttons Only")
- **Team size:** Solo or teams of any size, anyone can join (was max 3)
- **Prizes paid via:** Cash App (was PayPal/Venmo)
- **Submission method:** Post your game on the FanRealms Games page (which accepts an external link to your build — itch.io, hosted zip, web build, etc.) and reply in the thread with the link. No file-upload feature is required — the existing Games page already supports external URL submissions.

### Prize structure (kept the same unless you say otherwise)

- 1st: $60
- 2nd: $30
- 3rd: $10

### Implementation

Single SQL update to the `forum_threads` row to replace `title` and `content` with the new plain-text/markdown body.

### Do we need an upload feature?

No. The Games page (`/games`) already lets logged-in creators add a game by submitting an `external_url` (e.g., itch.io page or hosted build). Submitters link their game from there and reply to the thread with the link. We can revisit a true file-upload flow later if you want jams to host builds directly on FanRealms.
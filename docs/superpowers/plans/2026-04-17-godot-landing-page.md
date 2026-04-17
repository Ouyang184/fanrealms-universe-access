# Godot Landing Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition the FanRealms landing page and global accent color to signal a Godot-first asset hub to new visitors.

**Architecture:** Two-file change — swap the CSS custom property `--primary` from rose to Godot blue in `src/index.css`, then rewrite the copy and hardcoded color references in `src/pages/Landing.tsx`. No new components, no backend changes.

**Tech Stack:** React 18, TypeScript, Tailwind CSS (CSS variable–based theming), lucide-react icons

---

### Task 1: Swap global accent color to Godot blue

**Files:**
- Modify: `src/index.css` (lines ~14–16, ~26, ~30–31, ~45–46, ~57, ~60–61)

Godot blue `#478cbf` = `hsl(207, 47%, 51%)`. Hover dark `#3a7aab` = `hsl(207, 49%, 45%)`.

- [ ] **Open `src/index.css` and replace every occurrence of `347 77% 50%` with `207 47% 51%`**

The lines to update are the `:root` block and the `.dark` block. After the edit the relevant lines should read:

```css
/* :root block */
--primary: 207 47% 51%;
--primary-foreground: 0 0% 100%;
--ring: 207 47% 51%;
--sidebar-primary: 207 47% 51%;
--sidebar-primary-foreground: 0 0% 100%;

/* .dark block — same values */
--primary: 207 47% 51%;
--primary-foreground: 0 0% 100%;
--ring: 207 47% 51%;
--sidebar-primary: 207 47% 51%;
--sidebar-primary-foreground: 0 0% 100%;
```

- [ ] **Replace every hardcoded rose hover `#be123c` with Godot blue hover `#3a7aab` across the whole codebase**

Files that contain `#be123c` (from grep): `Landing.tsx`, `About.tsx`, `Forum.tsx`, `Games.tsx`, `Jobs.tsx`, `Marketplace.tsx`, `NotFound.tsx`, `HomeDashboard.tsx`, `ProductCard.tsx`

Find & replace (all files): `#be123c` → `#3a7aab`

- [ ] **Replace every hardcoded rose badge background `#fff0f3` with Godot blue tint `#eef4fb`**

Files that contain `#fff0f3` (from grep): same list above.

Find & replace (all files): `#fff0f3` → `#eef4fb`

- [ ] **Verify in browser** — run `bun dev` (or `npm run dev`) and check that buttons, links, and badges are now blue across the site. No red/rose color should remain.

- [ ] **Commit**

```bash
git add src/index.css src/pages/Landing.tsx src/pages/About.tsx src/pages/Forum.tsx src/pages/Games.tsx src/pages/Jobs.tsx src/pages/Marketplace.tsx src/pages/NotFound.tsx src/components/home/HomeDashboard.tsx src/components/marketplace/ProductCard.tsx
git commit -m "design: switch accent color to Godot blue (#478cbf)"
```

---

### Task 2: Rewrite Landing.tsx — hero section

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] **Replace the hero `<section>` block** (currently lines ~50–87). The new hero reads:

```tsx
{/* HERO */}
<section className="border-b border-[#eee] bg-white">
  <div className="max-w-6xl mx-auto px-6 py-16 flex items-center justify-between gap-12">
    <div>
      <h1 className="text-5xl font-bold tracking-[-1.5px] leading-[1.1]">
        Where Godot devs<br />
        <span className="text-primary">buy, sell & ship.</span>
      </h1>
      <p className="mt-4 text-[15px] text-[#777] leading-relaxed max-w-md">
        Assets, indie games, freelance gigs, and a community — all built around the Godot engine.
      </p>
      <div className="flex gap-3 mt-6">
        <Link to="/marketplace" className="px-5 py-2.5 text-[14px] font-semibold text-white bg-primary rounded-[10px] hover:bg-[#3a7aab] transition-colors">
          Browse assets
        </Link>
        <Link to="/signup" className="px-5 py-2.5 text-[14px] font-semibold text-[#333] bg-[#f5f5f5] rounded-[10px] hover:bg-[#eee] transition-colors">
          Sell your work
        </Link>
      </div>
      <p className="mt-4 text-[12px] text-[#aaa]">Free to join · Payments secured by Stripe · No hidden fees</p>
    </div>
    <div className="hidden md:grid grid-cols-2 gap-3 flex-shrink-0 w-[320px]">
      {[
        { Icon: ShoppingBag, title: "Godot Assets", desc: "Plugins, shaders, sprites & tools" },
        { Icon: Gamepad2,    title: "Indie Games",  desc: "Play & discover Godot-made games" },
        { Icon: Briefcase,   title: "Jobs & Gigs",  desc: "Hire or get hired as a Godot dev" },
        { Icon: MessageSquare, title: "Community",  desc: "Forum, devlogs & help" },
      ].map(({ Icon, title, desc }) => (
        <div key={title} className="bg-[#fafafa] border border-[#eee] rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#eee] flex items-center justify-center mb-2.5">
            <Icon className="w-4 h-4 text-[#555]" />
          </div>
          <div className="text-[13px] font-bold text-[#111]">{title}</div>
          <div className="text-[11px] text-[#888] mt-0.5 leading-relaxed">{desc}</div>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "design: update landing hero to Godot-first copy"
```

---

### Task 3: Rewrite Landing.tsx — "How it works" section

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] **Replace the three steps array** inside the "How it works" section (currently lines ~94–123). Update the `step`, `title`, and `desc` values to:

```tsx
{[
  {
    step: "1",
    title: "Sign up free",
    desc: "Create your account in seconds. Free to browse and download assets.",
    color: "bg-primary/10 text-primary",
  },
  {
    step: "2",
    title: "Find or list Godot assets",
    desc: "Buy plugins, shaders, and sprites — or upload your own packs for sale.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    step: "3",
    title: "Build & ship",
    desc: "Get the tools you need, find collaborators in the forum, and ship your game.",
    color: "bg-green-50 text-green-600",
  },
]}
```

- [ ] **Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "design: update how-it-works copy for Godot devs"
```

---

### Task 4: Rewrite Landing.tsx — marketplace preview + empty states

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] **Update the marketplace preview heading** from `"New in Marketplace"` to `"New Godot assets"` (line ~131).

```tsx
<h2 className="text-[15px] font-bold tracking-[-0.3px]">New Godot assets</h2>
```

- [ ] **Replace the empty marketplace state block** (the `<section>` with "The marketplace is open" — currently lines ~168–182) with:

```tsx
<section className="max-w-6xl mx-auto px-6 py-10">
  <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-10 text-center">
    <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-3">
      <ShoppingBag className="w-4 h-4 text-[#bbb]" />
    </div>
    <div className="text-[16px] font-bold text-[#111] mb-1">Be the first to list a Godot asset</div>
    <div className="text-[13px] text-[#888] mb-4 max-w-sm mx-auto">
      Upload a plugin, shader pack, or sprite set — and be the first seller on the marketplace.
    </div>
    <Link to="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-primary rounded-[10px] hover:bg-[#3a7aab] transition-colors">
      Start selling →
    </Link>
  </div>
</section>
```

- [ ] **Replace the empty jobs + forum state block** (currently lines ~252–276) with:

```tsx
<section className="max-w-6xl mx-auto px-6 pb-10">
  <div className="grid md:grid-cols-2 gap-4">
    <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-8 text-center">
      <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-2">
        <Briefcase className="w-4 h-4 text-[#bbb]" />
      </div>
      <div className="text-[15px] font-bold text-[#111] mb-1">Post a Godot gig</div>
      <div className="text-[12px] text-[#999] mb-4">Looking for a GDScript dev, pixel artist, or sound designer?</div>
      <Link to="/signup" className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
        Post a job
      </Link>
    </div>
    <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-8 text-center">
      <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-2">
        <MessageSquare className="w-4 h-4 text-[#bbb]" />
      </div>
      <div className="text-[15px] font-bold text-[#111] mb-1">Start the first Godot thread</div>
      <div className="text-[12px] text-[#999] mb-4">Ask a question, share a devlog, or introduce your project.</div>
      <Link to="/signup" className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
        Start a thread
      </Link>
    </div>
  </div>
</section>
```

- [ ] **Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "design: update marketplace preview and empty states for Godot"
```

---

### Task 5: Update footer tagline + nav Sign up button hover

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] **Update the nav Sign up button hover color** (line ~42). Change `hover:bg-[#be123c]` to `hover:bg-[#3a7aab]`:

```tsx
<Link to="/signup" className="px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors">
  Sign up
</Link>
```

- [ ] **Update the footer** to add a Godot tagline. Replace the current footer `<Logo variant="dark" />` line with:

```tsx
<div>
  <Logo variant="dark" />
  <div className="text-[11px] text-[#555] mt-1">The Godot asset hub.</div>
</div>
```

- [ ] **Final visual check** — run `bun dev`, open `http://localhost:5173` (or whatever port), and verify:
  - Hero headline reads "Where Godot devs buy, sell & ship."
  - All buttons and links are blue, no red/rose anywhere
  - 4 hero cards show Godot Assets / Indie Games / Jobs & Gigs / Community
  - Empty states mention Godot specifically
  - Footer shows "The Godot asset hub."

- [ ] **Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "design: update footer tagline and nav button hover"
```

---

### Task 6: Add `.superpowers/` to `.gitignore`

**Files:**
- Modify: `.gitignore`

- [ ] **Open `.gitignore` and add:**

```
# Superpowers brainstorm sessions
.superpowers/
```

- [ ] **Commit**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers/ brainstorm files"
```

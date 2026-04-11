# FanRealms Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign FanRealms with a modern red+white visual identity, castle tower logo, dark sidebar app layout, and a new Indie Games section.

**Architecture:** Hub-and-spoke layout — public landing page with top nav, authenticated experience with a dark sidebar. Each of the four sections (Marketplace, Games, Jobs, Forum) has its own page. Design system changes flow from CSS variables and font first, then propagate through all components.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS 3, shadcn/ui, Supabase, TanStack Query, Space Grotesk (Google Fonts)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `index.html` | Modify | Add Space Grotesk Google Font link |
| `tailwind.config.ts` | Modify | Add Space Grotesk to fontFamily |
| `src/index.css` | Modify | Update CSS color variables to new design system |
| `src/components/Logo.tsx` | Modify | Castle tower SVG + Space Grotesk wordmark |
| `src/components/Layout/MainLayout.tsx` | Modify | Surface background (`#f5f5f5`) for logged-in area |
| `src/components/Layout/Sidebar/Sidebar.tsx` | Modify | Dark background, remove border |
| `src/components/Layout/Sidebar/SidebarHeader.tsx` | Modify | Dark styles, new logo usage |
| `src/components/Layout/Sidebar/MainNavigation.tsx` | Modify | New section labels, dark nav items, Indie Games link |
| `src/components/Layout/Sidebar/CreatorStudioMenu.tsx` | Modify | Dark styles, updated nav items, conditional visibility |
| `src/components/Layout/Sidebar/SidebarFooter.tsx` | Modify | Dark styles, creator badge |
| `src/pages/Landing.tsx` | Modify | Full redesign — top nav, hero, 4-section layout |
| `src/pages/Home.tsx` | Modify | New dashboard — greeting, stats, activity, creators |
| `src/components/home/HomeContent.tsx` | Modify | Replace with new dashboard layout |
| `src/pages/Marketplace.tsx` | Modify | Pill filters, 4-column grid |
| `src/components/marketplace/ProductCard.tsx` | Modify | New card style (rounded, hover shadow) |
| `src/pages/Jobs.tsx` | Modify | List layout with new row design |
| `src/components/jobs/JobListingCard.tsx` | Modify | New row style |
| `src/pages/Forum.tsx` | Modify | List layout with new thread row design |
| `src/components/forum/ThreadCard.tsx` | Modify | New thread row style |
| `src/hooks/useIndieGames.ts` | Create | TanStack Query hooks for indie_games table |
| `src/components/games/GameCard.tsx` | Create | Game card component (16:9 thumb, external link) |
| `src/pages/Games.tsx` | Create | Indie Games showcase page |
| `src/App.tsx` | Modify | Add `/games` route |
| `supabase/migrations/[timestamp]-indie-games.sql` | Create | indie_games table + RLS policies |

---

## Task 1: Design System — Font & Color Tokens

**Files:**
- Modify: `index.html`
- Modify: `tailwind.config.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Add Space Grotesk to index.html**

In `index.html`, add this inside `<head>` just before `</head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Register font in Tailwind**

In `tailwind.config.ts`, add `fontFamily` inside `theme.extend`:

```ts
fontFamily: {
  sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
},
```

- [ ] **Step 3: Update CSS color variables in src/index.css**

Replace the entire `:root` and `.dark` blocks with:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 7%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 7%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 7%;
    --primary: 347 77% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 96%;
    --secondary-foreground: 0 0% 7%;
    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 53%;
    --accent: 0 0% 96%;
    --accent-foreground: 0 0% 7%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 93%;
    --input: 0 0% 93%;
    --ring: 347 77% 50%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 0 0% 7%;
    --foreground: 0 0% 93%;
    --card: 0 0% 10%;
    --card-foreground: 0 0% 93%;
    --popover: 0 0% 10%;
    --popover-foreground: 0 0% 93%;
    --primary: 347 77% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 15%;
    --secondary-foreground: 0 0% 93%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 53%;
    --accent: 0 0% 15%;
    --accent-foreground: 0 0% 93%;
    --destructive: 0 62% 30%;
    --destructive-foreground: 0 0% 93%;
    --border: 0 0% 16%;
    --input: 0 0% 16%;
    --ring: 347 77% 50%;
  }
}
```

- [ ] **Step 4: Verify the app compiles and loads without errors**

Run: `npm run dev`

Open http://localhost:8080. The app should load with red primary buttons and Space Grotesk font applied globally. Ignore visual differences for now — they'll be fixed in subsequent tasks.

- [ ] **Step 5: Commit**

```bash
git add index.html tailwind.config.ts src/index.css
git commit -m "feat: apply new design system — Space Grotesk font and red color tokens"
```

---

## Task 2: Logo Component

**Files:**
- Modify: `src/components/Logo.tsx`

- [ ] **Step 1: Replace Logo with castle tower SVG + wordmark**

Replace the entire contents of `src/components/Logo.tsx` with:

```tsx
import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: "light" | "dark";
}

export function Logo({ collapsed = false, onClick, className, variant = "light" }: LogoProps) {
  const textColor = variant === "dark" ? "text-white" : "text-foreground";
  const accentColor = "text-primary";

  return (
    <div
      className={cn("flex items-center gap-2 cursor-pointer", className)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="FanRealms"
    >
      <svg width="28" height="28" viewBox="0 0 52 52" fill="none" aria-hidden="true" className="flex-shrink-0">
        <rect width="52" height="52" rx="10" fill="#E11D48"/>
        {/* left tall merlon */}
        <rect x="9"  y="10" width="7" height="9" rx="1.5" fill="white"/>
        {/* left short merlon */}
        <rect x="19" y="13" width="6" height="6" rx="1" fill="white"/>
        {/* center tall merlon */}
        <rect x="23" y="10" width="7" height="9" rx="1.5" fill="white"/>
        {/* right short merlon */}
        <rect x="33" y="13" width="6" height="6" rx="1" fill="white"/>
        {/* right tall merlon */}
        <rect x="37" y="10" width="7" height="9" rx="1.5" fill="white"/>
        {/* tower body */}
        <rect x="9" y="19" width="35" height="20" rx="1.5" fill="white"/>
        {/* window arch */}
        <rect x="22" y="23" width="9" height="7" rx="4.5" fill="#E11D48"/>
        {/* door */}
        <rect x="23" y="30" width="7" height="9" fill="#E11D48"/>
        <rect x="23" y="30" width="7" height="4" rx="3.5" fill="#E11D48"/>
      </svg>

      {!collapsed && (
        <span className={cn("text-base font-bold tracking-tight leading-none", textColor)}>
          Fan<span className={accentColor}>Realms</span>
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify logo renders in the sidebar**

Run `npm run dev`, navigate to any authenticated page. The sidebar should show the castle tower icon + "FanRealms" wordmark with "Realms" in red.

- [ ] **Step 3: Commit**

```bash
git add src/components/Logo.tsx
git commit -m "feat: replace logo with castle tower SVG mark and Space Grotesk wordmark"
```

---

## Task 3: Sidebar — Dark Theme & New Structure

**Files:**
- Modify: `src/components/Layout/Sidebar/Sidebar.tsx`
- Modify: `src/components/Layout/Sidebar/SidebarHeader.tsx`
- Modify: `src/components/Layout/Sidebar/MainNavigation.tsx`
- Modify: `src/components/Layout/Sidebar/CreatorStudioMenu.tsx`
- Modify: `src/components/Layout/Sidebar/SidebarFooter.tsx`

- [ ] **Step 1: Apply dark background to Sidebar.tsx**

In `src/components/Layout/Sidebar/Sidebar.tsx`, find the desktop return block and replace `"border-r border-border flex flex-col transition-all duration-300 ease-in-out bg-card flex-shrink-0"` with:

```
"flex flex-col transition-all duration-300 ease-in-out bg-[#111] flex-shrink-0"
```

Also update the mobile Drawer's inner div from `"flex flex-col h-full bg-background text-foreground"` to `"flex flex-col h-full bg-[#111] text-white"`.

- [ ] **Step 2: Update SidebarHeader.tsx**

Replace the entire contents of `src/components/Layout/Sidebar/SidebarHeader.tsx` with:

```tsx
import { Logo } from "@/components/Logo";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarHeader({ collapsed, onToggle }: SidebarHeaderProps) {
  return (
    <div className={cn(
      "flex items-center border-b border-[#1f1f1f] flex-shrink-0",
      collapsed ? "justify-center px-2 py-4" : "justify-between px-4 py-4"
    )}>
      <Logo collapsed={collapsed} variant="dark" />
      <button
        onClick={onToggle}
        className="text-[#555] hover:text-white transition-colors hidden md:flex"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed
          ? <PanelLeftOpen className="h-4 w-4" />
          : <PanelLeftClose className="h-4 w-4" />
        }
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Replace MainNavigation.tsx with new structure**

Replace the entire contents of `src/components/Layout/Sidebar/MainNavigation.tsx` with:

```tsx
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Store, Gamepad2, MessagesSquare, Briefcase, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainNavigationProps {
  collapsed: boolean;
  onMobileNavClick?: () => void;
  isMobile?: boolean;
}

const DISCOVER_ITEMS = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/explore", icon: Compass, label: "Explore" },
  { path: "/marketplace", icon: Store, label: "Marketplace" },
  { path: "/games", icon: Gamepad2, label: "Indie Games" },
];

const COMMUNITY_ITEMS = [
  { path: "/forum", icon: MessagesSquare, label: "Forum" },
  { path: "/jobs", icon: Briefcase, label: "Jobs" },
  { path: "/following", icon: Users, label: "Following" },
  { path: "/messages", icon: MessageSquare, label: "Messages" },
];

function SectionLabel({ label, collapsed, isMobile }: { label: string; collapsed: boolean; isMobile: boolean }) {
  if (collapsed && !isMobile) return null;
  return (
    <div className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#444]">
      {label}
    </div>
  );
}

function NavItem({ path, icon: Icon, label, collapsed, isMobile, onClick }: {
  path: string; icon: React.ElementType; label: string;
  collapsed: boolean; isMobile: boolean; onClick?: () => void;
}) {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <Link
      to={path}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
        collapsed && !isMobile ? "justify-center" : "",
        isActive
          ? "bg-[#1f1f1f] text-white"
          : "text-[#777] hover:bg-[#1a1a1a] hover:text-[#ccc]"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {(!collapsed || isMobile) && <span>{label}</span>}
      {isActive && (!collapsed || isMobile) && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

export function MainNavigation({ collapsed, onMobileNavClick, isMobile = false }: MainNavigationProps) {
  return (
    <div className="py-2">
      <SectionLabel label="Discover" collapsed={collapsed} isMobile={isMobile} />
      {DISCOVER_ITEMS.map((item) => (
        <NavItem key={item.path} {...item} collapsed={collapsed} isMobile={isMobile} onClick={onMobileNavClick} />
      ))}
      <SectionLabel label="Community" collapsed={collapsed} isMobile={isMobile} />
      {COMMUNITY_ITEMS.map((item) => (
        <NavItem key={item.path} {...item} collapsed={collapsed} isMobile={isMobile} onClick={onMobileNavClick} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Update CreatorStudioMenu.tsx**

Replace the entire contents of `src/components/Layout/Sidebar/CreatorStudioMenu.tsx` with:

```tsx
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Store, Gamepad2, PenTool, DollarSign, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";

interface CreatorStudioMenuProps {
  collapsed: boolean;
  onMobileNavClick?: () => void;
  isMobile?: boolean;
}

const CREATOR_ITEMS = [
  { path: "/creator-studio/dashboard", icon: BarChart3, label: "Dashboard" },
  { path: "/creator-studio/products", icon: Store, label: "My Products" },
  { path: "/games/my-games", icon: Gamepad2, label: "My Games" },
  { path: "/creator-studio/commissions", icon: PenTool, label: "Commissions" },
  { path: "/creator-studio/payouts", icon: DollarSign, label: "Earnings" },
];

export function CreatorStudioMenu({ collapsed, onMobileNavClick, isMobile = false }: CreatorStudioMenuProps) {
  const location = useLocation();
  const { creatorProfile, isLoading } = useCreatorProfile();

  // Only show Creator Studio if user has a creator profile
  if (isLoading || !creatorProfile) return null;

  return (
    <div className="py-2 border-t border-[#1a1a1a]">
      {(!collapsed || isMobile) && (
        <div className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
          Creator Studio
        </div>
      )}
      {CREATOR_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onMobileNavClick}
            className={cn(
              "flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
              collapsed && !isMobile ? "justify-center" : "",
              isActive
                ? "bg-[#1f1f1f] text-white"
                : "text-[#666] hover:bg-[#1a1a1a] hover:text-[#ccc]"
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {(!collapsed || isMobile) && <span>{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Update SidebarFooter.tsx**

Read the current `src/components/Layout/Sidebar/SidebarFooter.tsx` and replace the profile section to use dark styles. Find the outermost container className and replace it with dark styles:

```tsx
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  collapsed: boolean;
  onSignOut: () => void;
}

export function SidebarFooter({ collapsed, onSignOut }: SidebarFooterProps) {
  const { profile } = useAuth();

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : profile?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="border-t border-[#1a1a1a] p-3 flex-shrink-0">
      <div className={cn(
        "flex items-center gap-3",
        collapsed ? "justify-center" : ""
      )}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {profile?.profile_image_url
            ? <img src={profile.profile_image_url} alt="" className="w-full h-full rounded-lg object-cover" />
            : initials
          }
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-600 text-[#ccc] truncate">
                {profile?.display_name || profile?.username || "User"}
              </div>
              <div className="text-[11px] text-[#555] truncate">
                @{profile?.username}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link to="/settings" className="text-[#444] hover:text-[#888] transition-colors p-1">
                <Settings className="h-3.5 w-3.5" />
              </Link>
              <button onClick={onSignOut} className="text-[#444] hover:text-[#888] transition-colors p-1">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify sidebar looks correct**

Run `npm run dev` and log in. The sidebar should be dark (`#111` background), with "Discover" and "Community" section labels in dimmed caps, white active items, and Creator Studio section only visible when logged in as a creator.

- [ ] **Step 7: Commit**

```bash
git add src/components/Layout/Sidebar/
git commit -m "feat: redesign sidebar with dark theme and new Discover/Community sections"
```

---

## Task 4: Main Layout Background

**Files:**
- Modify: `src/components/Layout/MainLayout.tsx`

- [ ] **Step 1: Update main content background to surface color**

In `src/components/Layout/MainLayout.tsx`, find the outermost div className:

```tsx
className="flex h-screen bg-background text-foreground overflow-hidden"
```

Change to:

```tsx
className="flex h-screen bg-[#f5f5f5] text-foreground overflow-hidden"
```

Also find the `<main>` element and ensure its padding is consistent:

```tsx
<main className="flex-1 overflow-auto p-4 sm:p-6">
```

- [ ] **Step 2: Verify layout**

Run `npm run dev`. The logged-in area should have a light gray (`#f5f5f5`) background instead of white, making the white cards pop.

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout/MainLayout.tsx
git commit -m "feat: use surface background color for main layout"
```

---

## Task 5: Landing Page Redesign

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] **Step 1: Replace Landing.tsx with new design**

Replace the entire contents of `src/pages/Landing.tsx` with:

```tsx
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useMarketplaceProducts } from "@/hooks/useMarketplace";
import { useJobListings } from "@/hooks/useJobs";
import { useForumThreads } from "@/hooks/useForum";
import { formatDistanceToNow } from "date-fns";

export default function LandingPage() {
  const { data: products } = useMarketplaceProducts("all");
  const { data: jobs } = useJobListings("all") as { data: any[] | undefined };
  const { data: threads } = useForumThreads("all") as { data: any[] | undefined };

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans">

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#eee]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-2">
          <Logo className="mr-4" />
          <nav className="hidden md:flex gap-1">
            {[
              { to: "/marketplace", label: "Marketplace" },
              { to: "/games", label: "Games" },
              { to: "/jobs", label: "Jobs" },
              { to: "/forum", label: "Forum" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#777] hover:bg-[#f5f5f5] hover:text-[#111] transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-[13px] font-semibold text-[#555] border border-[#e5e5e5] rounded-lg hover:border-[#ccc] transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#be123c] transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-[#eee] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16 flex items-center justify-between gap-12">
          <div>
            <h1 className="text-5xl font-bold tracking-[-1.5px] leading-[1.1]">
              The indie creator<br />
              <span className="text-primary">marketplace.</span>
            </h1>
            <p className="mt-4 text-[15px] text-[#777] leading-relaxed max-w-md">
              Buy and sell game assets, discover indie games, find freelance work, and connect with other creators.
            </p>
            <div className="flex gap-3 mt-6">
              <Link to="/marketplace" className="px-5 py-2.5 text-[14px] font-semibold text-white bg-primary rounded-[10px] hover:bg-[#be123c] transition-colors">
                Browse assets
              </Link>
              <Link to="/signup" className="px-5 py-2.5 text-[14px] font-semibold text-[#333] bg-[#f5f5f5] rounded-[10px] hover:bg-[#eee] transition-colors">
                Sell your work
              </Link>
            </div>
          </div>
          <div className="hidden md:flex gap-10 flex-shrink-0">
            {[
              { num: "4.2k", label: "Creators" },
              { num: "18k", label: "Assets" },
              { num: "930", label: "Open jobs" },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <div className="text-[32px] font-bold tracking-[-1px]">
                  {num.replace(/(\d+)/, (m) => m)}<span className="text-primary">.</span>
                </div>
                <div className="text-[12px] text-[#aaa] font-medium mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETPLACE PREVIEW */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold tracking-[-0.3px]">New in Marketplace</h2>
          <Link to="/marketplace" className="text-[13px] font-semibold text-primary hover:underline">See all</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(products ?? []).slice(0, 4).map((product: any) => (
            <Link
              key={product.id}
              to={`/marketplace/${product.id}`}
              className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="aspect-[4/3] bg-[#f5f5f5] overflow-hidden">
                {product.preview_image_url && (
                  <img src={product.preview_image_url} alt={product.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <div className="text-[13px] font-semibold leading-snug truncate">{product.title}</div>
                <div className="text-[11px] text-[#aaa] mt-0.5 truncate">
                  {product.creators?.display_name || product.creators?.username}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[14px] font-bold">
                    {product.price === 0 ? "Free" : `$${(product.price / 100).toFixed(2)}`}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fff0f3] text-primary">
                    {product.category}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* JOBS + FORUM */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Jobs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold tracking-[-0.3px]">Open Jobs</h2>
              <Link to="/jobs" className="text-[13px] font-semibold text-primary hover:underline">See all</Link>
            </div>
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {(jobs ?? []).slice(0, 4).map((job: any, i: number) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors ${i < 3 ? "border-b border-[#f5f5f5]" : ""}`}
                >
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{job.title}</div>
                    <div className="text-[11px] text-[#aaa] mt-0.5">{job.company_name} · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#555]">{job.job_type}</span>
                    {job.budget && <span className="text-[12px] font-bold">${job.budget}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Forum */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold tracking-[-0.3px]">Forum</h2>
              <Link to="/forum" className="text-[13px] font-semibold text-primary hover:underline">See all</Link>
            </div>
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {(threads ?? []).slice(0, 4).map((thread: any, i: number) => (
                <Link
                  key={thread.id}
                  to={`/forum/${thread.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors ${i < 3 ? "border-b border-[#f5f5f5]" : ""}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                    {(thread.profiles?.username || thread.profiles?.display_name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold leading-snug truncate">{thread.title}</div>
                    <div className="text-[11px] text-[#aaa] mt-0.5">{thread.category} · {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[13px] font-bold">{thread.reply_count ?? 0}</div>
                    <div className="text-[10px] text-[#ccc]">replies</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111] text-[#666]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <Logo variant="dark" />
          <div className="flex gap-6 text-[12px]">
            {["About", "Terms", "Privacy", "Support"].map((l) => (
              <Link key={l} to={`/${l.toLowerCase()}`} className="hover:text-[#999] transition-colors">{l}</Link>
            ))}
          </div>
          <div className="text-[12px] text-[#444]">2026 FanRealms</div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Verify landing page**

Run `npm run dev`, navigate to `/` (log out first or open in incognito). The landing page should show the new top nav, hero, marketplace grid, jobs, forum, and footer.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "feat: redesign landing page with new hero, marketplace preview, jobs, and forum sections"
```

---

## Task 6: Home Dashboard (Authenticated)

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/components/home/HomeContent.tsx`

- [ ] **Step 1: Update Home.tsx**

Replace the entire contents of `src/pages/Home.tsx` with:

```tsx
import { MainLayout } from "@/components/Layout/MainLayout";
import { HomeDashboard } from "@/components/home/HomeDashboard";

export default function HomePage() {
  return (
    <MainLayout>
      <HomeDashboard />
    </MainLayout>
  );
}
```

- [ ] **Step 2: Create HomeDashboard component**

Create `src/components/home/HomeDashboard.tsx`:

```tsx
import { useAuth } from "@/contexts/AuthContext";
import { useMarketplaceProducts } from "@/hooks/useMarketplace";
import { useJobListings } from "@/hooks/useJobs";
import { useForumThreads } from "@/hooks/useForum";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeDashboard() {
  const { profile } = useAuth();
  const { data: products } = useMarketplaceProducts("all");
  const { data: jobs } = useJobListings("all") as { data: any[] | undefined };
  const { data: threads } = useForumThreads("all") as { data: any[] | undefined };

  const name = profile?.display_name || profile?.username || "there";

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* GREETING */}
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.5px]">{getGreeting()}, {name}.</h1>
        <p className="text-[13px] text-[#888] mt-1">Here's what's happening in your realm today.</p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Open Jobs", value: jobs?.length ?? 0, sub: "Across all categories" },
          { label: "New Assets", value: products?.length ?? 0, sub: "Listed this week" },
          { label: "Forum Threads", value: threads?.length ?? 0, sub: "Active discussions" },
          { label: "Creators", value: "4.2k", sub: "On the platform" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-[#eee] p-4">
            <div className="text-[11px] font-semibold text-[#aaa] uppercase tracking-[0.5px]">{label}</div>
            <div className="text-[28px] font-bold tracking-[-1px] mt-1">{value}</div>
            <div className="text-[11px] text-[#aaa] mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* JOBS + FORUM */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Open Jobs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] font-bold">Open Jobs</span>
            <Link to="/jobs" className="text-[12px] font-semibold text-primary">See all</Link>
          </div>
          <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
            {(jobs ?? []).slice(0, 5).map((job: any, i: number) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors ${i < 4 ? "border-b border-[#f5f5f5]" : ""}`}
              >
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{job.title}</div>
                  <div className="text-[11px] text-[#aaa]">{job.company_name} · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#555]">{job.job_type}</span>
                  {job.budget && <span className="text-[12px] font-bold">${job.budget}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Active Forum Threads */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] font-bold">Active Threads</span>
            <Link to="/forum" className="text-[12px] font-semibold text-primary">See all</Link>
          </div>
          <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
            {(threads ?? []).slice(0, 5).map((thread: any, i: number) => (
              <Link
                key={thread.id}
                to={`/forum/${thread.id}`}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors ${i < 4 ? "border-b border-[#f5f5f5]" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {(thread.profiles?.username || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{thread.title}</div>
                  <div className="text-[11px] text-[#aaa]">{thread.category} · {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[13px] font-bold">{thread.reply_count ?? 0}</div>
                  <div className="text-[10px] text-[#ccc]">replies</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* NEW ASSETS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-bold">New in Marketplace</span>
          <Link to="/marketplace" className="text-[12px] font-semibold text-primary">See all</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(products ?? []).slice(0, 4).map((product: any) => (
            <Link
              key={product.id}
              to={`/marketplace/${product.id}`}
              className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="aspect-[4/3] bg-[#f5f5f5] overflow-hidden">
                {product.preview_image_url && (
                  <img src={product.preview_image_url} alt={product.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <div className="text-[13px] font-semibold leading-snug truncate">{product.title}</div>
                <div className="text-[11px] text-[#aaa] mt-0.5 truncate">
                  {product.creators?.display_name || product.creators?.username}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[14px] font-bold">
                    {product.price === 0 ? "Free" : `$${(product.price / 100).toFixed(2)}`}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fff0f3] text-primary">
                    {product.category}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
```

- [ ] **Step 3: Verify the home dashboard**

Run `npm run dev`, log in, navigate to `/home`. Should show greeting, stat cards, jobs, forum threads, and recent marketplace assets.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.tsx src/components/home/HomeDashboard.tsx
git commit -m "feat: redesign home dashboard with greeting, stats, jobs, forum, and marketplace sections"
```

---

## Task 7: Marketplace Page

**Files:**
- Modify: `src/pages/Marketplace.tsx`
- Modify: `src/components/marketplace/ProductCard.tsx`

- [ ] **Step 1: Update Marketplace.tsx**

Replace the entire contents of `src/pages/Marketplace.tsx` with:

```tsx
import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const CATEGORIES = ['all', 'Game Assets', 'Templates', 'Tools', 'Tutorials', 'Music', 'Art', 'Other'];

export default function Marketplace() {
  const [category, setCategory] = useState('all');
  const { data: products, isLoading } = useMarketplaceProducts(category);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px]">Marketplace</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Buy digital assets from indie creators</p>
          </div>
          <Link
            to="/creator-studio/products"
            className="px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#be123c] transition-colors"
          >
            Sell something
          </Link>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                category === c
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#ccc]'
              }`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#aaa]">
            No products found. Check back soon!
          </div>
        )}
      </div>
    </MainLayout>
  );
}
```

- [ ] **Step 2: Update ProductCard.tsx**

Read the current `src/components/marketplace/ProductCard.tsx` to understand its props, then replace with:

```tsx
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  preview_image_url?: string;
  creators?: { display_name?: string; username?: string };
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const authorName = product.creators?.display_name || product.creators?.username || 'Unknown';
  const priceDisplay = product.price === 0 ? 'Free' : `$${(product.price / 100).toFixed(2)}`;

  return (
    <Link
      to={`/marketplace/${product.id}`}
      className="group bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="aspect-[4/3] bg-[#f5f5f5] overflow-hidden">
        {product.preview_image_url ? (
          <img
            src={product.preview_image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-[#ccc] font-medium uppercase tracking-wide">
            No preview
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-[13px] font-semibold leading-snug truncate">{product.title}</div>
        <div className="text-[11px] text-[#aaa] mt-0.5 truncate">{authorName}</div>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[14px] font-bold">{priceDisplay}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fff0f3] text-primary">
            {product.category}
          </span>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Verify marketplace page**

Run `npm run dev`, navigate to `/marketplace`. Cards should display in a 4-column grid with pill category filters.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Marketplace.tsx src/components/marketplace/ProductCard.tsx
git commit -m "feat: redesign marketplace with pill filters and new card style"
```

---

## Task 8: Jobs Page

**Files:**
- Modify: `src/pages/Jobs.tsx`
- Modify: `src/components/jobs/JobListingCard.tsx`

- [ ] **Step 1: Update Jobs.tsx**

Replace entire contents of `src/pages/Jobs.tsx` with:

```tsx
import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useJobListings, JOB_CATEGORIES } from '@/hooks/useJobs';
import { JobListingCard } from '@/components/jobs/JobListingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateJobDialog } from '@/components/jobs/CreateJobDialog';

export default function Jobs() {
  const [category, setCategory] = useState('all');
  const { data: listings, isLoading } = useJobListings(category) as { data: any[] | undefined; isLoading: boolean };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px]">Jobs</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Find gigs, bounties, and freelance opportunities</p>
          </div>
          <CreateJobDialog />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory('all')}
            className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
              category === 'all'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#ccc]'
            }`}
          >
            All
          </button>
          {JOB_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                category === c
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#ccc]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
            {listings.map((listing, i) => (
              <JobListingCard
                key={listing.id}
                listing={listing}
                isLast={i === listings.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#aaa]">
            No open listings. Be the first to post a job!
          </div>
        )}
      </div>
    </MainLayout>
  );
}
```

- [ ] **Step 2: Update JobListingCard.tsx**

Read `src/components/jobs/JobListingCard.tsx` to understand current props, then replace with:

```tsx
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface JobListing {
  id: string;
  title: string;
  company_name?: string;
  job_type?: string;
  budget?: number;
  created_at: string;
}

interface JobListingCardProps {
  listing: JobListing;
  isLast?: boolean;
}

export function JobListingCard({ listing, isLast }: JobListingCardProps) {
  const initials = (listing.company_name || "??").slice(0, 2).toUpperCase();

  return (
    <Link
      to={`/jobs/${listing.id}`}
      className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors ${!isLast ? 'border-b border-[#f5f5f5]' : ''}`}
    >
      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      <div className="w-8 h-8 rounded-lg bg-[#f0f0f0] flex items-center justify-center text-[11px] font-bold text-[#888] flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold truncate">{listing.title}</div>
        <div className="text-[11px] text-[#aaa] mt-0.5">
          {listing.company_name} · {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {listing.job_type && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#f5f5f5] text-[#555]">
            {listing.job_type}
          </span>
        )}
        {listing.budget && (
          <span className="text-[13px] font-bold">${listing.budget}</span>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Verify jobs page**

Navigate to `/jobs`. Listings should appear in a single white card with rows separated by light borders. Pills filter by category.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Jobs.tsx src/components/jobs/JobListingCard.tsx
git commit -m "feat: redesign jobs page with list layout and pill category filters"
```

---

## Task 9: Forum Page

**Files:**
- Modify: `src/pages/Forum.tsx`
- Modify: `src/components/forum/ThreadCard.tsx`

- [ ] **Step 1: Update Forum.tsx**

Replace entire contents of `src/pages/Forum.tsx` with:

```tsx
import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useForumThreads, FORUM_CATEGORIES } from '@/hooks/useForum';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateThreadDialog } from '@/components/forum/CreateThreadDialog';

export default function Forum() {
  const [category, setCategory] = useState('all');
  const { data: threads, isLoading } = useForumThreads(category) as { data: any[] | undefined; isLoading: boolean };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px]">Forum</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Discuss, share devlogs, and connect with the community</p>
          </div>
          <CreateThreadDialog />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory('all')}
            className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
              category === 'all'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#ccc]'
            }`}
          >
            All
          </button>
          {FORUM_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                category === c
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#ccc]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] w-full rounded-xl" />
            ))}
          </div>
        ) : threads && threads.length > 0 ? (
          <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
            {threads.map((thread, i) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                isLast={i === threads.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#aaa]">
            No threads yet. Start the conversation!
          </div>
        )}
      </div>
    </MainLayout>
  );
}
```

- [ ] **Step 2: Update ThreadCard.tsx**

Read `src/components/forum/ThreadCard.tsx` to understand current props, then replace with:

```tsx
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Thread {
  id: string;
  title: string;
  category?: string;
  reply_count?: number;
  created_at: string;
  profiles?: { username?: string; display_name?: string; profile_image_url?: string };
}

interface ThreadCardProps {
  thread: Thread;
  isLast?: boolean;
}

export function ThreadCard({ thread, isLast }: ThreadCardProps) {
  const author = thread.profiles?.username || thread.profiles?.display_name || "?";
  const initials = author.slice(0, 2).toUpperCase();

  return (
    <Link
      to={`/forum/${thread.id}`}
      className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors ${!isLast ? 'border-b border-[#f5f5f5]' : ''}`}
    >
      <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 overflow-hidden">
        {thread.profiles?.profile_image_url
          ? <img src={thread.profiles.profile_image_url} alt="" className="w-full h-full object-cover" />
          : initials
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold leading-snug truncate">{thread.title}</div>
        <div className="text-[11px] text-[#aaa] mt-0.5">
          {thread.category && <span className="mr-1">{thread.category} ·</span>}
          {author} · {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[13px] font-bold">{thread.reply_count ?? 0}</div>
        <div className="text-[10px] text-[#ccc]">replies</div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Verify forum page**

Navigate to `/forum`. Threads should appear in a clean list with user avatars, titles, metadata, and reply counts.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Forum.tsx src/components/forum/ThreadCard.tsx
git commit -m "feat: redesign forum page with list layout and pill category filters"
```

---

## Task 10: Indie Games — Migration, Hook, Components, Page, Route

**Files:**
- Create: `supabase/migrations/[timestamp]-indie-games.sql`
- Create: `src/hooks/useIndieGames.ts`
- Create: `src/components/games/GameCard.tsx`
- Create: `src/pages/Games.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create the database migration**

Create `supabase/migrations/20260411000000-indie-games.sql`:

```sql
-- Create indie_games table
create table if not exists public.indie_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  genre text,
  thumbnail_url text,
  external_url text not null,
  external_platform text,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.indie_games enable row level security;

-- Anyone can read published games
create policy "Public can read indie games"
  on public.indie_games for select
  using (true);

-- Users can insert their own games
create policy "Users can insert own games"
  on public.indie_games for insert
  with check (auth.uid() = user_id);

-- Users can update their own games
create policy "Users can update own games"
  on public.indie_games for update
  using (auth.uid() = user_id);

-- Users can delete their own games
create policy "Users can delete own games"
  on public.indie_games for delete
  using (auth.uid() = user_id);
```

Run the migration:
```bash
npx supabase db push
```

If you don't have supabase CLI configured locally, apply it via the Supabase dashboard SQL editor.

- [ ] **Step 2: Create useIndieGames hook**

Create `src/hooks/useIndieGames.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const GAME_GENRES = ['All', 'Action', 'RPG', 'Puzzle', 'Platformer', 'Roguelike', 'Strategy', 'Simulation', 'Horror', 'Other'];

export function useIndieGames(genre?: string) {
  return useQuery({
    queryKey: ['indie-games', genre],
    queryFn: async () => {
      let query = (supabase as any)
        .from('indie_games')
        .select('*')
        .order('created_at', { ascending: false });

      if (genre && genre !== 'All' && genre !== 'all') {
        query = query.eq('genre', genre);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as IndieGame[];
    },
  });
}

export function useUserGames() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-games', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('indie_games')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as IndieGame[];
    },
  });
}

export function useAddGame() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (game: Omit<IndieGame, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await (supabase as any)
        .from('indie_games')
        .insert({ ...game, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indie-games'] });
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
      toast.success('Game added!');
    },
    onError: () => {
      toast.error('Failed to add game. Please try again.');
    },
  });
}

export interface IndieGame {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  genre?: string;
  thumbnail_url?: string;
  external_url: string;
  external_platform?: string;
  created_at: string;
}
```

- [ ] **Step 3: Create GameCard component**

Create `src/components/games/GameCard.tsx`:

```tsx
import { IndieGame } from '@/hooks/useIndieGames';
import { ExternalLink } from 'lucide-react';

interface GameCardProps {
  game: IndieGame;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <div className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 group">
      {/* 16:9 thumbnail */}
      <div className="aspect-video bg-[#111] overflow-hidden">
        {game.thumbnail_url ? (
          <img
            src={game.thumbnail_url}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-[#444] font-medium uppercase tracking-wide">
            No cover
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-[13px] font-semibold truncate">{game.title}</div>
        <div className="flex items-center justify-between mt-2">
          {game.genre && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#f5f5f5] text-[#555]">
              {game.genre}
            </span>
          )}
          <a
            href={game.external_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline ml-auto"
          >
            {game.external_platform || 'Play'}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create Games page**

Create `src/pages/Games.tsx`:

```tsx
import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useIndieGames, GAME_GENRES } from '@/hooks/useIndieGames';
import { GameCard } from '@/components/games/GameCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

export default function GamesPage() {
  const [genre, setGenre] = useState('All');
  const { data: games, isLoading } = useIndieGames(genre);
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px]">Indie Games</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Discover games made by the FanRealms community</p>
          </div>
          {user && (
            <button className="px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#be123c] transition-colors">
              Add your game
            </button>
          )}
        </div>

        {/* Genre pills */}
        <div className="flex gap-2 flex-wrap">
          {GAME_GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                genre === g
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#ccc]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : games && games.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#aaa]">
            No games yet. Be the first to add yours!
          </div>
        )}
      </div>
    </MainLayout>
  );
}
```

- [ ] **Step 5: Add /games route to App.tsx**

In `src/App.tsx`, add the import at the top with other page imports:

```tsx
import GamesPage from "./pages/Games";
```

Then add the route inside the `<Routes>` block, alongside the other public+auth routes (after the Forum route):

```tsx
<Route path="/games" element={
  <AuthGuard>
    <GamesPage />
  </AuthGuard>
} />
```

- [ ] **Step 6: Verify games page**

Navigate to `/games`. Should show genre pill filters and the games grid (empty state initially since the table is new).

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260411000000-indie-games.sql \
        src/hooks/useIndieGames.ts \
        src/components/games/GameCard.tsx \
        src/pages/Games.tsx \
        src/App.tsx
git commit -m "feat: add indie games section with showcase page, GameCard component, and Supabase migration"
```

---

## Self-Review Checklist

- [x] **Design tokens** — CSS variables updated in Task 1, Space Grotesk added
- [x] **Logo** — Castle tower SVG with `variant` prop for dark/light contexts
- [x] **Sidebar dark theme** — Task 3 covers all sidebar sub-components
- [x] **Creator Studio conditional** — `useCreatorProfile` drives visibility in `CreatorStudioMenu`
- [x] **Landing page** — Hero, marketplace preview, jobs, forum, footer all covered
- [x] **Home dashboard** — Greeting, stats, jobs, threads, assets
- [x] **Marketplace** — Pill filters, 4-column grid, updated ProductCard
- [x] **Jobs** — Pill filters, list layout, updated JobListingCard
- [x] **Forum** — Pill filters, list layout, updated ThreadCard
- [x] **Indie Games** — Migration, hook, GameCard, Games page, route in App.tsx
- [x] **No gradients** — All components use flat colors
- [x] **No emoji in UI** — No emoji used in any component
- [x] **External links for games** — GameCard links out, no file hosting

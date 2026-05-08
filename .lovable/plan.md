## Goal
When a logged-in user clicks the FanRealms logo (top-left), navigate to `/marketplace` instead of `/` (landing).

## Changes

1. **`src/components/Layout/TopNav/TopNav.tsx`** (line 44)
   - Change `<Link to="/">` wrapping the `<Logo />` to `<Link to={user ? '/marketplace' : '/'}>`. `user` is already available from `useAuth()`.

2. **`src/components/marketplace/MarketplaceTopNav.tsx`** (line 39)
   - Same change: `<Link to={user ? '/marketplace' : '/'}>` (the `user` from `useAuth()` is already imported).

## Out of scope
- Sidebar logo (`AppSidebar`, `SidebarHeader`, `NewMainLayout`) — those are inside the authenticated dashboard and use `onClick` to toggle the sidebar, not navigation. No change.
- Public landing logo behavior for logged-out users stays pointing to `/`.
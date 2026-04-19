
Remove the ⌘ and K keyboard shortcut hint badges from the search bar.

**Change** (`src/components/Layout/Header/SearchBar.tsx`): Delete the `<div>` containing the two `<kbd>` elements (lines 12–15).

Also note: there's a pre-existing build error unrelated to this change — `AppSidebar.tsx` imports `./Sidebar/CreatorStudioMenu` which doesn't exist. I'll fix that alongside by either creating the missing file or removing the import, depending on what `AppSidebar` does with it (will inspect first).

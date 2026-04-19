
The screenshot shows a huge empty whitespace column to the LEFT of the content. That's because `MainLayout` likely centers content in a container, leaving the page content offset right while the viewport's left edge is empty. The fix: make the marketplace use full width (or a wider/edge-aligned container).

Let me check MainLayout to confirm.

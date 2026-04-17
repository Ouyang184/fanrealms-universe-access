import { Link, NavLink, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PRIMARY_LINKS = [
  { to: "/marketplace", label: "Browse" },
  { to: "/marketplace?category=Game%20Assets", label: "Game Assets" },
  { to: "/marketplace?category=Tools", label: "Tools" },
  { to: "/marketplace?category=Templates", label: "Templates" },
  { to: "/marketplace?category=Music", label: "Music" },
  { to: "/marketplace?category=Art", label: "Art" },
];

export function MarketplaceTopNav() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const location = useLocation();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const isActive = (to: string) => {
    const [path, query] = to.split("?");
    if (location.pathname !== path) return false;
    if (!query) return location.search === "";
    return location.search.includes(query.split("=")[0] + "=" + query.split("=")[1]);
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
      {/* Top row: logo, search, account */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link to="/" className="flex items-center shrink-0">
          <Logo />
        </Link>

        <form onSubmit={submit} className="flex-1 max-w-xl hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the marketplace..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto">
          <Link
            to="/creator-studio/products"
            className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-md hover:bg-primary/5 transition-colors"
          >
            Sell on FanRealms
          </Link>
          {user ? (
            <Link
              to="/home"
              className="p-2 rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Dashboard"
            >
              <User className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-semibold rounded-md hover:bg-muted"
            >
              Log in
            </Link>
          )}
          <Link
            to="/purchases"
            className="p-2 rounded-md hover:bg-muted text-muted-foreground"
            aria-label="Library"
          >
            <ShoppingBag className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Bottom row: category nav */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-11 flex items-center gap-1 overflow-x-auto">
        {PRIMARY_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/marketplace"}
            className={() =>
              `px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                isActive(link.to)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
        <div className="mx-2 h-4 w-px bg-border" />
        <Link
          to="/jobs"
          className="px-3 py-1.5 text-xs font-semibold rounded-md text-muted-foreground hover:text-foreground hover:bg-muted whitespace-nowrap"
        >
          Jobs
        </Link>
        <Link
          to="/forum"
          className="px-3 py-1.5 text-xs font-semibold rounded-md text-muted-foreground hover:text-foreground hover:bg-muted whitespace-nowrap"
        >
          Forum
        </Link>
        <Link
          to="/explore"
          className="px-3 py-1.5 text-xs font-semibold rounded-md text-muted-foreground hover:text-foreground hover:bg-muted whitespace-nowrap"
        >
          Creators
        </Link>
      </nav>
    </header>
  );
}

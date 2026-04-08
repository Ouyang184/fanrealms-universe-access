
import { Link } from "react-router-dom";

export function HomeFooter() {
  const links = [
    { to: "/about", label: "About" },
    { to: "/terms", label: "Terms" },
    { to: "/privacy-policy", label: "Privacy" },
    { to: "/help", label: "Help" },
    { to: "/community-guidelines", label: "Guidelines" },
    { to: "/creator-guidelines", label: "Creators" },
  ];

  return (
    <footer className="border-t border-border pt-6 pb-8 mt-16">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} FanRealms
        </p>
        <div className="flex flex-wrap gap-4">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

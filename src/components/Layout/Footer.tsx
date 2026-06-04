
import { Link } from "react-router-dom";
import { CreditCard } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#1A1F2C] text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Company */}
          <div className="space-y-3">
            <h3 className="font-semibold mb-2">Company</h3>
            <ul className="space-y-1.5">
              <li><Link to="/about" className="hover:text-primary/80">About Us</Link></li>
              <li><Link to="/payments" className="hover:text-primary/80">Pricing</Link></li>
              <li><Link to="/creator-faq" className="hover:text-primary/80">Sell on FanRealms</Link></li>
              <li><Link to="/creator-guidelines" className="hover:text-primary/80">Creator Guidelines</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold mb-2">Legal</h3>
            <ul className="space-y-1.5">
              <li><Link to="/terms" className="hover:text-primary/80">Terms of Service</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-primary/80">Privacy Policy</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-primary/80">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="font-semibold mb-2">Resources</h3>
            <ul className="space-y-1.5">
              <li><Link to="/marketplace" className="hover:text-primary/80">Browse Assets</Link></li>
              <li><Link to="/jobs" className="hover:text-primary/80">Job Board</Link></li>
              <li><Link to="/forum" className="hover:text-primary/80">Community Forum</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h3 className="font-semibold mb-2">Support</h3>
            <ul className="space-y-1.5">
              <li><Link to="/help" className="hover:text-primary/80">Help Center</Link></li>
              <li><Link to="/security" className="hover:text-primary/80">Security</Link></li>
              <li><Link to="/community-guidelines" className="hover:text-primary/80">Community Guidelines</Link></li>
              <li><Link to="/payments" className="hover:text-primary/80">Payments</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/60">© 2025 FanRealms LLC — Located in Arkansas, USA</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/60">
                <CreditCard className="w-6 h-6" />
                <span className="text-xs">Credit / Debit Cards Accepted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


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
              <li><Link to="/features" className="hover:text-primary/80">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-primary/80">Pricing</Link></li>
              <li><Link to="/developers" className="hover:text-primary/80">Developers</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold mb-2">Legal</h3>
            <ul className="space-y-1.5">
              <li><Link to="/terms" className="hover:text-primary/80">Terms of Service</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-primary/80">Privacy Policy</Link></li>
              <li><Link to="/privacy-settings" className="hover:text-primary/80">Privacy Settings</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-primary/80">Cookie Policy</Link></li>
              <li><Link to="/refund-policy" className="hover:text-primary/80">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="font-semibold mb-2">Resources</h3>
            <ul className="space-y-1.5">
              <li><Link to="/creators" className="hover:text-primary/80">All Creators</Link></li>
              <li><Link to="/whats-new" className="hover:text-primary/80">What's New</Link></li>
              <li><Link to="/brand" className="hover:text-primary/80">Brand</Link></li>
              <li><Link to="/contact" className="hover:text-primary/80">Contact Us</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h3 className="font-semibold mb-2">Support</h3>
            <ul className="space-y-1.5">
              <li><Link to="/payments" className="hover:text-primary/80">Payments</Link></li>
              <li><Link to="/security" className="hover:text-primary/80">Security</Link></li>
              <li><Link to="/guidelines" className="hover:text-primary/80">Do's & Don'ts</Link></li>
              <li><Link to="/report" className="hover:text-primary/80">Report Content</Link></li>
              <li><Link to="/faq" className="hover:text-primary/80">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/60">© 2025 FanRealms. All rights reserved.</p>
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

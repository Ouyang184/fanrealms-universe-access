
import { Link } from "react-router-dom";
import { Visa, Mastercard } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#1A1F2C] text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/features" className="hover:text-primary/80">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-primary/80">Pricing</Link></li>
              <li><Link to="/developers" className="hover:text-primary/80">Developers</Link></li>
              <li><Link to="/about" className="hover:text-primary/80">About</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/terms" className="hover:text-primary/80">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-primary/80">Privacy Policy</Link></li>
              <li><Link to="/privacy-settings" className="hover:text-primary/80">Privacy Settings</Link></li>
              <li><Link to="/refund-policy" className="hover:text-primary/80">Refund Policy</Link></li>
              <li><Link to="/2257" className="hover:text-primary/80">18 USC § 2257</Link></li>
              <li><Link to="/eu-dsa" className="hover:text-primary/80">EU DSA</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="/creators" className="hover:text-primary/80">All Creators</Link></li>
              <li><Link to="/whats-new" className="hover:text-primary/80">What's New</Link></li>
              <li><Link to="/brand" className="hover:text-primary/80">Brand</Link></li>
              <li><Link to="/contact" className="hover:text-primary/80">Contact Us</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/guidelines" className="hover:text-primary/80">Do's & Don'ts</Link></li>
              <li><Link to="/report" className="hover:text-primary/80">Report Content</Link></li>
              <li><Link to="/faq" className="hover:text-primary/80">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/60">© 2025 FanRealms. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Visa className="w-8 h-8 text-white/60" />
              <Mastercard className="w-8 h-8 text-white/60" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

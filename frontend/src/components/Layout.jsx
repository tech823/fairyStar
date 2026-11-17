import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, Phone, MessageCircle, Mail } from "lucide-react";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_dubai-getaway/artifacts/8x335zix_FairyStar%20logo%20white.png";

const navLinks = [
  { name: "Stays", path: "/stays" },
  { name: "Services", path: "/services" },
  { name: "Journey", path: "/journey" },
  { name: "Corporate", path: "/corporate" },
  { name: "Medical", path: "/medical" },
  { name: "List Property", path: "/list-property" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? "glass-navbar py-3" : "bg-transparent py-5"
        }`}
        data-testid="main-navigation"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0"
            data-testid="logo-link"
          >
            <img
              src={LOGO_URL}
              alt="Fairy Star"
              className="h-8 sm:h-9 w-auto"
            />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[13px] font-medium tracking-wide transition-all duration-200 relative py-1 uppercase ${
                  location.pathname === link.path
                    ? "text-[#F3A15A]"
                    : "text-white/60 hover:text-white"
                }`}
                data-testid={`nav-${link.name.toLowerCase().replace(" ", "-")}`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#F3A15A] rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/stays" className="hidden sm:block">
              <LiquidButton size="sm" data-testid="find-stay-btn">
                Find a Stay
              </LiquidButton>
            </Link>
            <button
              className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              data-testid="mobile-menu-toggle"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] glass-modal lg:hidden"
            data-testid="mobile-menu"
          >
            <div className="flex flex-col h-full p-6 safe-top safe-bottom">
              <div className="flex justify-between items-center mb-10">
                <img src={LOGO_URL} alt="Fairy Star" className="h-8 w-auto" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  data-testid="close-mobile-menu"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      to={link.path}
                      className={`block text-2xl font-heading font-light py-3 transition-colors tracking-tight ${
                        location.pathname === link.path
                          ? "text-[#F3A15A]"
                          : "text-white/70 hover:text-white"
                      }`}
                      data-testid={`mobile-nav-${link.name.toLowerCase().replace(" ", "-")}`}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="pt-6 border-t border-white/[0.06]">
                <Link to="/stays">
                  <LiquidButton className="w-full justify-center py-4 text-base">
                    Find a Stay
                  </LiquidButton>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-[#2D3139] py-16 sm:py-20" data-testid="footer">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="section-divider mb-16" />
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-5">
              <img src={LOGO_URL} alt="Fairy Star" className="h-8 w-auto" />
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-[280px]">
              Your complete stay and travel partner in the UAE. One partner. One
              coordinator. Zero hassle.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-xs font-medium text-white/60 uppercase tracking-[0.2em] mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {["Stays", "Services", "Corporate", "Medical"].map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase()}`}
                    className="text-white/40 hover:text-[#F3A15A] text-sm transition-colors duration-200"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-xs font-medium text-white/60 uppercase tracking-[0.2em] mb-5">
              Destinations
            </h4>
            <ul className="space-y-3">
              {["Dubai", "Sharjah", "Ras Al Khaimah", "Abu Dhabi"].map(
                (city) => (
                  <li key={city}>
                    <Link
                      to={`/stays?city=${city}`}
                      className="text-white/40 hover:text-[#F3A15A] text-sm transition-colors duration-200"
                    >
                      {city}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-xs font-medium text-white/60 uppercase tracking-[0.2em] mb-5">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li className="flex items-center gap-2.5">
                <a
                  href="tel:+971506603525"
                  className="flex items-center gap-2.5 hover:text-[#F3A15A] transition-colors group"
                >
                  <Phone
                    size={14}
                    className="text-[#F3A15A] shrink-0 group-hover:scale-110 transition-transform"
                  />
                  <span>+971 50 660 3525</span>
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <a
                  href="https://wa.me/971506603525"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-[#F3A15A] transition-colors group"
                >
                  <MessageCircle
                    size={14}
                    className="text-[#F3A15A] shrink-0 group-hover:scale-110 transition-transform"
                  />
                  <span>WhatsApp Chat</span>
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <a
                  href="mailto:info@fairystar.ae"
                  className="flex items-center gap-2.5 hover:text-[#F3A15A] transition-colors group"
                >
                  <Mail
                    size={14}
                    className="text-[#F3A15A] shrink-0 group-hover:scale-110 transition-transform"
                  />
                  <span>info@fairystar.ae</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="section-divider mt-16 mb-8" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} Fairy Star Vacation Homes. All
            rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              to="#"
              className="text-white/30 hover:text-[#F3A15A] text-xs transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="#"
              className="text-white/30 hover:text-[#F3A15A] text-xs transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const FloatingActions = () => {
  return (
    <div className="fab" data-testid="floating-actions">
      <a
        href="https://wa.me/971506603525"
        target="_blank"
        rel="noopener noreferrer"
        className="fab-button fab-whatsapp"
        data-testid="whatsapp-btn"
      >
        <MessageCircle size={22} />
      </a>
      <a
        href="tel:+971506603525"
        className="fab-button fab-phone"
        data-testid="call-btn"
      >
        <Phone size={22} />
      </a>
    </div>
  );
};

export default function Layout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}

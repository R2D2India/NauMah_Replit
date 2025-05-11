import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AuthButton } from "@/components/auth/AuthButton";
import { scrollToTop } from "@/lib/scrollUtils";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/language/LanguageSelector";

const Header = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link 
            href="/" 
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200" 
            title="Return to Home"
            onClick={(e) => {
              // Ensure we scroll to the top of the page when clicking the logo
              if (location === "/") {
                e.preventDefault(); // Prevent navigation if already on home page
                scrollToTop(); // Scroll to top
              } else {
                // If not on home page, we'll use this to ensure we start at the top after navigation
                window.scrollTo(0, 0);
              }
            }}
          >
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <i className="fas fa-baby text-white"></i>
            </div>
            <span className="text-xl md:text-2xl font-montserrat font-semibold text-primary group">
              NauMah<span className="text-xs align-top -ml-0.5 leading-none">™</span>
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/dashboard">
            <span className={`font-medium ${isActive("/dashboard") ? "text-primary" : "text-neutral-dark hover:text-primary"} transition cursor-pointer`}>
              Baby & Me
            </span>
          </Link>
          <Link href="/diet-exercise">
            <span className={`font-medium ${isActive("/diet-exercise") ? "text-primary" : "text-neutral-dark hover:text-primary"} transition cursor-pointer`}>
              Diet & Exercise
            </span>
          </Link>
          <Link href="/tracker">
            <span className={`font-medium ${isActive("/tracker") ? "text-primary" : "text-neutral-dark hover:text-primary"} transition cursor-pointer`}>
              Tracker
            </span>
          </Link>
          <Link href="/resources">
            <span className={`font-medium ${isActive("/resources") ? "text-primary" : "text-neutral-dark hover:text-primary"} transition cursor-pointer`}>
              Resources
            </span>
          </Link>
        </nav>
        
        <div className="flex items-center space-x-3">
          <LanguageSelector />
          <div className="hidden md:block">
            <AuthButton />
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-primary text-xl"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3">
          <nav className="flex flex-col space-y-3">
            <Link href="/dashboard">
              <span className={`font-medium ${isActive("/dashboard") ? "text-primary" : "text-neutral-dark"} py-2 block cursor-pointer`}>
                Baby & Me
              </span>
            </Link>
            <Link href="/diet-exercise">
              <span className={`font-medium ${isActive("/diet-exercise") ? "text-primary" : "text-neutral-dark"} py-2 block cursor-pointer`}>
                Diet & Exercise
              </span>
            </Link>
            <Link href="/tracker">
              <span className={`font-medium ${isActive("/tracker") ? "text-primary" : "text-neutral-dark"} py-2 block cursor-pointer`}>
                Tracker
              </span>
            </Link>
            <Link href="/resources">
              <span className={`font-medium ${isActive("/resources") ? "text-primary" : "text-neutral-dark"} py-2 block cursor-pointer`}>
                Resources
              </span>
            </Link>
            <div className="py-2">
              <AuthButton />
            </div>
            <div className="py-2 flex items-center">
              <span className="mr-2">{t('language.select')}:</span>
              <LanguageSelector />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

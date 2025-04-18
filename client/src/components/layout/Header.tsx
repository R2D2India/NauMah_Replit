import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ProfileDialog } from "@/components/profile/ProfileDialog";

const Header = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200" title="Return to Home">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <i className="fas fa-baby text-white"></i>
            </div>
            <span className="text-xl md:text-2xl font-montserrat font-semibold text-primary relative">
              NauMah
              <span className="absolute -top-2 -right-4 text-xs">™</span>
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/dashboard">
            <span className={`font-medium ${isActive("/dashboard") ? "text-primary" : "text-neutral-dark hover:text-primary"} transition cursor-pointer`}>
              Baby & Me
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
          <Link href="/journal">
            <span className={`font-medium ${isActive("/journal") ? "text-primary" : "text-neutral-dark hover:text-primary"} transition cursor-pointer`}>
              Journal
            </span>
          </Link>
        </nav>
        
        <div className="flex items-center space-x-3">
          <div className="hidden md:block">
            <ProfileDialog />
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
            <Link href="/journal">
              <span className={`font-medium ${isActive("/journal") ? "text-primary" : "text-neutral-dark"} py-2 block cursor-pointer`}>
                Journal
              </span>
            </Link>
            <div className="py-2">
              <ProfileDialog />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

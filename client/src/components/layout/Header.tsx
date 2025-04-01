import { useState } from "react";
import { Link, useLocation } from "wouter";

const Header = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <i className="fas fa-baby text-white"></i>
            </div>
            <span className="text-xl md:text-2xl font-montserrat font-semibold text-primary cursor-pointer">NauMah</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/dashboard">
            <span className={`font-medium ${isActive("/dashboard") ? "text-primary" : "text-neutral-dark hover:text-primary"} transition cursor-pointer`}>
              Dashboard
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
          <button className="hidden md:block bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition duration-300">
            My Profile
          </button>
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
                Dashboard
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
            <Link href="/profile">
              <span className="font-medium text-primary py-2 block cursor-pointer">
                My Profile
              </span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

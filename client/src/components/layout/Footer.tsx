import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center justify-center md:justify-start">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mr-2">
                <i className="fas fa-baby text-white text-sm"></i>
              </div>
              <span className="text-primary font-montserrat font-semibold">NauMah</span>
            </div>
            <p className="text-sm text-neutral-dark mt-2 text-center md:text-left">Your AI Pregnancy Companion</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <Link href="/privacy">
              <a className="text-sm text-neutral-dark hover:text-primary transition">Privacy Policy</a>
            </Link>
            <Link href="/terms">
              <a className="text-sm text-neutral-dark hover:text-primary transition">Terms of Service</a>
            </Link>
            <Link href="/support">
              <a className="text-sm text-neutral-dark hover:text-primary transition">Contact Support</a>
            </Link>
            <Link href="/disclaimer">
              <a className="text-sm text-neutral-dark hover:text-primary transition">Medical Disclaimer</a>
            </Link>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-neutral-dark">
          <p>NauMah does not provide medical advice. Always consult with healthcare professionals for medical decisions.</p>
          <p className="mt-1">© {new Date().getFullYear()} NauMah. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

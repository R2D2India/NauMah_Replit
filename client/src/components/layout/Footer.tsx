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
              <span className="text-sm text-neutral-dark hover:text-primary transition cursor-pointer">Privacy Policy</span>
            </Link>
            <Link href="/terms">
              <span className="text-sm text-neutral-dark hover:text-primary transition cursor-pointer">Terms of Service</span>
            </Link>
            <Link href="/support">
              <span className="text-sm text-neutral-dark hover:text-primary transition cursor-pointer">Contact Support</span>
            </Link>
            <Link href="/disclaimer">
              <span className="text-sm text-neutral-dark hover:text-primary transition cursor-pointer">Medical Disclaimer</span>
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-primary">Our Mission</h3>
              <p className="text-neutral-dark">
                At NauMah AI Technologies, we're dedicated to revolutionizing pregnancy care through innovative AI solutions. 
                Our mission is to empower expectant mothers with personalized guidance, making pregnancy journey safer and more informed. 
                We understand the challenges women face during pregnancy and are committed to providing 24/7 AI-powered support.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-primary">Contact Us</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">India Headquarters:</p>
                  <p className="text-neutral-dark">NauMah AI Technologies Pvt. Ltd.<br />OneBKC, BKC<br />Mumbai - 400053, India</p>
                </div>
                <div>
                  <p className="font-medium">USA Office:</p>
                  <p className="text-neutral-dark">Woodbridge Park<br />Virginia, USA 22192</p>
                </div>
                <div>
                  <p className="font-medium">Email Us:</p>
                  <p className="text-neutral-dark">
                    Support: <a href="mailto:support@naumah.com" className="text-primary hover:underline">support@naumah.com</a><br />
                    Business: <a href="mailto:hypeme@naumah.com" className="text-primary hover:underline">hypeme@naumah.com</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-neutral-dark border-t border-gray-200 pt-4">
            <p>NauMah does not provide medical advice. Always consult with healthcare professionals for medical decisions.</p>
            <p className="mt-2">© {new Date().getFullYear()} NauMah AI Technologies Pvt. Ltd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

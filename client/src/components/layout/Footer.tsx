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

          <div className="flex flex-wrap justify-end gap-x-8 gap-y-2 md:mr-8">
            <Link href="/privacy">
              <span className="text-sm text-neutral-dark hover:text-primary transition cursor-pointer">Privacy Policy</span>
            </Link>
            <Link href="/terms">
              <span className="text-sm text-neutral-dark hover:text-primary transition cursor-pointer">Terms of Service</span>
            </Link>
            <Link href="/disclaimer">
              <span className="text-sm text-neutral-dark hover:text-primary transition cursor-pointer">Medical Disclaimer</span>
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid md:grid-cols-2 gap-12 mb-8">
            {/* Our Mission Section */}
            <div className="p-6 bg-primary/5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-primary/10">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center mr-3 shadow-md">
                  <i className="fas fa-heartbeat text-white"></i>
                </div>
                <h3 className="text-xl font-semibold text-primary">Our Mission</h3>
              </div>
              
              <div className="space-y-3">
                <p className="text-neutral-dark leading-relaxed">
                  At NauMah AI Technologies, we're dedicated to revolutionizing pregnancy care through innovative AI solutions.
                </p>
                <div className="flex items-start">
                  <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
                  <p className="text-neutral-dark">Empower expectant mothers with personalized guidance</p>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
                  <p className="text-neutral-dark">Make pregnancy journeys safer and more informed</p>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
                  <p className="text-neutral-dark">Provide 24/7 AI-powered pregnancy support</p>
                </div>
              </div>
              
              <div className="mt-4 text-sm bg-white p-3 rounded-lg border border-primary/20">
                <div className="flex items-center">
                  <i className="fas fa-quote-left text-primary/50 mr-2"></i>
                  <p className="italic">Supporting every mother through the beautiful journey of pregnancy</p>
                </div>
              </div>
            </div>
            
            {/* Contact Us Section */}
            <div className="p-6 bg-primary/5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-primary/10">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center mr-3 shadow-md">
                  <i className="fas fa-envelope text-white"></i>
                </div>
                <h3 className="text-xl font-semibold text-primary">Contact Us</h3>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-start p-3 bg-white rounded-lg shadow-sm hover:shadow transition-all duration-300">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div>
                    <p className="font-medium text-primary-dark">India Headquarters:</p>
                    <p className="text-neutral-dark">NauMah AI Technologies Pvt. Ltd.<br />OneBKC, BKC<br />Mumbai - 400053, India</p>
                  </div>
                </div>
                
                <div className="flex items-start p-3 bg-white rounded-lg shadow-sm hover:shadow transition-all duration-300">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                    <i className="fas fa-building"></i>
                  </div>
                  <div>
                    <p className="font-medium text-primary-dark">USA Office:</p>
                    <p className="text-neutral-dark">Woodbridge Park<br />Virginia, USA 22192</p>
                  </div>
                </div>
                
                <div className="flex items-start p-3 bg-white rounded-lg shadow-sm hover:shadow transition-all duration-300">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div>
                    <p className="font-medium text-primary-dark">Email Us:</p>
                    <p className="text-neutral-dark">
                      <a href="mailto:support@naumah.com" className="text-primary hover:underline flex items-center">
                        <i className="fas fa-headset mr-1"></i> support@naumah.com
                      </a>
                      <a href="mailto:hypeme@naumah.com" className="text-primary hover:underline flex items-center mt-1">
                        <i className="fas fa-briefcase mr-1"></i> hypeme@naumah.com
                      </a>
                    </p>
                  </div>
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
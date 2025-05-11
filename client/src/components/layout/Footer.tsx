import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";

const Footer = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center justify-center md:justify-start">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mr-2">
                <i className="fas fa-baby text-white text-sm"></i>
              </div>
              <span className="text-primary font-montserrat font-semibold">
                {language === 'hi' ? 'नौमा' : 'NauMah'}<span className="text-xs align-top -ml-0.5 leading-none">™</span>
              </span>
            </div>
            <p className="text-sm text-neutral-dark mt-2 text-center md:text-left">{t('app.companion')}</p>
          </div>

          <div className="flex flex-wrap justify-end gap-x-8 gap-y-2 md:mr-8">
            <Link href="/privacy">
              <span className="text-sm text-neutral-dark hover:text-primary transition cursor-pointer">{t('footer.privacy')}</span>
            </Link>
            <Link href="/terms">
              <span className="text-sm text-neutral-dark hover:text-primary transition cursor-pointer">{t('footer.terms')}</span>
            </Link>
            <Link href="/disclaimer">
              <span className="text-sm text-neutral-dark hover:text-primary transition cursor-pointer">{t('footer.disclaimer')}</span>
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
                <h3 className="text-xl font-semibold text-primary">{t('mission.title')}</h3>
              </div>
              
              <div className="space-y-3">
                <p className="text-neutral-dark leading-relaxed">
                  {t('mission.description')}
                </p>
                <div className="flex items-start">
                  <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
                  <p className="text-neutral-dark">{t('mission.point1')}</p>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
                  <p className="text-neutral-dark">{t('mission.point2')}</p>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
                  <p className="text-neutral-dark">{t('mission.point3')}</p>
                </div>
              </div>
              
              <div className="mt-4 text-sm bg-white p-3 rounded-lg border border-primary/20">
                <div className="flex items-center">
                  <i className="fas fa-quote-left text-primary/50 mr-2"></i>
                  <p className="italic">{t('mission.quote')}</p>
                </div>
              </div>
            </div>
            
            {/* Contact Us Section */}
            <div className="p-6 bg-primary/5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-primary/10">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center mr-3 shadow-md">
                  <i className="fas fa-envelope text-white"></i>
                </div>
                <h3 className="text-xl font-semibold text-primary">{t('contact.title')}</h3>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-start p-3 bg-white rounded-lg shadow-sm hover:shadow transition-all duration-300">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div>
                    <p className="font-medium text-primary-dark">{t('contact.india')}</p>
                    <p className="text-neutral-dark" dangerouslySetInnerHTML={{ __html: t('contact.indiaAddress') }}></p>
                  </div>
                </div>
                
                <div className="flex items-start p-3 bg-white rounded-lg shadow-sm hover:shadow transition-all duration-300">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                    <i className="fas fa-building"></i>
                  </div>
                  <div>
                    <p className="font-medium text-primary-dark">{t('contact.usa')}</p>
                    <p className="text-neutral-dark" dangerouslySetInnerHTML={{ __html: t('contact.usaAddress') }}></p>
                  </div>
                </div>
                
                <div className="flex items-start p-3 bg-white rounded-lg shadow-sm hover:shadow transition-all duration-300">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div>
                    <p className="font-medium text-primary-dark">{t('contact.email')}</p>
                    <p className="text-neutral-dark">
                      <a href="mailto:support@naumah.com" className="text-primary hover:underline flex items-center">
                        <i className="fas fa-headset mr-1"></i> {t('contact.support')}
                      </a>
                      <a href="mailto:hypeme@naumah.com" className="text-primary hover:underline flex items-center mt-1">
                        <i className="fas fa-briefcase mr-1"></i> {t('contact.business')}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-neutral-dark border-t border-gray-200 pt-4">
            <p>{t('footer.medical')}</p>
            <p className="mt-2">© {new Date().getFullYear()} {language === 'hi' ? 'नौमा' : 'NauMah'} AI Technologies Pvt. Ltd. {t('footer.rights')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import { useTranslation } from "react-i18next";

export const ComingSoonSections = () => {
  const { t } = useTranslation();
  const products = [
    { key: 'maternity_dresses', image: '/images/pregnancy/maternity-dress.jpg' },
    { key: 'healthy_snacks', image: '/images/pregnancy/healthy-snacks.jpg' },
    { key: 'prenatal_vitamins', image: '/images/pregnancy/prenatal-vitamins.jpg' },
  ];

  return (
    <>
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('coming_soon.ecommerce_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition">
                <img 
                  src={product.image} 
                  alt={t(`products.${product.key}`)}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{t(`products.${product.key}`)}</h3>
                  <p className="text-sm text-gray-600 mt-2">{t('common.coming_soon')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-purple-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">{t('coming_soon.consultation_title')}</h2>
          <div className="max-w-2xl mx-auto rounded-lg shadow-xl relative overflow-hidden transform hover:scale-[1.02] transition-transform duration-300" style={{ perspective: '1000px' }}>
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('/images/pregnancy/doctor-consultation.jpg')` }}
            ></div>
            <div className="relative z-10 bg-gradient-to-r from-white/40 to-white/30 p-8 backdrop-blur-[1px] hover:backdrop-blur-[2px] transition-all duration-300">
              <div className="w-24 h-24 bg-primary-light rounded-full mx-auto mb-6 flex items-center justify-center">
                <i className="fas fa-stethoscope text-3xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('coming_soon.expert_consultation')}</h3>
              <p className="text-gray-800 mb-6 font-semibold">
                {t('coming_soon.consultation_description')}
              </p>
              <button
                className="bg-primary text-white px-6 py-3 rounded-lg opacity-50 cursor-not-allowed"
                disabled
              >
                {t('common.coming_soon')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

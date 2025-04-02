
export const ComingSoonSections = () => {
  const products = [
    { name: 'Maternity Dresses', image: '/images/pregnancy/maternity-dress.jpg' },
    { name: 'Healthy Snacks', image: '/images/pregnancy/healthy-snacks.jpg' },
    { name: 'Prenatal Vitamins', image: '/images/pregnancy/prenatal-vitamins.jpg' },
  ];

  return (
    <>
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">NauMah E-commerce Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-2">Coming Soon</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-purple-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Doctor Consultation</h2>
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="w-24 h-24 bg-primary-light rounded-full mx-auto mb-6 flex items-center justify-center">
              <i className="fas fa-stethoscope text-3xl text-primary"></i>
            </div>
            <h3 className="text-xl font-semibold mb-4">Expert Medical Consultations</h3>
            <p className="text-gray-600 mb-6">
              Connect with experienced gynecologists and pregnancy specialists. Coming soon!
            </p>
            <button
              className="bg-primary text-white px-6 py-3 rounded-lg opacity-50 cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

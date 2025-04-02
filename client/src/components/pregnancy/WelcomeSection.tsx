import React from 'react';

export default function WelcomeSection() {
  return (
    <section className="bg-gradient-to-b from-pink-50 to-white py-16"> {/* Changed background colors */}
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-pink-600 mb-6"> {/* Changed text color */}
              Your AI-Powered Pregnancy Journey Companion
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Navigate your pregnancy journey with personalized AI guidance, tracking tools, and expert insights.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <img 
                src="https://images.unsplash.com/photo-1538678867871-8a43e7487746"
                alt="Pregnancy Journey"
                className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border-2 border-pink-100"
              />
              <img 
                src="/images/pregnancy/prenatal-care.jpg" 
                alt="Prenatal Care"
                className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border-2 border-pink-100"
              />
              <img 
                src="/images/pregnancy/healthy-lifestyle.jpg" 
                alt="Healthy Lifestyle"
                className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border-2 border-pink-100"
              />
            </div>
          </div>
          <div className="relative">
            <img
              src="/images/pregnancy/hero-pregnant-woman-unsplash.jpg"
              alt="Pregnancy Journey"
              className="w-full h-[600px] object-cover rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
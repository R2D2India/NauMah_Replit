import React from 'react';

export default function WelcomeSection() {
  return (
    <section className="bg-gradient-to-b from-pink-50 to-white py-16"> {/* Changed background colors */}
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-3xl md:text-[2.75rem] font-montserrat font-bold text-pink-600 mb-6 leading-tight tracking-tight"> {/* Refined styling */}
              Your Intelligent Companion 
              <span className="block mt-1">for Every Stage of Pregnancy</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Navigate your pregnancy journey with personalized AI guidance, tracking tools, and expert insights.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <img 
                src="/images/pregnancy/prenatal-care-check.jpg" 
                alt="Prenatal Care"
                className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border-2 border-pink-100"
              />
              <img 
                src="/images/pregnancy/healthy-lifestyle.jpg" 
                alt="Healthy Lifestyle"
                className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 border-2 border-pink-100"
                loading="eager"
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
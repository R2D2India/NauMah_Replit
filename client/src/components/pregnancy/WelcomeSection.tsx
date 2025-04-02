
import React from 'react';

export default function WelcomeSection() {
  return (
    <section className="bg-gradient-to-b from-purple-50 to-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-primary mb-6">
              Your AI-Powered Pregnancy Journey Companion
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Navigate your pregnancy journey with personalized AI guidance, tracking tools, and expert insights.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <img 
                src="/images/pregnancy/prenatal-care.jpg" 
                alt="Prenatal Care"
                className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
              />
              <img 
                src="/images/pregnancy/healthy-lifestyle.jpg" 
                alt="Healthy Lifestyle"
                className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
              />
            </div>
          </div>
          <div className="relative">
            <img
              src="/images/pregnancy/hero-pregnant-woman.jpg"
              alt="Pregnancy Journey"
              className="w-full h-[600px] object-cover rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

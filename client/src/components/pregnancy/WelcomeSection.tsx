
import React from 'react';

export default function WelcomeSection() {
  return (
    <section className="bg-gradient-to-b from-purple-50 to-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-primary mb-6">
              Your AI-Powered Pregnancy Journey Companion
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Navigate your pregnancy journey with personalized AI guidance, tracking tools, and expert insights.
            </p>
          </div>
          <div className="relative">
            <img
              src="/images/hero-pregnant-woman.svg"
              alt="Pregnancy Journey"
              className="w-full max-w-md mx-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

import React from 'react';

export default function WelcomeSection() {
  return (
    <section className="bg-gradient-to-b from-purple-50 to-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-primary mb-6">
            Your AI-Powered Pregnancy Journey Companion
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Navigate your pregnancy journey with personalized AI guidance, tracking tools, and expert insights.
          </p>
        </div>
      </div>
    </section>
  );
}
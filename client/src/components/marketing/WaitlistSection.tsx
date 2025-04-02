import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Confetti from 'react-confetti';
import { apiRequest } from '@/lib/queryClient';
import useWindowSize from 'react-use/lib/useWindowSize';

export const WaitlistSection = () => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '' });
  const [confettiConfig, setConfettiConfig] = useState({ numberOfPieces: 0, recycle: false }); // Added state for confetti config
  const { toast } = useToast();
  const { width, height } = useWindowSize();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      toast({
        title: 'Thank you for joining our waitlist!',
        description: 'Team NauMah will contact you soon!',
      });
      setConfettiConfig({ numberOfPieces: 500, recycle: true });
      setShowConfetti(true);
      setTimeout(() => {
        setConfettiConfig({ numberOfPieces: 0, recycle: false });
        setTimeout(() => setShowConfetti(false), 1000);
      }, 3000);
      setFormData({ name: '', mobile: '', email: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to join waitlist. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="py-12 bg-gradient-to-r from-purple-100 to-pink-100">
      {showConfetti && <Confetti 
        width={width}
        height={height}
        {...confettiConfig} // Apply confettiConfig
        colors={['#FFD700', '#DAA520', '#FFC107', '#FFB74D', '#FFA500']}
        gravity={0.15}
        tweenDuration={8000}
        confettiSource={{x: width/2, y: height/2}}
        initialVelocityY={15}
        wind={0.01}
      />}
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Join Our Waitlist</h2>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <input
            type="text"
            placeholder="Name"
            className="w-full p-3 rounded-lg border"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            type="tel"
            placeholder="Mobile"
            className="w-full p-3 rounded-lg border"
            value={formData.mobile}
            onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg border"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition"
          >
            Join Waitlist
          </button>
        </form>
      </div>
    </section>
  );
};
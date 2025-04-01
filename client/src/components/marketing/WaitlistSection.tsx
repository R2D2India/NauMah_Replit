
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Confetti from 'react-confetti';
import { apiRequest } from '@/lib/queryClient';

export const WaitlistSection = () => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '' });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      setFormData({ name: '', mobile: '', email: '' });
      toast({
        title: 'Success!',
        description: 'You have been added to our waitlist.',
      });
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
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} colors={['#FFD700', '#FFA500']} />}
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

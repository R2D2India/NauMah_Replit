import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardContent className="p-6 space-y-6">
            <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Agreement to Terms</h2>
              <p>By accessing or using NauMah AI Technologies Pvt. Ltd. ("NauMah," "we," "us," or "our") services, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our services.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Company Information</h2>
              <div className="space-y-2">
                <p><strong>India Office:</strong><br />NauMah AI Technologies Pvt. Ltd.<br />OneBKC, BKC<br />Mumbai - 400053, India</p>
                <p><strong>USA Office:</strong><br />Woodbridge Park<br />Virginia, USA 22192</p>
                <p><strong>Contact Information:</strong><br />Support: support@naumah.com<br />Business Inquiries: hypeme@naumah.com</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Services Description</h2>
              <p>NauMah provides AI-powered pregnancy companion services, including but not limited to pregnancy tracking, health monitoring, and personalized recommendations. These services are intended for informational purposes only and should not replace professional medical advice.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account</li>
                <li>Not misuse or abuse our services</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not share sensitive medical information through unsecured channels</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Intellectual Property</h2>
              <p>All content, features, and functionality of our services are owned by NauMah AI Technologies Pvt. Ltd. and are protected by international copyright, trademark, and other intellectual property laws.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Limitation of Liability</h2>
              <p>NauMah shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use our services.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Indemnification</h2>
              <p>You agree to indemnify, defend, and hold harmless NauMah AI Technologies Pvt. Ltd., its officers, directors, employees, agents, licensors, and suppliers from and against all losses, expenses, damages, and costs, including reasonable attorneys' fees, resulting from:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your violation of these Terms of Service</li>
                <li>Your use or misuse of our services</li>
                <li>Your violation of any rights of a third party</li>
                <li>Your violation of any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Modifications</h2>
              <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to our website. Your continued use of our services constitutes acceptance of modified terms.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Termination</h2>
              <p>We may terminate or suspend your access to our services immediately, without prior notice, for any breach of these Terms of Service.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Governing Law</h2>
              <p>These terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
            </section>

            <section className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
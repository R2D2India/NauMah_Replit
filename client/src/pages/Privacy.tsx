
import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardContent className="p-6 space-y-6">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
            
            <section className="space-y-4">
              <p className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
              
              <div className="space-y-2">
                <p>This Privacy Policy describes how NauMah AI Technologies Pvt. Ltd. ("NauMah," "we," "us," or "our") collects, uses, and shares your personal information when you use our services.</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Contact Information</h2>
              <div className="space-y-2">
                <p><strong>India Office:</strong><br />NauMah AI Technologies Pvt. Ltd.<br />OneBKC, BKC<br />Mumbai - 400053, India</p>
                <p><strong>USA Office:</strong><br />Woodbridge Park<br />Virginia, USA 22192</p>
                <p><strong>Email:</strong><br />Support: support@naumah.com<br />Business Inquiries: hypeme@naumah.com</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Information We Collect</h2>
              <div className="space-y-2">
                <p>We collect information that you provide directly to us, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Account information (name, email, password)</li>
                  <li>Health and pregnancy-related information</li>
                  <li>Usage data and interaction with our services</li>
                  <li>Device information and analytics</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
              <div className="space-y-2">
                <p>We use the collected information to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and improve our services</li>
                  <li>Personalize your experience</li>
                  <li>Communicate with you about our services</li>
                  <li>Ensure the security of our platform</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Data Sharing and Disclosure</h2>
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Service providers and business partners</li>
                <li>Legal authorities when required by law</li>
                <li>Third parties with your consent</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Cookies and Tracking</h2>
              <p>We use cookies and similar tracking technologies to enhance your experience and collect usage data. You can control cookie settings through your browser preferences.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Indemnification</h2>
              <p>You agree to indemnify, defend, and hold harmless NauMah AI Technologies Pvt. Ltd., its officers, directors, employees, agents, and affiliates from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees) arising from:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use of and access to our services</li>
                <li>Your violation of any terms of this Privacy Policy</li>
                <li>Your violation of any third party rights, including without limitation any copyright, property, or privacy right</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
            </section>

            <section className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">If you have any questions about this Privacy Policy, please contact us at support@naumah.com</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

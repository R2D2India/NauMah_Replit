
import { Card, CardContent } from "@/components/ui/card";

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardContent className="p-6 space-y-6">
            <h1 className="text-3xl font-bold mb-8">Medical Disclaimer</h1>

            <section className="space-y-4">
              <p className="font-medium text-red-600">IMPORTANT: READ THIS DISCLAIMER CAREFULLY BEFORE USING NAUMAH</p>
              
              <p>The information provided by NauMah AI Technologies Pvt. Ltd. ("NauMah," "we," "us," or "our") through our application, website, AI assistants, and related services is for general informational and educational purposes only. This information is not intended to be and should not be taken as medical advice.</p>

              <h2 className="text-2xl font-semibold">Not a Substitute for Professional Medical Care</h2>
              <p>NauMah is designed to provide general pregnancy-related information and support. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician, obstetrician, or other qualified healthcare provider with any questions you may have regarding your pregnancy, a medical condition, or treatment.</p>

              <h2 className="text-2xl font-semibold">Emergency Situations</h2>
              <p>Never disregard professional medical advice or delay seeking it because of something you have read or heard on NauMah. If you think you may have a medical emergency, call your doctor or emergency services immediately.</p>

              <h2 className="text-2xl font-semibold">AI-Generated Content</h2>
              <p>Our AI assistants provide general information based on available data. While we strive for accuracy, AI-generated responses should not be considered as medical opinions or diagnoses. Verify all information with healthcare professionals.</p>

              <h2 className="text-2xl font-semibold">No Doctor-Patient Relationship</h2>
              <p>Using NauMah does not create a doctor-patient relationship. Our AI assistants and content creators are not licensed medical professionals.</p>

              <h2 className="text-2xl font-semibold">Individual Circumstances</h2>
              <p>Every pregnancy is unique. Information provided may not apply to your specific situation. Always consult your healthcare provider about your individual circumstances.</p>

              <h2 className="text-2xl font-semibold">Limitation of Liability</h2>
              <p>By using NauMah, you expressly agree that NauMah AI Technologies Pvt. Ltd., its employees, contributors, and AI systems are not responsible for any decisions you make based on the information provided. We are not liable for any damages or harm resulting from your use or reliance on our services.</p>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="font-medium">Company Information:</p>
                <p>NauMah AI Technologies Pvt. Ltd.<br />
                India Office: OneBKC, BKC, Mumbai - 400053<br />
                USA Office: Woodbridge Park, Virginia, USA 22192<br />
                Contact: support@naumah.com, hypeme@naumah.com</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

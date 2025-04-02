
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Building2, Phone } from "lucide-react";

export default function Support() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12 text-primary">Contact & Support</h1>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="p-6">
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Building2 className="h-6 w-6" />
                <h2 className="text-2xl font-semibold">Our Mission</h2>
              </div>
              <p className="text-neutral-dark">
                At NauMah AI Technologies, we're dedicated to revolutionizing pregnancy care through innovative AI solutions. 
                Our mission is to empower expectant mothers with personalized guidance, making pregnancy journey safer and more informed. 
                We understand the challenges women face during pregnancy and are committed to providing 24/7 AI-powered support.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Mail className="h-6 w-6" />
                <h2 className="text-2xl font-semibold">Contact Us</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">India Headquarters:</p>
                    <p className="text-neutral-dark">NauMah AI Technologies Pvt. Ltd.<br />OneBKC, BKC<br />Mumbai - 400053, India</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">USA Office:</p>
                    <p className="text-neutral-dark">Woodbridge Park<br />Virginia, USA 22192</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Email:</p>
                    <p className="text-neutral-dark">
                      Support: <a href="mailto:support@naumah.com" className="text-primary hover:underline">support@naumah.com</a><br />
                      Business: <a href="mailto:hypeme@naumah.com" className="text-primary hover:underline">hypeme@naumah.com</a>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

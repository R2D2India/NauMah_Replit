
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Building2, Phone, Heart, Globe2, MessageSquareHeart } from "lucide-react";

export default function Support() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <MessageSquareHeart className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-primary mb-4">Contact & Support</h1>
          <p className="text-neutral-dark text-lg">We're here to help you on your pregnancy journey</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Heart className="h-8 w-8" />
                <h2 className="text-2xl font-semibold">Our Mission</h2>
              </div>
              <p className="text-neutral-dark leading-relaxed">
                At NauMah AI Technologies, we're dedicated to revolutionizing pregnancy care through innovative AI solutions. 
                Our mission is to empower expectant mothers with personalized guidance, making pregnancy journey safer and more informed. 
                We understand the challenges women face during pregnancy and are committed to providing 24/7 AI-powered support.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Globe2 className="h-8 w-8" />
                <h2 className="text-2xl font-semibold">Contact Us</h2>
              </div>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">India Headquarters:</p>
                    <p className="text-neutral-dark">NauMah AI Technologies Pvt. Ltd.<br />OneBKC, BKC<br />Mumbai - 400053, India</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">USA Office:</p>
                    <p className="text-neutral-dark">Woodbridge Park<br />Virginia, USA 22192</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Email Us:</p>
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

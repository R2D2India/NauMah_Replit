
import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardContent className="p-6 space-y-6">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
            {/* Privacy policy content... */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

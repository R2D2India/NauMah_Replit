import { SafetyChecker } from "./SafetyChecker";
import { ShieldCheck, Pill, Apple } from "lucide-react";

export function SafetyCheckerSection() {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="relative text-center mb-8">
        {/* Stylized section heading */}
        <div className="inline-flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">Food & Medication Safety</h2>
        </div>
        
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Easily check if food or medication is safe during your pregnancy journey
        </p>
        
        {/* Decorative elements */}
        <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 opacity-10 hidden lg:block">
          <Pill className="h-20 w-20 text-primary rotate-12" />
        </div>
        <div className="absolute -right-8 bottom-0 opacity-10 hidden lg:block">
          <Apple className="h-16 w-16 text-primary -rotate-12" />
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-white to-primary/5 backdrop-blur rounded-xl shadow-md overflow-hidden border border-primary/10">
        <div className="p-1">
          <SafetyChecker />
        </div>
      </div>
    </div>
  );
}
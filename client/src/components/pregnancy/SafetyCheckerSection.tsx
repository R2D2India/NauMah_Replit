import { SafetyChecker } from "./SafetyChecker";

export function SafetyCheckerSection() {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Food & Medication Safety</h2>
        <p className="text-muted-foreground">
          Easily check if food or medication is safe during pregnancy
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <SafetyChecker />
      </div>
    </div>
  );
}
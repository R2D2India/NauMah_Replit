import { useState } from "react";
import { 
  DIET_RECOMMENDATIONS, 
  EXERCISE_RECOMMENDATIONS, 
  TEST_RECOMMENDATIONS, 
  COMMON_SYMPTOMS, 
  RESOURCE_RECOMMENDATIONS, 
  getTrimeasterFromWeek 
} from "@/lib/constants";

interface TabbedContentProps {
  currentWeek: number;
}

const TabbedContent = ({ currentWeek }: TabbedContentProps) => {
  const [activeTab, setActiveTab] = useState("diet");
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false);
  const [mealPlan, setMealPlan] = useState<{
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  } | null>(null);

  const handleGenerateMealPlan = async () => {
    try {
      setIsGeneratingMealPlan(true);
      const response = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentWeek }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate meal plan");
      }

      const data = await response.json();
      setMealPlan(data);
    } catch (error) {
      console.error("Error generating meal plan:", error);
    } finally {
      setIsGeneratingMealPlan(false);
    }
  };

  // Get trimester for recommendations
  const trimester = getTrimeasterFromWeek(currentWeek);

  // Get recommendations based on trimester
  const dietRecs = DIET_RECOMMENDATIONS[trimester];
  const exerciseRecs = EXERCISE_RECOMMENDATIONS[trimester];
  const testRecs = TEST_RECOMMENDATIONS[trimester];
  const symptoms = COMMON_SYMPTOMS[trimester];

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl overflow-hidden custom-shadow">
        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto bg-neutral-light">
          <button 
            className={`tab-btn flex-none py-3 px-5 font-montserrat font-medium transition-all duration-300 ease-in-out ${activeTab === "diet" 
              ? "text-primary border-b-2 border-primary scale-105 bg-primary/5" 
              : "text-neutral-dark hover:text-primary hover:bg-primary/5 border-b-2 border-transparent"}`}
            onClick={() => setActiveTab("diet")}
          >
            <i className="fas fa-apple-alt mr-2"></i>Diet
          </button>
          <button 
            className={`tab-btn flex-none py-3 px-5 font-montserrat font-medium ${activeTab === "exercise" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-dark hover:text-primary border-b-2 border-transparent"}`}
            onClick={() => setActiveTab("exercise")}
          >
            <i className="fas fa-running mr-2"></i>Exercise
          </button>
          <button 
            className={`tab-btn flex-none py-3 px-5 font-montserrat font-medium ${activeTab === "tests" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-dark hover:text-primary border-b-2 border-transparent"}`}
            onClick={() => setActiveTab("tests")}
          >
            <i className="fas fa-vial mr-2"></i>Tests
          </button>
          <button 
            className={`tab-btn flex-none py-3 px-5 font-montserrat font-medium ${activeTab === "symptoms" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-dark hover:text-primary border-b-2 border-transparent"}`}
            onClick={() => setActiveTab("symptoms")}
          >
            <i className="fas fa-notes-medical mr-2"></i>Symptoms
          </button>
          <button 
            className={`tab-btn flex-none py-3 px-5 font-montserrat font-medium ${activeTab === "resources" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-dark hover:text-primary border-b-2 border-transparent"}`}
            onClick={() => setActiveTab("resources")}
          >
            <i className="fas fa-book mr-2"></i>Resources
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Diet Tab Content */}
          {activeTab === "diet" && (
            <div>
              <h3 className="text-xl font-montserrat font-bold text-primary mb-4">Recommended Diet for Week {currentWeek}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-light rounded-lg p-4">
                  <h4 className="font-montserrat font-medium text-lg mb-3">Focus Nutrients</h4>
                  <ul className="space-y-3">
                    {dietRecs.focusNutrients.map((nutrient, index) => (
                      <li key={index} className="flex">
                        <div className="h-6 w-6 rounded-full bg-primary-light flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mr-3">{index + 1}</div>
                        <div>
                          <span className="font-medium">{nutrient.name}</span>
                          <p className="text-sm text-neutral-dark">{nutrient.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-neutral-light rounded-lg p-4">
                  <h4 className="font-montserrat font-medium text-lg mb-3">Sample Meal Plan</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-primary-dark">Breakfast</div>
                      <p className="text-sm">{dietRecs.sampleMealPlan.breakfast}</p>
                    </div>
                    <div>
                      <div className="font-medium text-primary-dark">Lunch</div>
                      <p className="text-sm">{dietRecs.sampleMealPlan.lunch}</p>
                    </div>
                    <div>
                      <div className="font-medium text-primary-dark">Dinner</div>
                      <p className="text-sm">{dietRecs.sampleMealPlan.dinner}</p>
                    </div>
                    <div>
                      <div className="font-medium text-primary-dark">Snacks</div>
                      <p className="text-sm">{dietRecs.sampleMealPlan.snacks}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-secondary-light rounded-lg border border-secondary">
                <div className="flex items-start">
                  <i className="fas fa-lightbulb text-primary mt-1 mr-3"></i>
                  <div>
                    <h4 className="font-montserrat font-medium">Personalized Tip</h4>
                    <p className="text-sm">At {currentWeek} weeks, your baby is developing rapidly. Try adding an extra serving of leafy greens daily to boost your iron intake naturally. Iron is crucial during this period of your pregnancy.</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <button 
                  className="bg-primary hover:bg-primary-dark text-white py-2 px-6 rounded-lg font-montserrat font-medium transition duration-300"
                  onClick={async () => {
                    try {
                      setIsGeneratingMealPlan(true);
                      const response = await fetch('/api/meal-plan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ currentWeek })
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to generate meal plan');
                      }
                      
                      const data = await response.json();
                      setMealPlan(data);
                    } catch (err) {
                      console.error("Error generating meal plan:", err);
                    } finally {
                      setIsGeneratingMealPlan(false);
                    }
                  }}
                  disabled={isGeneratingMealPlan}
                >
                  {isGeneratingMealPlan ? "Generating..." : "Generate Complete Meal Plan"}
                </button>
                {mealPlan && (
                  <div>
                    <h3>Generated Meal Plan:</h3>
                    <p>Breakfast: {mealPlan.breakfast}</p>
                    <p>Lunch: {mealPlan.lunch}</p>
                    <p>Dinner: {mealPlan.dinner}</p>
                    <p>Snacks: {mealPlan.snacks.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exercise Tab Content */}
          {activeTab === "exercise" && (
            <div>
              <h3 className="text-xl font-montserrat font-bold text-primary mb-4">Safe Exercises for Week {currentWeek}</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {exerciseRecs.map((exercise, index) => (
                  <div key={index} className="bg-neutral-light rounded-lg p-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary-light mx-auto mb-3 flex items-center justify-center">
                      <i className={`fas fa-${exercise.icon} text-white text-xl`}></i>
                    </div>
                    <h4 className="font-montserrat font-medium">{exercise.name}</h4>
                    <p className="text-sm text-neutral-dark">{exercise.duration}</p>
                  </div>
                ))}
              </div>

              <div className="bg-neutral-light rounded-lg p-4 mb-6">
                <h4 className="font-montserrat font-medium text-lg mb-3">Exercise Guidelines</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                    <span>Stay hydrated before, during, and after exercise</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                    <span>Wear comfortable, supportive shoes and clothing</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                    <span>Avoid exercises that require lying flat on your back</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                    <span>Listen to your body and stop if you feel discomfort</span>
                  </li>
                </ul>
              </div>

              <div className="bg-secondary-light rounded-lg p-4 border border-secondary mb-5">
                <div className="flex items-start">
                  <i className="fas fa-exclamation-circle text-yellow-500 mt-1 mr-3 text-lg"></i>
                  <div>
                    <h4 className="font-montserrat font-medium">Important Note</h4>
                    <p className="text-sm">Always consult with your healthcare provider before starting or modifying any exercise routine during pregnancy.</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button className="bg-primary hover:bg-primary-dark text-white py-2 px-6 rounded-lg font-montserrat font-medium transition duration-300">
                  View Exercise Videos
                </button>
              </div>
            </div>
          )}

          {/* Tests Tab Content */}
          {activeTab === "tests" && (
            <div>
              <h3 className="text-xl font-montserrat font-bold text-primary mb-4">Recommended Tests for Week {currentWeek}</h3>

              <div className="mb-6 bg-neutral-light rounded-lg p-4">
                <h4 className="font-montserrat font-medium text-lg mb-3">Key Tests This Period</h4>
                <div className="space-y-4">
                  {testRecs.map((test, index) => (
                    <div key={index} className="flex items-start">
                      <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white text-sm font-bold mr-4">
                        <i className={`fas fa-${test.icon}`}></i>
                      </div>
                      <div>
                        <h5 className="font-medium">{test.name}</h5>
                        <p className="text-sm text-neutral-dark">{test.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-light rounded-lg p-4 mb-5">
                <h4 className="font-montserrat font-medium text-lg mb-3">Questions to Ask Your Doctor</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <i className="fas fa-question-circle text-primary mt-1 mr-2"></i>
                    <span>What specific information will these tests provide?</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-question-circle text-primary mt-1 mr-2"></i>
                    <span>How should I prepare for these tests?</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-question-circle text-primary mt-1 mr-2"></i>
                    <span>Are there any other tests I should consider at this stage?</span>
                  </li>
                </ul>
              </div>

              <div className="text-center">
                <button className="bg-primary hover:bg-primary-dark text-white py-2 px-6 rounded-lg font-montserrat font-medium transition duration-300">
                  Track My Test Results
                </button>
              </div>
            </div>
          )}

          {/* Symptoms Tab Content */}
          {activeTab === "symptoms" && (
            <div>
              <h3 className="text-xl font-montserrat font-bold text-primary mb-4">Common Symptoms in Week {currentWeek}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-neutral-light rounded-lg p-4">
                  <h4 className="font-montserrat font-medium text-lg mb-3">Physical Symptoms</h4>
                  <div className="space-y-3">
                    {symptoms.slice(0, Math.ceil(symptoms.length / 2)).map((symptom, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{symptom.name}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i key={i} className={`fas fa-circle text-xs ${i < symptom.severity ? 'text-primary' : 'text-neutral'}`}></i>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-neutral-dark">{symptom.remedy}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-light rounded-lg p-4">
                  <h4 className="font-montserrat font-medium text-lg mb-3">Emotional Changes</h4>
                  <div className="space-y-3">
                    {[
                      { name: "Mood Swings", severity: 2, remedy: "Practice relaxation techniques and get adequate rest." },
                      { name: "Anxiety About Baby", severity: 3, remedy: "Talk to your partner or join a pregnancy support group." },
                      { name: "Forgetfulness", severity: 1, remedy: "Use notes apps or journals to keep track of important things." }
                    ].map((symptom, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{symptom.name}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i key={i} className={`fas fa-circle text-xs ${i < symptom.severity ? 'text-primary' : 'text-neutral'}`}></i>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-neutral-dark">{symptom.remedy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-secondary-light rounded-lg p-4 border border-secondary mb-5">
                <div className="flex items-start">
                  <i className="fas fa-exclamation-triangle text-red-500 mt-1 mr-3"></i>
                  <div>
                    <h4 className="font-montserrat font-medium">When to Contact Your Doctor</h4>
                    <p className="text-sm mb-2">Call your healthcare provider immediately if you experience:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Severe abdominal pain or cramping</li>
                      <li>• Vaginal bleeding or fluid leakage</li>
                      <li>• Severe headache or visual changes</li>
                      <li>• Decreased fetal movement</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button className="bg-primary hover:bg-primary-dark text-white py-2 px-6 rounded-lg font-montserrat font-medium transition duration-300">
                  Track My Symptoms
                </button>
              </div>
            </div>
          )}

          {/* Resources Tab Content */}
          {activeTab === "resources" && (
            <div>
              <h3 className="text-xl font-montserrat font-bold text-primary mb-4">Recommended Resources for Week {currentWeek}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-neutral-light rounded-lg p-4">
                  <h4 className="font-montserrat font-medium text-lg mb-3">
                    <i className="fas fa-book mr-2 text-primary"></i>Book Recommendations
                  </h4>
                  <ul className="space-y-3">
                    {RESOURCE_RECOMMENDATIONS.books.map((book, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-16 h-20 bg-gray-300 rounded shadow mr-3 flex items-center justify-center text-gray-500">
                          <i className="fas fa-book text-2xl"></i>
                        </div>
                        <div>
                          <h5 className="font-medium">{book.title}</h5>
                          <p className="text-sm text-neutral-dark">By {book.author}</p>
                          <div className="flex text-yellow-500 text-xs mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i key={i} className={`fas ${i < Math.floor(book.rating) ? 'fa-star' : i < book.rating ? 'fa-star-half-alt' : 'far fa-star'}`}></i>
                            ))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-neutral-light rounded-lg p-4">
                  <h4 className="font-montserrat font-medium text-lg mb-3">
                    <i className="fas fa-film mr-2 text-primary"></i>Movie & Documentary Suggestions
                  </h4>
                  <ul className="space-y-3">
                    {RESOURCE_RECOMMENDATIONS.movies.map((movie, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-16 h-20 bg-gray-300 rounded shadow mr-3 flex items-center justify-center text-gray-500">
                          <i className="fas fa-film text-2xl"></i>
                        </div>
                        <div>
                          <h5 className="font-medium">{movie.title}</h5>
                          <p className="text-sm text-neutral-dark">{movie.type}, {movie.year}</p>
                          <div className="flex text-yellow-500 text-xs mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i key={i} className={`fas ${i < Math.floor(movie.rating) ? 'fa-star' : i < movie.rating ? 'fa-star-half-alt' : 'far fa-star'}`}></i>
                            ))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-neutral-light rounded-lg p-4 mb-5">
                <h4 className="font-montserrat font-medium text-lg mb-3">
                  <i className="fas fa-podcast mr-2 text-primary"></i>Podcasts for Parents-to-Be
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {RESOURCE_RECOMMENDATIONS.podcasts.map((podcast, index) => (
                    <div key={index} className="flex items-start">
                      <div className="h-10 w-10 rounded-full bg-primary-light flex-shrink-0 flex items-center justify-center mr-3">
                        <i className="fas fa-microphone-alt text-white"></i>
                      </div>
                      <div>
                        <h5 className="font-medium">{podcast.title}</h5>
                        <p className="text-sm text-neutral-dark">{podcast.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <button className="bg-primary hover:bg-primary-dark text-white py-2 px-6 rounded-lg font-montserrat font-medium transition duration-300">
                  Discover More Resources
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabbedContent;
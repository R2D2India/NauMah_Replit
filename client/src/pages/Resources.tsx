
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";

export default function Resources() {
  const { data: resources = {
    articles: [],
    faqs: []
  } } = useQuery({
    queryKey: ["/api/resources"],
    queryFn: async () => {
      const response = await fetch("/api/resources");
      if (!response.ok) {
        return {
          articles: [
            {
              title: "First Trimester Guide",
              description: "Essential information for weeks 1-12",
              content: "The first trimester is crucial for your baby's development...",
              image: "https://images.unsplash.com/photo-1584582397869-37bb5d7bc1b6?w=800&auto=format&fit=crop"
            },
            {
              title: "Nutrition During Pregnancy",
              description: "Healthy eating guidelines for expecting mothers",
              content: "Maintaining a balanced diet is essential during pregnancy...",
              image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop"
            }
          ],
          faqs: [
            {
              question: "What foods should I avoid during pregnancy?",
              answer: "During pregnancy, it's important to avoid: raw or undercooked meat..."
            },
            {
              question: "How much weight should I gain?",
              answer: "The recommended weight gain during pregnancy varies based on your starting BMI..."
            }
          ]
        };
      }
      return response.json();
    }
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Pregnancy Resources</h1>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {resources.articles.map((article: { image: string; title: string; description: string; content: string }, index: number) => (
          <Card key={index}>
            <img src={article.image} alt={article.title} className="w-full h-48 object-cover rounded-t-lg" />
            <CardHeader>
              <CardTitle>{article.title}</CardTitle>
              <CardDescription>{article.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{article.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center mr-3 shadow-md">
              <i className="fas fa-question-circle text-white"></i>
            </div>
            <CardTitle className="text-2xl text-primary">
              Frequently Asked Questions
            </CardTitle>
          </div>
          <CardDescription className="mt-2">
            Find answers to common questions about pregnancy, our app features, and support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex space-x-4 mb-3 overflow-x-auto py-2">
              <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium flex-shrink-0 shadow-sm hover:shadow-md transition-all duration-300">
                All Questions
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex-shrink-0 hover:bg-gray-200 transition-all duration-300">
                First Trimester
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex-shrink-0 hover:bg-gray-200 transition-all duration-300">
                Second Trimester
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex-shrink-0 hover:bg-gray-200 transition-all duration-300">
                Third Trimester
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex-shrink-0 hover:bg-gray-200 transition-all duration-300">
                Nutrition
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex-shrink-0 hover:bg-gray-200 transition-all duration-300">
                App Features
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Search for questions..." 
              className="w-full py-3 px-5 pl-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <i className="fas fa-search"></i>
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-primary flex items-center mb-2">
              <i className="fas fa-lightbulb mr-2"></i>
              Featured Questions
            </h3>
            <p className="text-sm text-gray-600">
              These are the most common questions from expecting mothers at various stages of pregnancy.
            </p>
          </div>
          
          <Accordion type="single" collapsible className="border rounded-xl overflow-hidden">
            {/* Add the existing FAQs */}
            {resources.faqs.map((faq: { question: string; answer: string }, index: number) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-0">
                <AccordionTrigger className="px-4 py-4 hover:bg-gray-50 text-left font-medium">
                  <div className="flex items-start">
                    <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-3 flex-shrink-0">
                      Q
                    </span>
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-3 bg-gray-50">
                  <div className="flex items-start ml-9">
                    <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-3 flex-shrink-0">
                      A
                    </span>
                    <p className="text-neutral-dark">{faq.answer}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            
            {/* Add comprehensive pregnancy FAQs */}
            <AccordionItem value="comprehensive-1" className="border-b">
              <AccordionTrigger className="px-4 py-4 hover:bg-gray-50 text-left font-medium">
                <div className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-3 flex-shrink-0">
                    Q
                  </span>
                  <span>When should I first see a doctor during pregnancy?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 bg-gray-50">
                <div className="flex items-start ml-9">
                  <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-3 flex-shrink-0">
                    A
                  </span>
                  <p className="text-neutral-dark">
                    You should schedule your first prenatal visit as soon as you know you're pregnant, ideally within the first 8 weeks. 
                    If you have a history of complications or medical conditions, you may need to see a doctor earlier. 
                    During this first visit, your doctor will confirm your pregnancy, estimate your due date, and begin monitoring your health.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="comprehensive-2" className="border-b">
              <AccordionTrigger className="px-4 py-4 hover:bg-gray-50 text-left font-medium">
                <div className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-3 flex-shrink-0">
                    Q
                  </span>
                  <span>How can I manage morning sickness?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 bg-gray-50">
                <div className="flex items-start ml-9">
                  <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-3 flex-shrink-0">
                    A
                  </span>
                  <div className="text-neutral-dark space-y-2">
                    <p>Morning sickness can be managed with several strategies:</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Eat small, frequent meals throughout the day</li>
                      <li>Avoid triggers like strong smells or spicy foods</li>
                      <li>Try ginger tea, ginger candies or vitamin B6 supplements</li>
                      <li>Stay hydrated by sipping water throughout the day</li>
                      <li>Eat plain crackers before getting out of bed in the morning</li>
                    </ul>
                    <p>If your morning sickness is severe (hyperemesis gravidarum), consult your healthcare provider as you may need medication or IV fluids.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="comprehensive-3" className="border-b">
              <AccordionTrigger className="px-4 py-4 hover:bg-gray-50 text-left font-medium">
                <div className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-3 flex-shrink-0">
                    Q
                  </span>
                  <span>Is it safe to exercise during pregnancy?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 bg-gray-50">
                <div className="flex items-start ml-9">
                  <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-3 flex-shrink-0">
                    A
                  </span>
                  <div className="text-neutral-dark space-y-2">
                    <p>
                      Yes, exercise is generally safe and beneficial during pregnancy for most women. The American College of Obstetricians and Gynecologists recommends 150 minutes of moderate-intensity aerobic activity per week.
                    </p>
                    <p>Safe exercises include:</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Walking</li>
                      <li>Swimming</li>
                      <li>Stationary cycling</li>
                      <li>Low-impact aerobics</li>
                      <li>Prenatal yoga</li>
                    </ul>
                    <p>
                      Avoid high-impact activities, contact sports, exercises with a high risk of falling, and activities that require lying flat on your back after the first trimester. Always consult with your healthcare provider before starting or continuing an exercise program during pregnancy.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="comprehensive-4" className="border-b">
              <AccordionTrigger className="px-4 py-4 hover:bg-gray-50 text-left font-medium">
                <div className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-3 flex-shrink-0">
                    Q
                  </span>
                  <span>How does the NauMah AI assistant work?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 bg-gray-50">
                <div className="flex items-start ml-9">
                  <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-3 flex-shrink-0">
                    A
                  </span>
                  <div className="text-neutral-dark">
                    <p>
                      The NauMah AI assistant uses advanced artificial intelligence to provide personalized pregnancy guidance. It works by:
                    </p>
                    <ul className="list-disc ml-5 space-y-1 my-2">
                      <li>Analyzing your pregnancy stage and health information</li>
                      <li>Drawing from a vast database of medical research on pregnancy</li>
                      <li>Providing stage-specific recommendations and answers</li>
                      <li>Learning from your interactions to become more personalized over time</li>
                    </ul>
                    <p>
                      You can interact with the AI through text chat or voice conversations. While our AI provides evidence-based guidance, it's designed to complement, not replace, professional medical care. Always consult healthcare providers for medical decisions.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="first-trimester" className="border-b">
              <AccordionTrigger className="px-4 py-4 hover:bg-gray-50 text-left font-medium">
                <div className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-3 flex-shrink-0">
                    Q
                  </span>
                  <span>What are the key changes during the first trimester?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 bg-gray-50">
                <div className="flex items-start ml-9">
                  <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-3 flex-shrink-0">
                    A
                  </span>
                  <div className="text-neutral-dark space-y-2">
                    <p>The first trimester (weeks 1-12) brings several significant changes:</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Morning sickness and nausea (typically peaks around week 9)</li>
                      <li>Frequent urination</li>
                      <li>Fatigue and mood changes</li>
                      <li>Breast tenderness</li>
                      <li>Food aversions and cravings</li>
                    </ul>
                    <p>This is also when major organ development occurs in your baby. Regular prenatal care is crucial during this period.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="second-trimester" className="border-b">
              <AccordionTrigger className="px-4 py-4 hover:bg-gray-50 text-left font-medium">
                <div className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-3 flex-shrink-0">
                    Q
                  </span>
                  <span>What should I expect in the second trimester?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 bg-gray-50">
                <div className="flex items-start ml-9">
                  <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-3 flex-shrink-0">
                    A
                  </span>
                  <div className="text-neutral-dark space-y-2">
                    <p>The second trimester (weeks 13-26) is often called the "golden period" of pregnancy:</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Morning sickness usually subsides</li>
                      <li>Energy levels increase</li>
                      <li>Baby's first movements felt (around week 18-20)</li>
                      <li>Visible bump appears</li>
                      <li>Gender can be determined via ultrasound</li>
                    </ul>
                    <p>This is a good time to start pregnancy exercises and prepare for the baby's arrival.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="third-trimester" className="border-b">
              <AccordionTrigger className="px-4 py-4 hover:bg-gray-50 text-left font-medium">
                <div className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-3 flex-shrink-0">
                    Q
                  </span>
                  <span>What are the challenges of the third trimester?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 bg-gray-50">
                <div className="flex items-start ml-9">
                  <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-3 flex-shrink-0">
                    A
                  </span>
                  <div className="text-neutral-dark space-y-2">
                    <p>The third trimester (weeks 27-40) brings several changes as you prepare for birth:</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Increased back pain and fatigue</li>
                      <li>Braxton Hicks contractions</li>
                      <li>Difficulty sleeping</li>
                      <li>Shortness of breath</li>
                      <li>More frequent bathroom visits</li>
                    </ul>
                    <p>Focus on birth preparation and recognize signs of labor during this period.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="nutrition" className="border-b">
              <AccordionTrigger className="px-4 py-4 hover:bg-gray-50 text-left font-medium">
                <div className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-3 flex-shrink-0">
                    Q
                  </span>
                  <span>What are the essential nutritional needs during pregnancy?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 bg-gray-50">
                <div className="flex items-start ml-9">
                  <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-3 flex-shrink-0">
                    A
                  </span>
                  <div className="text-neutral-dark space-y-2">
                    <p>Proper nutrition is crucial during pregnancy. Key requirements include:</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Folic acid (400-800 mcg daily)</li>
                      <li>Iron (27 mg daily)</li>
                      <li>Calcium (1,000 mg daily)</li>
                      <li>Protein (75-100 grams daily)</li>
                      <li>DHA omega-3 fatty acids</li>
                    </ul>
                    <p>Always take prescribed prenatal vitamins and maintain a balanced diet with plenty of fruits, vegetables, and whole grains.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="comprehensive-5" className="border-b">
              <AccordionTrigger className="px-4 py-4 hover:bg-gray-50 text-left font-medium">
                <div className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-3 flex-shrink-0">
                    Q
                  </span>
                  <span>How accurate are the due date predictions?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 bg-gray-50">
                <div className="flex items-start ml-9">
                  <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-3 flex-shrink-0">
                    A
                  </span>
                  <p className="text-neutral-dark">
                    Due date predictions in NauMah are calculated using standard medical formulas based on your last menstrual period (LMP) or ultrasound measurements. The accuracy depends on the information provided and can vary. Only about 5% of babies are born exactly on their due date, with most deliveries occurring within two weeks before or after. For the most accurate due date, combine the app's prediction with your healthcare provider's assessment based on ultrasound measurements.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-3">Don't see your question? Ask our AI assistant or contact our support team</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300">
                <i className="fas fa-robot mr-2"></i>Ask the AI Assistant
              </button>
              <button className="px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-all duration-300">
                <i className="fas fa-envelope mr-2"></i>Contact Support
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

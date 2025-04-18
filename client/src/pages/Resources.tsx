import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import ContactForm from "@/components/support/ContactForm";

export default function Resources() {
  // Add state for selected FAQ category
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [contactFormOpen, setContactFormOpen] = useState(false);
  
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
              answer: "During pregnancy, it's important to avoid: raw or undercooked meat...",
              category: "nutrition"
            },
            {
              question: "How much weight should I gain?",
              answer: "The recommended weight gain during pregnancy varies based on your starting BMI...",
              category: "nutrition"
            }
          ]
        };
      }
      return response.json();
    }
  });

  // Helper function to determine which FAQs to show based on category
  const getFAQsToShow = () => {
    const allFAQs = [
      // Existing FAQs from API
      ...resources.faqs.map((faq: any, index: number) => ({
        ...faq,
        id: `item-${index}`,
      })),
      
      // Comprehensive FAQs
      {
        id: "comprehensive-1",
        question: "When should I first see a doctor during pregnancy?",
        answer: "You should schedule your first prenatal visit as soon as you know you're pregnant, ideally within the first 8 weeks. If you have a history of complications or medical conditions, you may need to see a doctor earlier. During this first visit, your doctor will confirm your pregnancy, estimate your due date, and begin monitoring your health.",
        category: "general"
      },
      {
        id: "comprehensive-2",
        question: "How can I manage morning sickness?",
        answer: "Morning sickness can be managed with several strategies: eat small frequent meals, avoid triggers like strong smells or spicy foods, try ginger tea or supplements, stay hydrated, and eat plain crackers before getting out of bed. If severe, consult your healthcare provider.",
        category: "first-trimester"
      },
      {
        id: "comprehensive-3",
        question: "Is it safe to exercise during pregnancy?",
        answer: "Yes, exercise is generally safe and beneficial during pregnancy. The American College of Obstetricians and Gynecologists recommends 150 minutes of moderate-intensity aerobic activity per week. Safe exercises include walking, swimming, stationary cycling, low-impact aerobics, and prenatal yoga. Avoid high-impact activities and consult your healthcare provider.",
        category: "general"
      },
      {
        id: "comprehensive-4",
        question: "How does the NauMah AI assistant work?",
        answer: "The NauMah AI assistant uses advanced artificial intelligence to provide personalized pregnancy guidance by analyzing your stage and health information, drawing from medical research, providing stage-specific recommendations, and learning from your interactions to become more personalized over time.",
        category: "app-features"
      },
      {
        id: "first-trimester",
        question: "What are the key changes during the first trimester?",
        answer: "The first trimester (weeks 1-12) brings several significant changes: morning sickness and nausea (peaks around week 9), frequent urination, fatigue and mood changes, breast tenderness, and food aversions and cravings. This is also when major organ development occurs in your baby. Regular prenatal care is crucial during this period.",
        category: "first-trimester"
      },
      {
        id: "second-trimester",
        question: "What should I expect during the second trimester?",
        answer: "The second trimester (weeks 13-26) is often considered the most comfortable. Your baby bump becomes visible, morning sickness typically subsides, energy levels increase, and you may feel baby movements. This is when most women have an anatomy scan ultrasound to check the baby's development and possibly learn the sex.",
        category: "second-trimester"
      },
      {
        id: "third-trimester",
        question: "What happens in the third trimester?",
        answer: "The third trimester (weeks 27-40) is the final stretch before delivery. You'll experience more frequent prenatal visits, Braxton Hicks contractions, possible shortness of breath, back pain, trouble sleeping, and more frequent urination as the baby puts pressure on your bladder. Prepare for labor, birth, and bringing baby home during this period.",
        category: "third-trimester"
      },
      {
        id: "nutrition",
        question: "What are the most important nutrients during pregnancy?",
        answer: "Key nutrients include: folic acid (prevents neural tube defects), iron (prevents anemia), calcium (builds baby's bones and teeth), vitamin D (promotes calcium absorption), omega-3 fatty acids (supports baby's brain development), protein (crucial for baby's growth), and fiber (prevents constipation). A prenatal vitamin can help supplement these essential nutrients.",
        category: "nutrition"
      },
      {
        id: "comprehensive-5",
        question: "When will I feel my baby move?",
        answer: "Most first-time mothers feel movement (quickening) between weeks 18-25, while those who have been pregnant before may notice movement as early as week 16. Initially, movements feel like flutters, bubbles, or light taps. By the third trimester, movements become more pronounced and regular. Tracking kick counts is recommended after 28 weeks.",
        category: "second-trimester"
      }
    ];

    if (selectedCategory === "all") {
      return allFAQs;
    }
    
    return allFAQs.filter(faq => faq.category === selectedCategory);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  // Filter FAQs based on search query
  const filteredFAQs = getFAQsToShow().filter(faq => 
    searchQuery === "" || 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Pregnancy Resources</h1>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {resources.articles.map((article: any, index: number) => (
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
              <button 
                className={`px-4 py-2 ${selectedCategory === "all" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} rounded-full text-sm font-medium flex-shrink-0 shadow-sm hover:shadow-md transition-all duration-300`}
                onClick={() => handleCategoryClick("all")}
              >
                All Questions
              </button>
              <button 
                className={`px-4 py-2 ${selectedCategory === "first-trimester" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} rounded-full text-sm font-medium flex-shrink-0 hover:bg-gray-200 transition-all duration-300`}
                onClick={() => handleCategoryClick("first-trimester")}
              >
                First Trimester
              </button>
              <button 
                className={`px-4 py-2 ${selectedCategory === "second-trimester" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} rounded-full text-sm font-medium flex-shrink-0 hover:bg-gray-200 transition-all duration-300`}
                onClick={() => handleCategoryClick("second-trimester")}
              >
                Second Trimester
              </button>
              <button 
                className={`px-4 py-2 ${selectedCategory === "third-trimester" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} rounded-full text-sm font-medium flex-shrink-0 hover:bg-gray-200 transition-all duration-300`}
                onClick={() => handleCategoryClick("third-trimester")}
              >
                Third Trimester
              </button>
              <button 
                className={`px-4 py-2 ${selectedCategory === "nutrition" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} rounded-full text-sm font-medium flex-shrink-0 hover:bg-gray-200 transition-all duration-300`}
                onClick={() => handleCategoryClick("nutrition")}
              >
                Nutrition
              </button>
              <button 
                className={`px-4 py-2 ${selectedCategory === "app-features" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} rounded-full text-sm font-medium flex-shrink-0 hover:bg-gray-200 transition-all duration-300`}
                onClick={() => handleCategoryClick("app-features")}
              >
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
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <i className="fas fa-search"></i>
            </div>
          </div>
          
          {filteredFAQs.length === 0 ? (
            <div className="bg-neutral-light rounded-xl p-6 text-center">
              <h3 className="text-lg font-medium text-primary mb-2">No questions found</h3>
              <p className="text-neutral-dark">Try adjusting your search or category selection.</p>
            </div>
          ) : (
            <>
              {searchQuery && (
                <div className="bg-primary/5 rounded-xl p-4 mb-6">
                  <h3 className="font-medium text-primary flex items-center mb-2">
                    <i className="fas fa-search mr-2"></i>
                    Search Results
                  </h3>
                  <p className="text-sm text-gray-600">
                    Found {filteredFAQs.length} question(s) matching "{searchQuery}"
                  </p>
                </div>
              )}
              
              {!searchQuery && selectedCategory === "all" && (
                <div className="bg-primary/5 rounded-xl p-4 mb-6">
                  <h3 className="font-medium text-primary flex items-center mb-2">
                    <i className="fas fa-lightbulb mr-2"></i>
                    Featured Questions
                  </h3>
                  <p className="text-sm text-gray-600">
                    These are the most common questions from expecting mothers at various stages of pregnancy.
                  </p>
                </div>
              )}
              
              <Accordion type="single" collapsible className="border rounded-xl overflow-hidden">
                {filteredFAQs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border-b last:border-0">
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
                        <div className="text-neutral-dark">
                          {faq.answer}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}
          
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-neutral-dark">
              <span>Can't find an answer to your question?</span>
            </div>
            <div className="flex space-x-3">
              <button 
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300"
                onClick={() => setContactFormOpen(true)}
              >
                Contact Support
              </button>
            </div>
          </div>
          
          {/* Contact Form Dialog */}
          <ContactForm open={contactFormOpen} onOpenChange={setContactFormOpen} />
        </CardContent>
      </Card>
    </div>
  );
}
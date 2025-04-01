
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
        {resources.articles.map((article, index) => (
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
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {resources.faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

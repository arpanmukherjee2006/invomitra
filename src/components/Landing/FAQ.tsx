import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "How do I create my first invoice?",
      answer: "After signing up and logging in, click the 'New Invoice' button on your dashboard. Fill in your client details, add items or services, and your professional invoice will be generated instantly."
    },
    {
      question: "Can I customize my invoices?",
      answer: "Yes! You can add your company logo, customize colors, add terms and conditions, and include notes. All invoices are automatically formatted professionally."
    },
    {
      question: "How do I get paid faster?",
      answer: "Include clear payment terms, set due dates, and send automated reminders. You can also include multiple payment options to make it easier for clients to pay."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level encryption to protect your data. All information is stored securely in the cloud with regular backups and 99.9% uptime guarantee."
    },
    {
      question: "Can I track invoice payments?",
      answer: "Yes! Our dashboard shows you which invoices are paid, pending, or overdue. You can also generate reports to track your earnings and business performance."
    },
    {
      question: "What file formats can I export?",
      answer: "You can download your invoices as professional PDF files that are ready to print or email to your clients."
    },
    {
      question: "Is there a mobile app?",
      answer: "InvoMitra is fully responsive and works perfectly on all devices including smartphones and tablets. No separate app needed - just use your web browser."
    },
    {
      question: "Can I manage multiple clients?",
      answer: "Yes! You can store unlimited client information, track their payment history, and manage all your invoices from one central dashboard."
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to know about InvoMitra
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border rounded-lg px-6 py-2"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        
      </div>
    </section>
  );
};

export default FAQ;
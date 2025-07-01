'use client';

import { MessageCircleQuestion } from 'lucide-react';
import { Faqs } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQs({ faqs }: { faqs: Faqs[] }) {
  return (
    <main className="mt-10 rounded-xl overflow-hidden shadow-lg border border-purple-100 bg-gradient-to-br from-white to-purple-50">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 py-4 px-6">
        <h2 className="text-xl font-bold text-white flex items-center">
        <MessageCircleQuestion className="h-6 w-6 mr-2" />
          Faqs
        </h2>
      </div>
      
      <div className="p-5">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium text-purple-800 hover:text-purple-600">
                <span dangerouslySetInnerHTML={{ __html: faq.question }} />
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 text-left">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </main>
  );
}
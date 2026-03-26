import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQ = ({ content }) => {
  // STRICT MODE: No defaults.
  // Handle if content is array (old style) or object (new style)
  const items = Array.isArray(content) ? content : (content?.items || []);
  const title = !Array.isArray(content) ? content?.title : null;
  const subtitle = !Array.isArray(content) ? content?.subtitle : null;

  if (!items || items.length === 0) return null;

  return (
    <section id="faq" className="py-20 md:py-28 bg-background/80">
      <div className="container mx-auto px-4">
        {(title || subtitle) && (
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
            >
            {title && <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">{title}</h2>}
            {subtitle && (
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
                </p>
            )}
            </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;

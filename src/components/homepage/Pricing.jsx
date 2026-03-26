import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { schoolModuleMap } from '@/lib/schoolModules';

const PricingCard = ({ plan, index }) => {
  const features = plan.modules || [];
  const isPrepaid = plan.plan_type === 'Prepaid';
  const priceDisplay = isPrepaid ? `?${plan.price}` : 'Usage Based';
  const periodDisplay = isPrepaid ? `/${plan.subscription_period_type || 'Year'}` : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className={`relative p-8 rounded-2xl border ${plan.is_recommended ? 'border-primary bg-card shadow-xl' : 'border-border bg-card'}`}
    >
      {plan.is_recommended && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
          <div className="bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold rounded-full">
            Recommended
          </div>
        </div>
      )}
      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
      <p className="text-muted-foreground mt-2">{plan.tagline || plan.description}</p>
      <div className="mt-6">
        <span className="text-4xl font-extrabold text-foreground">{priceDisplay}</span>
        <span className="text-muted-foreground">{periodDisplay}</span>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        {isPrepaid ? (
            <>
                <p>Students: {plan.no_of_students}</p>
                <p>Staff: {plan.no_of_staffs}</p>
            </>
        ) : (
            <>
                <p>Per Student: ?{plan.per_student_charge}</p>
                <p>Per Staff: ?{plan.per_staff_charge}</p>
            </>
        )}
      </div>

      <ul className="mt-6 space-y-3">
        {features.slice(0, 8).map((featureKey) => (
          <li key={featureKey} className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-muted-foreground capitalize">{schoolModuleMap[featureKey]?.label || featureKey.replace('_', ' ')}</span>
          </li>
        ))}
        {features.length > 8 && (
            <li className="flex items-center text-muted-foreground italic">
                + {features.length - 8} more features
            </li>
        )}
      </ul>
      <Button className="w-full mt-8" variant={plan.is_recommended ? 'default' : 'outline'}>
        Get Started
      </Button>
    </motion.div>
  );
};

const Pricing = ({ content, plans }) => {
  // STRICT MODE: No defaults.
  const title = content?.title;
  const subtitle = content?.subtitle;

  if (!content || content.enabled === false) return null;

  return (
    <section id="pricing" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans && plans.length > 0 ? (
              plans.map((plan, index) => (
                <PricingCard key={plan.id} plan={plan} index={index} />
              ))
          ) : (
              <div className="col-span-full text-center text-muted-foreground">
                  No active subscription plans available at the moment.
              </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Pricing;

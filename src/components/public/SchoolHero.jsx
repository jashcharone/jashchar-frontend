import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogIn, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

const SchoolHero = ({ schoolData }) => {
  const school = schoolData?.schools;
  const hero = schoolData?.hero || {};
  
  const title = hero.title || `Welcome to ${school?.name || 'Our School'}`;
  const subtitle = hero.subtitle || "Empowering Students for a Brighter Future";
  const backgroundImage = hero.backgroundImage || "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80";
  
  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={backgroundImage} 
          alt="School Campus" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay */}
      </div>

      <div className="container relative z-10 px-4 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {school?.logo_url && (
            <img 
              src={school.logo_url} 
              alt={school.name} 
              className="h-24 w-auto mx-auto mb-6 drop-shadow-lg"
            />
          )}
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight drop-shadow-md">
            {title}
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white min-w-[160px] text-lg h-12" asChild>
              <Link to="/login">
                <LogIn className="mr-2 h-5 w-5" />
                Login
              </Link>
            </Button>
            
            <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/40 min-w-[160px] text-lg h-12 backdrop-blur-sm" asChild>
              <Link to="/admission">
                <GraduationCap className="mr-2 h-5 w-5" />
                Admissions
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto block">
          <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default SchoolHero;

import React from 'react';
import { Star, Clock, BookOpen, ShoppingCart, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CourseCard = ({ course, onAddToCart, onStartLesson }) => {
  const discountedPrice = course.discount > 0 
    ? course.price - (course.price * (course.discount / 100)) 
    : course.price;

  return (
    <div className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Image */}
      <div className="relative h-48 bg-muted overflow-hidden">
        {course.preview_image ? (
          <img 
            src={course.preview_image} 
            alt={course.title} 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">No Preview</div>
        )}
        {course.is_free && (
          <Badge className="absolute top-3 left-3 bg-green-500 hover:bg-green-600 text-white border-0">Free</Badge>
        )}
        {!course.is_free && course.discount > 0 && (
          <Badge className="absolute top-3 left-3 bg-[#d0021b] hover:bg-[#b00216] text-white border-0">-{course.discount}%</Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">{course.category?.name || 'General'}</span>
          {/* Sales Count can go here if needed, e.g. badge */}
        </div>

        <h3 className="font-bold text-foreground text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        <div className="text-xs text-muted-foreground mb-4 flex flex-wrap gap-3">
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.lesson_count || 0} Lessons</span>
          {course.total_duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.total_duration}</span>}
        </div>

        <div className="mt-auto">
          {/* Rating */}
          <div className="flex items-center mb-3">
            <div className="flex text-orange-400 text-xs">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < Math.round(course.rating || 0) ? 'fill-current' : 'text-muted'}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-2">({course.review_count || 0} Rating)</span>
            <span className="text-xs text-muted-foreground ml-auto">{course.sales_count || 0} Sales</span>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div>
              {course.is_free ? (
                <span className="text-xl font-bold text-foreground">Free</span>
              ) : (
                <div className="flex flex-col leading-none">
                  <span className="text-xl font-bold text-foreground">${discountedPrice.toFixed(2)}</span>
                  {course.discount > 0 && (
                    <span className="text-xs text-muted-foreground line-through">${course.price}</span>
                  )}
                </div>
              )}
            </div>

            {course.is_free ? (
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                onClick={() => onStartLesson(course)}
              >
                <Play className="h-3 w-3 mr-1.5" /> Start Lesson
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                className="border-gray-300 hover:border-[#d0021b] hover:text-[#d0021b] h-8 px-3"
                onClick={() => onAddToCart(course)}
              >
                <ShoppingCart className="h-3 w-3 mr-1.5" /> Add To Cart
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;

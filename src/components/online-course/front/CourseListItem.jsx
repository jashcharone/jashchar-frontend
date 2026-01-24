import React from 'react';
import { Star, Clock, BookOpen, ShoppingCart, Play, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CourseListItem = ({ course, onAddToCart, onStartLesson }) => {
  const discountedPrice = course.discount > 0 
    ? course.price - (course.price * (course.discount / 100)) 
    : course.price;

  return (
    <div className="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row h-auto md:h-48">
      {/* Image */}
      <div className="relative w-full md:w-64 h-48 md:h-full bg-gray-100 shrink-0">
        {course.preview_image ? (
          <img 
            src={course.preview_image} 
            alt={course.title} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">No Preview</div>
        )}
        {course.is_free && (
          <Badge className="absolute top-3 left-3 bg-green-500 text-white border-0">Free</Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{course.category?.name || 'General'}</span>
              <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#d0021b] transition-colors mt-1">
                {course.title}
              </h3>
            </div>
            <div className="text-right hidden sm:block">
               {course.is_free ? (
                <span className="text-xl font-bold text-gray-800">Free</span>
              ) : (
                <>
                  <span className="block text-xl font-bold text-gray-800">${discountedPrice.toFixed(2)}</span>
                  {course.discount > 0 && <span className="text-xs text-gray-400 line-through">${course.price}</span>}
                </>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: course.description?.replace(/<[^>]*>?/gm, '') || '' }} />
          
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
             {course.teacher && (
               <span className="flex items-center gap-1"><User className="h-3 w-3" /> {course.teacher.full_name}</span>
             )}
             <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.lesson_count || 0} Lessons</span>
             <span className="hidden sm:flex items-center gap-1"><Clock className="h-3 w-3" /> {course.total_duration || '0h 0m'}</span>
             <span>Updated {new Date(course.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
           {/* Rating */}
           <div className="flex items-center">
            <div className="flex text-orange-400 text-xs">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < Math.round(course.rating || 0) ? 'fill-current' : 'text-gray-200'}`} />
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-2">({course.review_count || 0})</span>
            <span className="text-xs text-gray-400 ml-3 border-l pl-3">{course.sales_count || 0} Sales</span>
          </div>

          <div className="flex gap-2">
             {/* Mobile Price view */}
             <div className="sm:hidden text-right mr-2">
               {course.is_free ? <span className="font-bold">Free</span> : <span className="font-bold">${discountedPrice.toFixed(2)}</span>}
             </div>

             {course.is_free ? (
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white h-8"
                onClick={() => onStartLesson(course)}
              >
                <Play className="h-3 w-3 mr-1.5" /> Start
              </Button>
            ) : (
              <Button 
                size="sm" 
                className="bg-[#d0021b] hover:bg-[#b00216] text-white h-8"
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

export default CourseListItem;

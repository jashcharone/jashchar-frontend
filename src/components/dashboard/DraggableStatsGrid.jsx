import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, GripVertical } from 'lucide-react';
import StatCard from '@/components/StatCard';

const DraggableStatsGrid = ({ items, onReorder, isEditing }) => {
  const moveItem = (index, direction) => {
    const newItems = [...items];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    onReorder(newItems);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {items.map((item, index) => {
        // Destructure key to avoid passing it to StatCard via spread which causes React warning
        // eslint-disable-next-line no-unused-vars
        const { key, ...itemProps } = item;
        
        return (
        <motion.div
          layout
          key={item.id}
          className="relative"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {isEditing && (
            <div className="absolute -top-2 -right-2 flex gap-1 z-20 bg-background/90 p-1 rounded-full border shadow-md scale-75">
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="h-6 w-6 rounded-full" 
                 disabled={index === 0}
                 onClick={() => moveItem(index, -1)}
               >
                 <ArrowLeft className="h-3 w-3" />
               </Button>
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="h-6 w-6 rounded-full"
                 disabled={index === items.length - 1}
                 onClick={() => moveItem(index, 1)}
               >
                 <ArrowRight className="h-3 w-3" />
               </Button>
            </div>
          )}
          <div className={isEditing ? "opacity-80 pointer-events-none transform scale-95 transition-all" : "transition-all"}>
             <StatCard {...itemProps} index={index} />
          </div>
        </motion.div>
      )})}
    </div>
  );
};

export default DraggableStatsGrid;

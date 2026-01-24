import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

const DraggableWidgetGrid = ({ items, onReorder, isEditing, columns = 2 }) => {
  const moveItem = (index, direction) => {
    const newItems = [...items];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    onReorder(newItems);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-${columns} gap-8`}>
      {items.map((item, index) => (
        <motion.div
          layout
          key={item.id}
          className="relative bg-card p-6 rounded-xl shadow-lg border group"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {isEditing && (
            <div className="absolute top-2 right-2 flex gap-1 z-10 bg-background/80 p-1 rounded-md backdrop-blur-sm border shadow-sm">
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="h-6 w-6 hover:bg-accent" 
                 disabled={index === 0}
                 onClick={() => moveItem(index, -1)}
                 title="Move Backward"
               >
                 <ArrowLeft className="h-3 w-3" />
               </Button>
               <div className="flex items-center justify-center px-1 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
               </div>
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="h-6 w-6 hover:bg-accent"
                 disabled={index === items.length - 1}
                 onClick={() => moveItem(index, 1)}
                 title="Move Forward"
               >
                 <ArrowRight className="h-3 w-3" />
               </Button>
            </div>
          )}
          {/* Overlay to prevent interaction with chart while editing */}
          {isEditing && <div className="absolute inset-0 z-0 bg-transparent" />}
          
          <div className={isEditing ? "pointer-events-none opacity-80" : ""}>
            {item.component}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DraggableWidgetGrid;

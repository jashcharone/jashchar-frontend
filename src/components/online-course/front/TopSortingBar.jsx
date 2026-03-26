import React from 'react';
import { LayoutGrid, List, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TopSortingBar = ({ viewMode, setViewMode, sortBy, setSortBy, sortOrder, setSortOrder }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 border rounded-md mb-6">
      <div className="flex items-center gap-2">
        <Button 
          variant={viewMode === 'grid' ? 'default' : 'outline'} 
          size="icon" 
          className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-gray-800 hover:bg-gray-700' : 'text-gray-500'}`}
          onClick={() => setViewMode('grid')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button 
          variant={viewMode === 'list' ? 'default' : 'outline'} 
          size="icon" 
          className={`h-8 w-8 ${viewMode === 'list' ? 'bg-gray-800 hover:bg-gray-700' : 'text-gray-500'}`}
          onClick={() => setViewMode('list')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex border rounded-md overflow-hidden">
          {[
            { id: 'sales', label: 'Best Seller' },
            { id: 'newest', label: 'Newest' },
            { id: 'rating', label: 'Best Rated' }
          ].map(opt => (
            <button
              key={opt.id}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-r last:border-r-0 ${sortBy === opt.id ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setSortBy(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button 
            className={`px-3 py-1.5 text-xs font-medium border rounded-l-md ${sortBy === 'price' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setSortBy('price')}
          >
            Price
          </button>
          <button 
            className="px-2 py-1.5 border rounded-r-md border-l-0 bg-white text-gray-500 hover:bg-gray-50"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            title={sortOrder === 'asc' ? "Low to High" : "High to Low"}
          >
            <ArrowUpDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopSortingBar;

import React, { useState } from 'react';
import { X, Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star } from 'lucide-react';

const LeftSidebar = ({ 
  filters, 
  setFilters, 
  categories, 
  counts, 
  onClose, 
  className 
}) => {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [minPrice, setMinPrice] = useState(filters.priceRange[0]);
  const [maxPrice, setMaxPrice] = useState(filters.priceRange[1]);

  const handleCategoryChange = (catId) => {
    const newCats = filters.categories.includes(catId)
      ? filters.categories.filter(c => c !== catId)
      : [...filters.categories, catId];
    setFilters({ ...filters, categories: newCats });
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: localSearch });
  };

  const handlePriceRangeSearch = () => {
    setFilters({ ...filters, priceRange: [minPrice, maxPrice] });
  };

  const handleReset = () => {
    setFilters({
      categories: [],
      search: '',
      priceRange: ['', ''],
      types: [],
      sales: [],
      ratings: []
    });
    setLocalSearch('');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className={`bg-card border border-border rounded-md p-4 flex flex-col gap-6 h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-bold text-foreground">Filter & Refine</h3>
        <div className="flex gap-2">
          <button onClick={handleReset} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1 pr-3">
        <div className="space-y-6">
          {/* Category */}
          <div>
            <h4 className="text-sm font-bold mb-3 text-foreground">Category</h4>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`cat-${cat.id}`} 
                      checked={filters.categories.includes(cat.id)}
                      onCheckedChange={() => handleCategoryChange(cat.id)}
                    />
                    <Label htmlFor={`cat-${cat.id}`} className="text-sm text-gray-600 font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {cat.name}
                    </Label>
                  </div>
                  <span className="text-xs text-gray-400">{counts.category[cat.id] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Search By Course */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold mb-3 text-gray-700">Search By Course</h4>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter Keyword..." 
                className="h-9 text-xs bg-gray-50" 
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button size="icon" className="h-9 w-9 bg-gray-200 hover:bg-gray-300 text-gray-600" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Price Range */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold mb-3 text-gray-700">Price Range</h4>
            <div className="flex items-center gap-2">
              <Input 
                placeholder="$" 
                type="number" 
                className="h-9 text-xs bg-gray-50" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className="text-gray-400">-</span>
              <Input 
                placeholder="$" 
                type="number" 
                className="h-9 text-xs bg-gray-50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
              <Button size="icon" className="h-9 w-9 bg-gray-200 hover:bg-gray-300 text-gray-600" onClick={handlePriceRangeSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Price Type */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold mb-3 text-gray-700">Price</h4>
            <div className="space-y-2">
              {['Free', 'Paid'].map(type => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`type-${type}`}
                      checked={filters.types.includes(type)}
                      onCheckedChange={(checked) => {
                        const newTypes = checked ? [...filters.types, type] : filters.types.filter(t => t !== type);
                        setFilters({ ...filters, types: newTypes });
                      }}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm text-gray-600 font-normal cursor-pointer">{type}</Label>
                  </div>
                  <span className="text-xs text-gray-400">{counts.type[type] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sales */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold mb-3 text-gray-700">Sales</h4>
            <div className="space-y-2">
              {[
                { id: 'low', label: 'Low (< 100)' },
                { id: 'medium', label: 'Medium (100-500)' },
                { id: 'high', label: 'High (> 500)' }
              ].map(s => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`sales-${s.id}`}
                      checked={filters.sales.includes(s.id)}
                      onCheckedChange={(checked) => {
                        const newSales = checked ? [...filters.sales, s.id] : filters.sales.filter(x => x !== s.id);
                        setFilters({ ...filters, sales: newSales });
                      }}
                    />
                    <Label htmlFor={`sales-${s.id}`} className="text-sm text-gray-600 font-normal cursor-pointer">{s.label}</Label>
                  </div>
                  <span className="text-xs text-gray-400">{counts.sales[s.id] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold mb-3 text-gray-700">Rating</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2].map(stars => (
                <div key={stars} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`rating-${stars}`}
                      checked={filters.ratings.includes(stars)}
                      onCheckedChange={(checked) => {
                        const newRatings = checked ? [...filters.ratings, stars] : filters.ratings.filter(r => r !== stars);
                        setFilters({ ...filters, ratings: newRatings });
                      }}
                    />
                    <Label htmlFor={`rating-${stars}`} className="flex items-center cursor-pointer">
                      <div className="flex text-orange-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < stars ? 'fill-current' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </Label>
                  </div>
                  <span className="text-xs text-gray-400">{counts.rating[stars] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default LeftSidebar;

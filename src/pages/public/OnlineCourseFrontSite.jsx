import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import { supabase } from '@/lib/customSupabaseClient';
import PublicCourseHeader from '@/components/online-course/front/PublicCourseHeader';
import LeftSidebar from '@/components/online-course/front/LeftSidebar';
import TopSortingBar from '@/components/online-course/front/TopSortingBar';
import CourseCard from '@/components/online-course/front/CourseCard';
import CourseListItem from '@/components/online-course/front/CourseListItem';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const OnlineCourseFrontSite = () => {
  const schoolAlias = useSchoolSlug();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);

  // Filters & Sorting State
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest'); // newest, sales, rating, price
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    categories: [],
    search: '',
    priceRange: ['', ''],
    types: [], // Free, Paid
    sales: [], // low, medium, high
    ratings: [] // 5, 4, 3, 2
  });

  useEffect(() => {
    if (schoolAlias) fetchData();
    // Load cart from local storage
    const savedCart = localStorage.getItem('school_course_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, [schoolAlias]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get School ID from alias
      let { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('cms_url_alias', schoolAlias)
        .single();

      if (schoolError || !schoolData) {
        // Fallback for development or if alias fails (try finding by ID if alias is actually an ID, rare but possible)
        const { data: fallback } = await supabase.from('schools').select('*').limit(1).single();
        schoolData = fallback;
      }
      
      if (!schoolData) throw new Error("School not found");
      setSchool(schoolData);

      const branchId = schoolData.id;

      // 2. Fetch Categories
      const { data: cats } = await supabase.from('online_course_categories').select('*').eq('branch_id', branchId);
      setCategories(cats || []);

      // 3. Fetch Courses with related data
      // We need reviews and sales to calculate aggregations. 
      // Since Supabase basic client doesn't do deep nested aggregations easily in one efficient query without views/RPC,
      // we'll fetch raw data and aggregate in JS for this scale (usually < 1000 courses for a single school).
      
      const { data: rawCourses } = await supabase
        .from('online_courses')
        .select(`
          *,
          category:online_course_categories(name),
          teacher:employee_profiles(full_name),
          lessons:course_lessons(id, duration)
        `)
        .eq('branch_id', branchId)
        .eq('is_published', true);

      // Fetch Reviews & Sales separately to avoid huge join payload if simple
      const { data: reviews } = await supabase.from('course_reviews').select('course_id, rating').eq('branch_id', branchId);
      const { data: sales } = await supabase.from('student_course_purchases').select('course_id').eq('branch_id', branchId);

      // Aggregate
      const processedCourses = rawCourses.map(c => {
        const cReviews = reviews?.filter(r => r.course_id === c.id) || [];
        const cSales = sales?.filter(s => s.course_id === c.id).length || 0;
        const totalRating = cReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = cReviews.length > 0 ? totalRating / cReviews.length : 0;
        
        // Calc duration (mock simple sum)
        // Assuming duration is text "HH:MM:SS" or similar, parsing might be complex. 
        // For now, just count lessons.
        
        return {
          ...c,
          rating: avgRating,
          review_count: cReviews.length,
          sales_count: cSales,
          lesson_count: c.lessons?.length || 0,
          total_duration: '5h 30m' // Placeholder calculation
        };
      });

      setCourses(processedCourses);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ variant: "destructive", title: "Error loading courses" });
    } finally {
      setLoading(false);
    }
  };

  // --- Logic for Filter Counts ---
  const filterCounts = useMemo(() => {
    const counts = { category: {}, type: { Free: 0, Paid: 0 }, sales: { low: 0, medium: 0, high: 0 }, rating: {} };
    
    // Initialize rating counts
    [5,4,3,2].forEach(r => counts.rating[r] = 0);

    courses.forEach(c => {
      // Category
      counts.category[c.category_id] = (counts.category[c.category_id] || 0) + 1;
      // Type
      if (c.is_free) counts.type.Free++; else counts.type.Paid++;
      // Sales
      if (c.sales_count < 100) counts.sales.low++;
      else if (c.sales_count <= 500) counts.sales.medium++;
      else counts.sales.high++;
      // Rating (>= check)
      const r = Math.round(c.rating);
      if (r >= 2) counts.rating[2]++;
      if (r >= 3) counts.rating[3]++;
      if (r >= 4) counts.rating[4]++;
      if (r === 5) counts.rating[5]++;
    });
    return counts;
  }, [courses]);

  // --- Filter & Sort Logic ---
  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    // 1. Filter
    // Category
    if (filters.categories.length > 0) {
      result = result.filter(c => filters.categories.includes(c.category_id));
    }
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(q));
    }
    // Price Range
    if (filters.priceRange[0] !== '' || filters.priceRange[1] !== '') {
      const min = parseFloat(filters.priceRange[0]) || 0;
      const max = parseFloat(filters.priceRange[1]) || Infinity;
      result = result.filter(c => {
        const price = c.discount > 0 ? c.price - (c.price * c.discount/100) : c.price;
        // If free, price is 0
        const finalPrice = c.is_free ? 0 : price;
        return finalPrice >= min && finalPrice <= max;
      });
    }
    // Type
    if (filters.types.length > 0) {
      result = result.filter(c => (filters.types.includes('Free') && c.is_free) || (filters.types.includes('Paid') && !c.is_free));
    }
    // Sales
    if (filters.sales.length > 0) {
      result = result.filter(c => {
        let match = false;
        if (filters.sales.includes('low') && c.sales_count < 100) match = true;
        if (filters.sales.includes('medium') && c.sales_count >= 100 && c.sales_count <= 500) match = true;
        if (filters.sales.includes('high') && c.sales_count > 500) match = true;
        return match;
      });
    }
    // Rating
    if (filters.ratings.length > 0) {
      const minRating = Math.min(...filters.ratings);
      result = result.filter(c => Math.round(c.rating) >= minRating);
    }

    // 2. Sort
    result.sort((a, b) => {
      let valA, valB;
      switch(sortBy) {
        case 'sales': valA = a.sales_count; valB = b.sales_count; break;
        case 'rating': valA = a.rating; valB = b.rating; break;
        case 'price': 
          valA = a.is_free ? 0 : (a.discount > 0 ? a.price - (a.price * a.discount/100) : a.price);
          valB = b.is_free ? 0 : (b.discount > 0 ? b.price - (b.price * b.discount/100) : b.price);
          break;
        case 'newest': default:
          valA = new Date(a.created_at).getTime(); valB = new Date(b.created_at).getTime(); break;
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [courses, filters, sortBy, sortOrder]);

  // --- Handlers ---
  const handleAddToCart = (course) => {
    if (cart.find(c => c.id === course.id)) {
      toast({ title: "Already in cart" });
      return;
    }
    const newCart = [...cart, course];
    setCart(newCart);
    localStorage.setItem('school_course_cart', JSON.stringify(newCart));
    toast({ title: "Added to cart", className: "bg-green-600 text-white" });
  };

  const handleStartLesson = async (course) => {
    // 1. Check if user is logged in (usually required even for free courses to track progress)
    // For now, assuming public access or redirecting to login if needed. 
    // We'll simulate a "Start" action.
    
    toast({ title: "Starting Lesson...", description: "Redirecting to course player." });
    // In a real app, this would create a 'purchase' record with price 0 if not exists, then redirect.
    setTimeout(() => {
        // navigate(`/${schoolAlias}/online-course/${course.id}/learn`);
        toast({ title: "Redirected", description: "(Course Player route placeholder)" });
    }, 1000);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-gray-400" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <PublicCourseHeader school={school} cartCount={cart.length} />

      <div className="container mx-auto px-4 py-8 flex gap-8 flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <LeftSidebar 
            filters={filters} 
            setFilters={setFilters} 
            categories={categories} 
            counts={filterCounts}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile Filter Trigger */}
          <div className="lg:hidden mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <LeftSidebar 
                  filters={filters} 
                  setFilters={setFilters} 
                  categories={categories} 
                  counts={filterCounts}
                  className="h-full border-0 rounded-none"
                  onClose={() => {}} // Sheet handles close usually
                />
              </SheetContent>
            </Sheet>
          </div>

          <TopSortingBar 
            viewMode={viewMode} setViewMode={setViewMode} 
            sortBy={sortBy} setSortBy={setSortBy}
            sortOrder={sortOrder} setSortOrder={setSortOrder}
          />

          {filteredAndSortedCourses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-dashed">
              <p className="text-gray-500 text-lg">No courses found matching your criteria.</p>
              <Button variant="link" onClick={() => setFilters({categories: [], search: '', priceRange: ['', ''], types: [], sales: [], ratings: []})}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
              {filteredAndSortedCourses.map(course => (
                viewMode === 'grid' ? (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onAddToCart={handleAddToCart} 
                    onStartLesson={handleStartLesson}
                  />
                ) : (
                  <CourseListItem 
                    key={course.id} 
                    course={course} 
                    onAddToCart={handleAddToCart} 
                    onStartLesson={handleStartLesson}
                  />
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineCourseFrontSite;

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 COMPETENCY BADGES - Day 15 of Academic Intelligence
// ═══════════════════════════════════════════════════════════════════════════════
// World-class gamification system for student achievements
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/services/api';
import { formatDate } from '@/utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Lucide Icons
import {
    Award, Trophy, Medal, Star, Crown, Gem,
    Plus, Edit, Trash2, Save, X, Search, Filter,
    Users, Target, TrendingUp, CheckCircle,
    Calendar, Clock, BookOpen, Palette,
    Heart, Dumbbell, Lightbulb, Gift,
    ChevronRight, ChevronDown, ChevronUp,
    RefreshCw, Download, Upload, Eye,
    Sparkles, Zap, Shield, Flag,
    BarChart3, Grid3X3, List, LayoutGrid
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// ICON MAP
// ═══════════════════════════════════════════════════════════════════════════════
const iconMap = {
    Award, Trophy, Medal, Star, Crown, Gem,
    Target, Heart, Dumbbell, Lightbulb, Gift,
    BookOpen, Palette, Sparkles, Zap, Shield, Flag,
    Clock, Calendar, Users, CheckCircle
};

const getIcon = (iconName, className = "h-5 w-5") => {
    const IconComponent = iconMap[iconName] || Award;
    return <IconComponent className={className} />;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const CompetencyBadges = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Data
    const [dashboardStats, setDashboardStats] = useState(null);
    const [badges, setBadges] = useState([]);
    const [categories, setCategories] = useState([]);
    const [levels, setLevels] = useState([]);
    const [studentBadges, setStudentBadges] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [students, setStudents] = useState([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // grid, list

    // Dialogs
    const [showBadgeDialog, setShowBadgeDialog] = useState(false);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [showAwardDialog, setShowAwardDialog] = useState(false);
    const [showStudentProfile, setShowStudentProfile] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

    // Form State
    const [badgeForm, setBadgeForm] = useState({
        name: '', code: '', description: '', detailed_criteria: '',
        category_id: '', level_id: '', icon: 'Star', color: '#FFD700',
        base_points: 100, xp_reward: 50, award_type: 'manual',
        max_awards_per_student: 1, is_stackable: false, is_active: true, is_featured: false,
        class_id: '', subject_id: ''
    });
    const [categoryForm, setCategoryForm] = useState({
        name: '', code: '', description: '', icon: 'Award', color: '#FFD700',
        sort_order: 0, is_active: true
    });
    const [awardForm, setAwardForm] = useState({
        badge_id: '', student_ids: [], award_reason: '', teacher_notes: ''
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA LOADING
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (selectedBranch?.id) {
            loadInitialData();
        }
    }, [selectedBranch?.id, currentSessionId, refreshKey]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadDashboard(),
                loadCategories(),
                loadLevels(),
                loadBadges(),
                loadClasses()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDashboard = async () => {
        try {
            const res = await api.get('/competency-badges/dashboard');
            if (res.data.success) {
                setDashboardStats(res.data.data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await api.get('/competency-badges/categories');
            if (res.data.success) {
                setCategories(res.data.data || []);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadLevels = async () => {
        try {
            const res = await api.get('/competency-badges/levels');
            if (res.data.success) {
                setLevels(res.data.data || []);
            }
        } catch (error) {
            console.error('Error loading levels:', error);
        }
    };

    const loadBadges = async () => {
        try {
            const params = {};
            if (selectedCategory !== 'all') params.category_id = selectedCategory;
            if (selectedLevel !== 'all') params.level_id = selectedLevel;
            
            const res = await api.get('/competency-badges/badges', { params });
            if (res.data.success) {
                setBadges(res.data.data || []);
            }
        } catch (error) {
            console.error('Error loading badges:', error);
        }
    };

    const loadStudentBadges = async () => {
        try {
            const params = {};
            if (selectedClass) params.class_id = selectedClass;
            if (selectedSection) params.section_id = selectedSection;
            
            const res = await api.get('/competency-badges/awards', { params });
            if (res.data.success) {
                setStudentBadges(res.data.data || []);
            }
        } catch (error) {
            console.error('Error loading student badges:', error);
        }
    };

    const loadLeaderboard = async () => {
        try {
            const res = await api.get('/competency-badges/leaderboard', {
                params: { type: 'school', limit: 50 }
            });
            if (res.data.success) {
                setLeaderboard(res.data.data || []);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    };

    const loadClasses = async () => {
        try {
            const res = await api.get('/academics/classes');
            if (res.data.success) {
                setClasses(res.data.data || []);
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    };

    const loadSections = async (classId) => {
        try {
            const res = await api.get(`/academics/classes/${classId}/sections`);
            if (res.data.success) {
                setSections(res.data.data || []);
            }
        } catch (error) {
            console.error('Error loading sections:', error);
            setSections([]);
        }
    };

    const loadStudents = async () => {
        if (!selectedClass) return;
        try {
            const params = { class_id: selectedClass };
            if (selectedSection) params.section_id = selectedSection;
            
            const res = await api.get('/students', { params });
            if (res.data.success) {
                setStudents(res.data.data || []);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    // When tab changes
    useEffect(() => {
        if (activeTab === 'awards') {
            loadStudentBadges();
        } else if (activeTab === 'leaderboard') {
            loadLeaderboard();
        }
    }, [activeTab]);

    // When class changes
    useEffect(() => {
        if (selectedClass) {
            loadSections(selectedClass);
            loadStudents();
        } else {
            setSections([]);
            setStudents([]);
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedClass) {
            loadStudents();
        }
    }, [selectedSection]);

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    const initializeDefaults = async () => {
        setLoading(true);
        try {
            await api.post('/competency-badges/levels/initialize');
            await api.post('/competency-badges/categories/initialize');
            await loadCategories();
            await loadLevels();
            toast.success('Default levels & categories initialized!');
        } catch (error) {
            toast.error('Failed to initialize defaults');
        } finally {
            setLoading(false);
        }
    };

    const saveBadge = async () => {
        try {
            const payload = { ...badgeForm };
            if (selectedBadge?.id) {
                payload.id = selectedBadge.id;
            }
            
            const res = await api.post('/competency-badges/badges', payload);
            if (res.data.success) {
                toast.success(selectedBadge ? 'Badge updated!' : 'Badge created!');
                setShowBadgeDialog(false);
                setSelectedBadge(null);
                resetBadgeForm();
                loadBadges();
                loadDashboard();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save badge');
        }
    };

    const deleteBadge = async (id) => {
        if (!confirm('Delete this badge?')) return;
        try {
            const res = await api.delete(`/competency-badges/badges/${id}`);
            if (res.data.success) {
                toast.success('Badge deleted');
                loadBadges();
                loadDashboard();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete');
        }
    };

    const saveCategory = async () => {
        try {
            const res = await api.post('/competency-badges/categories', categoryForm);
            if (res.data.success) {
                toast.success('Category saved!');
                setShowCategoryDialog(false);
                resetCategoryForm();
                loadCategories();
            }
        } catch (error) {
            toast.error('Failed to save category');
        }
    };

    const deleteCategory = async (id) => {
        if (!confirm('Delete this category?')) return;
        try {
            const res = await api.delete(`/competency-badges/categories/${id}`);
            if (res.data.success) {
                toast.success('Category deleted');
                loadCategories();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete');
        }
    };

    const awardBadge = async () => {
        if (!awardForm.badge_id || awardForm.student_ids.length === 0) {
            toast.error('Select badge and students');
            return;
        }
        try {
            const res = await api.post('/competency-badges/awards', awardForm);
            if (res.data.success) {
                toast.success(res.data.message);
                setShowAwardDialog(false);
                resetAwardForm();
                loadStudentBadges();
                loadDashboard();
                loadLeaderboard();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to award badge');
        }
    };

    const revokeBadge = async (id) => {
        const reason = prompt('Reason for revoking this badge:');
        if (!reason) return;
        try {
            await api.put(`/competency-badges/awards/${id}/revoke`, { revoke_reason: reason });
            toast.success('Badge revoked');
            loadStudentBadges();
            loadDashboard();
        } catch (error) {
            toast.error('Failed to revoke badge');
        }
    };

    const viewStudentProfile = async (studentId) => {
        try {
            const res = await api.get(`/competency-badges/student/${studentId}/profile`);
            if (res.data.success) {
                setSelectedStudentProfile(res.data.data);
                setShowStudentProfile(true);
            }
        } catch (error) {
            toast.error('Failed to load student profile');
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FORM HELPERS
    // ═══════════════════════════════════════════════════════════════════════════
    const resetBadgeForm = () => {
        setBadgeForm({
            name: '', code: '', description: '', detailed_criteria: '',
            category_id: '', level_id: '', icon: 'Star', color: '#FFD700',
            base_points: 100, xp_reward: 50, award_type: 'manual',
            max_awards_per_student: 1, is_stackable: false, is_active: true, is_featured: false,
            class_id: '', subject_id: ''
        });
    };

    const resetCategoryForm = () => {
        setCategoryForm({
            name: '', code: '', description: '', icon: 'Award', color: '#FFD700',
            sort_order: 0, is_active: true
        });
    };

    const resetAwardForm = () => {
        setAwardForm({
            badge_id: '', student_ids: [], award_reason: '', teacher_notes: ''
        });
    };

    const editBadge = (badge) => {
        setSelectedBadge(badge);
        setBadgeForm({
            name: badge.name || '',
            code: badge.code || '',
            description: badge.description || '',
            detailed_criteria: badge.detailed_criteria || '',
            category_id: badge.category_id || '',
            level_id: badge.level_id || '',
            icon: badge.icon || 'Star',
            color: badge.color || '#FFD700',
            base_points: badge.base_points || 100,
            xp_reward: badge.xp_reward || 50,
            award_type: badge.award_type || 'manual',
            max_awards_per_student: badge.max_awards_per_student || 1,
            is_stackable: badge.is_stackable || false,
            is_active: badge.is_active !== false,
            is_featured: badge.is_featured || false,
            class_id: badge.class_id || '',
            subject_id: badge.subject_id || ''
        });
        setShowBadgeDialog(true);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FILTERED DATA
    // ═══════════════════════════════════════════════════════════════════════════
    const filteredBadges = useMemo(() => {
        return badges.filter(badge => {
            if (searchTerm && !badge.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [badges, searchTerm]);

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: DASHBOARD TAB
    // ═══════════════════════════════════════════════════════════════════════════
    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Badges</p>
                                <p className="text-3xl font-bold">{dashboardStats?.totalBadges || 0}</p>
                            </div>
                            <Trophy className="h-10 w-10 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Badges Awarded</p>
                                <p className="text-3xl font-bold">{dashboardStats?.totalAwarded || 0}</p>
                            </div>
                            <Award className="h-10 w-10 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Students Awarded</p>
                                <p className="text-3xl font-bold">{dashboardStats?.uniqueStudents || 0}</p>
                            </div>
                            <Users className="h-10 w-10 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">This Month</p>
                                <p className="text-3xl font-bold">{dashboardStats?.monthlyAwards || 0}</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Awards by Category
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dashboardStats?.categoryStats && Object.entries(dashboardStats.categoryStats).length > 0 ? (
                            <div className="space-y-4">
                                {Object.entries(dashboardStats.categoryStats).map(([cat, count]) => (
                                    <div key={cat} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>{cat}</span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                        <Progress 
                                            value={(count / dashboardStats.totalAwarded) * 100} 
                                            className="h-2"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No awards yet</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            Recent Awards
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            {dashboardStats?.recentAwards?.length > 0 ? (
                                <div className="space-y-3">
                                    {dashboardStats.recentAwards.map((award, idx) => (
                                        <motion.div
                                            key={award.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                        >
                                            <div 
                                                className="p-2 rounded-full"
                                                style={{ backgroundColor: award.badge?.color + '20' }}
                                            >
                                                {getIcon(award.badge?.icon, "h-5 w-5")}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {award.student?.first_name} {award.student?.last_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {award.badge?.name}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="shrink-0">
                                                +{award.points_earned} pts
                                            </Badge>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">No recent awards</p>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            {(levels.length === 0 || categories.length === 0) && (
                <Card className="border-dashed">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
                            <div>
                                <h3 className="font-semibold">Get Started</h3>
                                <p className="text-muted-foreground">Initialize default badge levels and categories</p>
                            </div>
                            <Button onClick={initializeDefaults}>
                                <Zap className="h-4 w-4 mr-2" />
                                Initialize Defaults
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: BADGES TAB (Gallery)
    // ═══════════════════════════════════════════════════════════════════════════
    const renderBadges = () => (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search badges..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {levels.map(lvl => (
                            <SelectItem key={lvl.id} value={lvl.id}>{lvl.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex gap-1 border rounded-lg p-1">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
                <Button onClick={() => { resetBadgeForm(); setSelectedBadge(null); setShowBadgeDialog(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Badge
                </Button>
            </div>

            {/* Badge Gallery */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {filteredBadges.map((badge, idx) => (
                            <motion.div
                                key={badge.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                                    <CardContent className="pt-6">
                                        <div className="text-center space-y-3">
                                            <div 
                                                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                                                style={{ backgroundColor: badge.color + '20' }}
                                            >
                                                <div style={{ color: badge.color }}>
                                                    {getIcon(badge.icon, "h-8 w-8")}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{badge.name}</h4>
                                                <div className="flex items-center justify-center gap-2 mt-1">
                                                    {badge.level && (
                                                        <Badge 
                                                            variant="outline"
                                                            style={{ borderColor: badge.level.color, color: badge.level.color }}
                                                        >
                                                            {badge.level.name}
                                                        </Badge>
                                                    )}
                                                    {badge.category && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {badge.category.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Star className="h-3 w-3" />
                                                    {badge.base_points} pts
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {badge.times_awarded || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="outline" onClick={() => editBadge(badge)}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => deleteBadge(badge.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Badge</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Awarded</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBadges.map(badge => (
                                <TableRow key={badge.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="p-2 rounded-full"
                                                style={{ backgroundColor: badge.color + '20', color: badge.color }}
                                            >
                                                {getIcon(badge.icon, "h-5 w-5")}
                                            </div>
                                            <span className="font-medium">{badge.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{badge.category?.name || '-'}</TableCell>
                                    <TableCell>
                                        {badge.level && (
                                            <Badge 
                                                variant="outline"
                                                style={{ borderColor: badge.level.color, color: badge.level.color }}
                                            >
                                                {badge.level.name}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{badge.base_points}</TableCell>
                                    <TableCell>{badge.times_awarded || 0}</TableCell>
                                    <TableCell>
                                        <Badge variant={badge.is_active ? 'default' : 'secondary'}>
                                            {badge.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => editBadge(badge)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => deleteBadge(badge.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {filteredBadges.length === 0 && (
                <div className="text-center py-12">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold">No badges found</h3>
                    <p className="text-muted-foreground">Create your first badge to get started</p>
                </div>
            )}
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: AWARDS TAB
    // ═══════════════════════════════════════════════════════════════════════════
    const renderAwards = () => (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Classes</SelectItem>
                        {classes.map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedClass && sections.length > 0 && (
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All Sections" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Sections</SelectItem>
                            {sections.map(sec => (
                                <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                <Button variant="outline" onClick={loadStudentBadges}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
                <div className="flex-1" />
                <Button onClick={() => { resetAwardForm(); setShowAwardDialog(true); }}>
                    <Gift className="h-4 w-4 mr-2" />
                    Award Badge
                </Button>
            </div>

            {/* Awards Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Badge</TableHead>
                            <TableHead>Award Date</TableHead>
                            <TableHead>Points</TableHead>
                            <TableHead>Awarded By</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {studentBadges.map(sb => (
                            <TableRow key={sb.id}>
                                <TableCell>
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer hover:text-primary"
                                        onClick={() => viewStudentProfile(sb.student_id)}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>
                                                {sb.student?.first_name?.[0]}{sb.student?.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">
                                                {sb.student?.first_name} {sb.student?.last_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {sb.student?.admission_number}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="p-1.5 rounded-full"
                                            style={{ backgroundColor: sb.badge?.color + '20', color: sb.badge?.color }}
                                        >
                                            {getIcon(sb.badge?.icon, "h-4 w-4")}
                                        </div>
                                        <span>{sb.badge?.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{formatDate(sb.award_date)}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">+{sb.points_earned} pts</Badge>
                                </TableCell>
                                <TableCell>{sb.awarded_by_user?.full_name || 'System'}</TableCell>
                                <TableCell>
                                    <Badge variant={sb.status === 'active' ? 'default' : 'destructive'}>
                                        {sb.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {sb.status === 'active' && (
                                        <Button size="sm" variant="ghost" onClick={() => revokeBadge(sb.id)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {studentBadges.length === 0 && (
                <div className="text-center py-12">
                    <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold">No awards yet</h3>
                    <p className="text-muted-foreground">Start awarding badges to students</p>
                </div>
            )}
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: LEADERBOARD TAB
    // ═══════════════════════════════════════════════════════════════════════════
    const renderLeaderboard = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    School Leaderboard
                </h3>
                <Button variant="outline" onClick={loadLeaderboard}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Top 3 */}
            {leaderboard.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* 2nd Place */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 mt-8">
                            <CardContent className="pt-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700 mx-auto flex items-center justify-center mb-3">
                                    <span className="text-2xl font-bold">2</span>
                                </div>
                                <h4 className="font-semibold">
                                    {leaderboard[1]?.student?.first_name} {leaderboard[1]?.student?.last_name}
                                </h4>
                                <p className="text-2xl font-bold text-gray-600">{leaderboard[1]?.total_points}</p>
                                <p className="text-sm text-muted-foreground">{leaderboard[1]?.total_badges} badges</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* 1st Place */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-500/50">
                            <CardContent className="pt-6 text-center">
                                <Crown className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                                <div className="w-20 h-20 rounded-full bg-yellow-400 mx-auto flex items-center justify-center mb-3">
                                    <span className="text-3xl font-bold text-yellow-900">1</span>
                                </div>
                                <h4 className="font-semibold text-lg">
                                    {leaderboard[0]?.student?.first_name} {leaderboard[0]?.student?.last_name}
                                </h4>
                                <p className="text-3xl font-bold text-yellow-600">{leaderboard[0]?.total_points}</p>
                                <p className="text-sm text-muted-foreground">{leaderboard[0]?.total_badges} badges</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* 3rd Place */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 mt-12">
                            <CardContent className="pt-6 text-center">
                                <div className="w-14 h-14 rounded-full bg-orange-300 dark:bg-orange-800 mx-auto flex items-center justify-center mb-3">
                                    <span className="text-xl font-bold">3</span>
                                </div>
                                <h4 className="font-semibold">
                                    {leaderboard[2]?.student?.first_name} {leaderboard[2]?.student?.last_name}
                                </h4>
                                <p className="text-2xl font-bold text-orange-600">{leaderboard[2]?.total_points}</p>
                                <p className="text-sm text-muted-foreground">{leaderboard[2]?.total_badges} badges</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}

            {/* Full Leaderboard */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px]">Rank</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Badges</TableHead>
                            <TableHead>Points</TableHead>
                            <TableHead>XP</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaderboard.map((entry, idx) => (
                            <TableRow 
                                key={entry.student?.id || idx}
                                className={idx < 3 ? 'bg-muted/30' : ''}
                            >
                                <TableCell>
                                    <div className="flex items-center justify-center">
                                        {entry.rank === 1 ? (
                                            <Medal className="h-6 w-6 text-yellow-500" />
                                        ) : entry.rank === 2 ? (
                                            <Medal className="h-6 w-6 text-gray-400" />
                                        ) : entry.rank === 3 ? (
                                            <Medal className="h-6 w-6 text-orange-500" />
                                        ) : (
                                            <span className="font-semibold">{entry.rank}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer hover:text-primary"
                                        onClick={() => viewStudentProfile(entry.student?.id)}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>
                                                {entry.student?.first_name?.[0]}{entry.student?.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">
                                            {entry.student?.first_name} {entry.student?.last_name}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {entry.student?.class?.name} {entry.student?.section?.name}
                                </TableCell>
                                <TableCell>
                                    <Badge>{entry.total_badges}</Badge>
                                </TableCell>
                                <TableCell className="font-semibold">{entry.total_points}</TableCell>
                                <TableCell>{entry.total_xp}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: CATEGORIES TAB
    // ═══════════════════════════════════════════════════════════════════════════
    const renderCategories = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Badge Categories</h3>
                <Button onClick={() => { resetCategoryForm(); setShowCategoryDialog(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => (
                    <Card key={cat.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="p-3 rounded-full"
                                        style={{ backgroundColor: cat.color + '20', color: cat.color }}
                                    >
                                        {getIcon(cat.icon, "h-6 w-6")}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{cat.name}</h4>
                                        <p className="text-sm text-muted-foreground">{cat.code}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => {
                                        setCategoryForm(cat);
                                        setShowCategoryDialog(true);
                                    }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => deleteCategory(cat.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            {cat.description && (
                                <p className="text-sm text-muted-foreground mt-3">{cat.description}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Separator className="my-8" />

            {/* Levels */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Badge Levels</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {levels.sort((a, b) => a.tier - b.tier).map(lvl => (
                    <Card key={lvl.id} style={{ borderColor: lvl.color }}>
                        <CardContent className="pt-6 text-center">
                            <div 
                                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2"
                                style={{ backgroundColor: lvl.color }}
                            >
                                {getIcon(lvl.icon, "h-6 w-6 text-white")}
                            </div>
                            <h4 className="font-semibold">{lvl.name}</h4>
                            <p className="text-sm text-muted-foreground">Tier {lvl.tier}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {lvl.points_multiplier}x multiplier
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // DIALOGS
    // ═══════════════════════════════════════════════════════════════════════════
    const renderBadgeDialog = () => (
        <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{selectedBadge ? 'Edit Badge' : 'Create Badge'}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Badge Name *</Label>
                        <Input
                            value={badgeForm.name}
                            onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                            placeholder="e.g., Perfect Attendance"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Code *</Label>
                        <Input
                            value={badgeForm.code}
                            onChange={(e) => setBadgeForm({ ...badgeForm, code: e.target.value })}
                            placeholder="e.g., perfect_attendance"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={badgeForm.category_id} onValueChange={(v) => setBadgeForm({ ...badgeForm, category_id: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Level</Label>
                        <Select value={badgeForm.level_id} onValueChange={(v) => setBadgeForm({ ...badgeForm, level_id: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                                {levels.map(lvl => (
                                    <SelectItem key={lvl.id} value={lvl.id}>{lvl.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={badgeForm.description}
                            onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                            placeholder="Brief description of the badge"
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <Select value={badgeForm.icon} onValueChange={(v) => setBadgeForm({ ...badgeForm, icon: v })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(iconMap).map(icon => (
                                    <SelectItem key={icon} value={icon}>
                                        <div className="flex items-center gap-2">
                                            {getIcon(icon, "h-4 w-4")}
                                            {icon}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                value={badgeForm.color}
                                onChange={(e) => setBadgeForm({ ...badgeForm, color: e.target.value })}
                                className="w-14 h-10 p-1"
                            />
                            <Input
                                value={badgeForm.color}
                                onChange={(e) => setBadgeForm({ ...badgeForm, color: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Base Points</Label>
                        <Input
                            type="number"
                            value={badgeForm.base_points}
                            onChange={(e) => setBadgeForm({ ...badgeForm, base_points: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>XP Reward</Label>
                        <Input
                            type="number"
                            value={badgeForm.xp_reward}
                            onChange={(e) => setBadgeForm({ ...badgeForm, xp_reward: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="col-span-2 flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={badgeForm.is_active}
                                onCheckedChange={(v) => setBadgeForm({ ...badgeForm, is_active: v })}
                            />
                            <Label>Active</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={badgeForm.is_featured}
                                onCheckedChange={(v) => setBadgeForm({ ...badgeForm, is_featured: v })}
                            />
                            <Label>Featured</Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBadgeDialog(false)}>Cancel</Button>
                    <Button onClick={saveBadge}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Badge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    const renderCategoryDialog = () => (
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{categoryForm.id ? 'Edit Category' : 'Add Category'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                            placeholder="e.g., Academic Excellence"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Code *</Label>
                        <Input
                            value={categoryForm.code}
                            onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                            placeholder="e.g., academic"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Icon</Label>
                            <Select value={categoryForm.icon} onValueChange={(v) => setCategoryForm({ ...categoryForm, icon: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(iconMap).map(icon => (
                                        <SelectItem key={icon} value={icon}>
                                            <div className="flex items-center gap-2">
                                                {getIcon(icon, "h-4 w-4")}
                                                {icon}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={categoryForm.color}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                    className="w-14 h-10 p-1"
                                />
                                <Input
                                    value={categoryForm.color}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={categoryForm.description || ''}
                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                            rows={2}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
                    <Button onClick={saveCategory}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    const renderAwardDialog = () => (
        <Dialog open={showAwardDialog} onOpenChange={setShowAwardDialog}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5" />
                        Award Badge
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Badge *</Label>
                        <Select value={awardForm.badge_id} onValueChange={(v) => setAwardForm({ ...awardForm, badge_id: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a badge" />
                            </SelectTrigger>
                            <SelectContent>
                                {badges.filter(b => b.is_active).map(badge => (
                                    <SelectItem key={badge.id} value={badge.id}>
                                        <div className="flex items-center gap-2">
                                            <div style={{ color: badge.color }}>
                                                {getIcon(badge.icon, "h-4 w-4")}
                                            </div>
                                            {badge.name}
                                            {badge.level && (
                                                <Badge variant="outline" className="ml-2">{badge.level.name}</Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Class</Label>
                            <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setAwardForm({ ...awardForm, student_ids: [] }); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {sections.length > 0 && (
                            <div className="space-y-2">
                                <Label>Section</Label>
                                <Select value={selectedSection} onValueChange={(v) => { setSelectedSection(v); setAwardForm({ ...awardForm, student_ids: [] }); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Sections</SelectItem>
                                        {sections.map(sec => (
                                            <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    {selectedClass && students.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Select Students *</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (awardForm.student_ids.length === students.length) {
                                            setAwardForm({ ...awardForm, student_ids: [] });
                                        } else {
                                            setAwardForm({ ...awardForm, student_ids: students.map(s => s.id) });
                                        }
                                    }}
                                >
                                    {awardForm.student_ids.length === students.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                            <ScrollArea className="h-[200px] border rounded-md p-2">
                                <div className="space-y-2">
                                    {students.map(student => (
                                        <div
                                            key={student.id}
                                            className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                                            onClick={() => {
                                                const ids = awardForm.student_ids.includes(student.id)
                                                    ? awardForm.student_ids.filter(id => id !== student.id)
                                                    : [...awardForm.student_ids, student.id];
                                                setAwardForm({ ...awardForm, student_ids: ids });
                                            }}
                                        >
                                            <Checkbox checked={awardForm.student_ids.includes(student.id)} />
                                            <span>{student.first_name} {student.last_name}</span>
                                            <span className="text-muted-foreground text-sm">({student.admission_number})</span>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <p className="text-sm text-muted-foreground">
                                {awardForm.student_ids.length} student(s) selected
                            </p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Award Reason</Label>
                        <Textarea
                            value={awardForm.award_reason}
                            onChange={(e) => setAwardForm({ ...awardForm, award_reason: e.target.value })}
                            placeholder="Why is this badge being awarded?"
                            rows={2}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAwardDialog(false)}>Cancel</Button>
                    <Button onClick={awardBadge} disabled={!awardForm.badge_id || awardForm.student_ids.length === 0}>
                        <Gift className="h-4 w-4 mr-2" />
                        Award Badge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    const renderStudentProfileDialog = () => (
        <Dialog open={showStudentProfile} onOpenChange={setShowStudentProfile}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Badge Profile
                    </DialogTitle>
                </DialogHeader>
                {selectedStudentProfile && (
                    <div className="space-y-6">
                        {/* Student Info */}
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-lg">
                                    {selectedStudentProfile.student?.first_name?.[0]}
                                    {selectedStudentProfile.student?.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-xl font-semibold">
                                    {selectedStudentProfile.student?.first_name} {selectedStudentProfile.student?.last_name}
                                </h3>
                                <p className="text-muted-foreground">
                                    {selectedStudentProfile.student?.admission_number} • 
                                    {selectedStudentProfile.student?.class?.name} {selectedStudentProfile.student?.section?.name}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <p className="text-3xl font-bold">{selectedStudentProfile.stats?.total_badges || 0}</p>
                                    <p className="text-sm text-muted-foreground">Total Badges</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <p className="text-3xl font-bold text-yellow-600">{selectedStudentProfile.stats?.total_points || 0}</p>
                                    <p className="text-sm text-muted-foreground">Total Points</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <p className="text-3xl font-bold text-purple-600">{selectedStudentProfile.stats?.total_xp || 0}</p>
                                    <p className="text-sm text-muted-foreground">Total XP</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Badges Grid */}
                        <div>
                            <h4 className="font-semibold mb-4">Earned Badges</h4>
                            <div className="grid grid-cols-4 gap-4">
                                {selectedStudentProfile.badges?.map(sb => (
                                    <div key={sb.id} className="text-center p-4 bg-muted rounded-lg">
                                        <div 
                                            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2"
                                            style={{ backgroundColor: sb.badge?.color + '20' }}
                                        >
                                            <div style={{ color: sb.badge?.color }}>
                                                {getIcon(sb.badge?.icon, "h-6 w-6")}
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium truncate">{sb.badge?.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(sb.award_date)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="h-7 w-7 text-yellow-500" />
                        Competency Badges
                    </h1>
                    <p className="text-muted-foreground">Gamification & Achievement System</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setRefreshKey(k => k + 1)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="dashboard">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="badges">
                        <Trophy className="h-4 w-4 mr-2" />
                        Badges
                    </TabsTrigger>
                    <TabsTrigger value="awards">
                        <Gift className="h-4 w-4 mr-2" />
                        Awards
                    </TabsTrigger>
                    <TabsTrigger value="leaderboard">
                        <Medal className="h-4 w-4 mr-2" />
                        Leaderboard
                    </TabsTrigger>
                    <TabsTrigger value="categories">
                        <Grid3X3 className="h-4 w-4 mr-2" />
                        Categories
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6">
                    {renderDashboard()}
                </TabsContent>
                <TabsContent value="badges" className="mt-6">
                    {renderBadges()}
                </TabsContent>
                <TabsContent value="awards" className="mt-6">
                    {renderAwards()}
                </TabsContent>
                <TabsContent value="leaderboard" className="mt-6">
                    {renderLeaderboard()}
                </TabsContent>
                <TabsContent value="categories" className="mt-6">
                    {renderCategories()}
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            {renderBadgeDialog()}
            {renderCategoryDialog()}
            {renderAwardDialog()}
            {renderStudentProfileDialog()}
        </div>
    );
};

export default CompetencyBadges;

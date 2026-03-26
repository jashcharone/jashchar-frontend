import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, PlusCircle, Search, MoreHorizontal, Eye, Edit, Trash2, Info } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ARTICLES_PER_PAGE = 10;

const Articles = () => {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalArticles, setTotalArticles] = useState(0);
    const [deleteArticleId, setDeleteArticleId] = useState(null);

    const { toast } = useToast();

    const fetchCategories = useCallback(async () => {
        const { data, error } = await supabase.from('article_categories').select('id, name');
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching categories.' });
        } else {
            setCategories(data);
        }
    }, [toast]);
    
    const fetchArticles = useCallback(async () => {
        setLoading(true);
        let query = supabase
            .from('articles')
            .select('*, article_categories(name), master_admin_profiles(full_name)', { count: 'exact' });

        if (searchTerm) {
            query = query.ilike('title', `%${searchTerm}%`);
        }
        if (filterCategory !== 'all') {
            query = query.eq('category_id', filterCategory);
        }
        if (filterStatus !== 'all') {
            query = query.eq('status', filterStatus);
        }

        const from = (currentPage - 1) * ARTICLES_PER_PAGE;
        const to = from + ARTICLES_PER_PAGE - 1;

        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching articles.', description: error.message });
        } else {
            setArticles(data);
            setTotalArticles(count);
        }
        setLoading(false);
    }, [toast, searchTerm, filterCategory, filterStatus, currentPage]);

    useEffect(() => {
        fetchCategories();
        fetchArticles();
    }, [fetchCategories, fetchArticles]);
    
    const handleDelete = async () => {
        if (!deleteArticleId) return;
        const { error } = await supabase.from('articles').delete().eq('id', deleteArticleId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting article.', description: error.message });
        } else {
            toast({ title: 'Article deleted successfully.' });
            fetchArticles();
        }
        setDeleteArticleId(null);
    };

    const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);

    const paginationButtons = useMemo(() => {
        const buttons = [];
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = startPage + maxButtons - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <Button key={i} variant={currentPage === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(i)}>
                    {i}
                </Button>
            );
        }
        return buttons;
    }, [currentPage, totalPages]);

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Articles</h1>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link to="/master-admin/articles/documentation"><Info className="mr-2 h-4 w-4" /> Documentation</Link>
                    </Button>
                    <Button asChild>
                        <Link to="/master-admin/articles/new"><PlusCircle className="mr-2 h-4 w-4" /> Create Article</Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Articles</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Input placeholder="Search by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        </div>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by category..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Created Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Views</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                                ) : articles.length > 0 ? (
                                    articles.map(article => (
                                        <TableRow key={article.id}>
                                            <TableCell className="font-medium">{article.title}</TableCell>
                                            <TableCell>{article.article_categories?.name || 'N/A'}</TableCell>
                                            <TableCell>{article.master_admin_profiles?.full_name || 'N/A'}</TableCell>
                                            <TableCell>{format(new Date(article.created_at), 'PPP')}</TableCell>
                                            <TableCell>
                                                <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                                                    {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{article.views_count}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild><Link to={`/master-admin/articles/${article.slug}`}><Eye className="mr-2 h-4 w-4" /> View</Link></DropdownMenuItem>
                                                        <DropdownMenuItem asChild><Link to={`/master-admin/articles/edit/${article.id}`}><Edit className="mr-2 h-4 w-4" /> Edit</Link></DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-500" onClick={() => setDeleteArticleId(article.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={7} className="h-24 text-center">No articles found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-end items-center gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                            {paginationButtons}
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <AlertDialog open={!!deleteArticleId} onOpenChange={() => setDeleteArticleId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the article.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};

export default Articles;

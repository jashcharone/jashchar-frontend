import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Edit, User, Calendar, Tag, Eye } from 'lucide-react';
import { format } from 'date-fns';

const ViewArticle = () => {
    const { slug } = useParams();
    const { toast } = useToast();
    const [article, setArticle] = useState(null);
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    const incrementViewCount = useCallback(async (articleId) => {
        await supabase.rpc('increment', { x: 1, row_id: articleId });
    }, []);
    
    const fetchArticle = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('articles')
            .select('*, article_categories(name, slug), master_admin_profiles(full_name)')
            .eq('slug', slug)
            .single();

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching article.', description: error.message });
        } else {
            setArticle(data);
            incrementViewCount(data.id);
            // Fetch related articles
            if (data.category_id) {
                const { data: relatedData } = await supabase
                    .from('articles')
                    .select('id, title, slug, featured_image_url')
                    .eq('category_id', data.category_id)
                    .neq('id', data.id)
                    .eq('status', 'published')
                    .limit(3);
                setRelatedArticles(relatedData || []);
            }
        }
        setLoading(false);
    }, [slug, toast, incrementViewCount]);

    useEffect(() => {
        fetchArticle();
    }, [fetchArticle]);

    if (loading) {
        return <DashboardLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;
    }

    if (!article) {
        return <DashboardLayout><div className="text-center p-8">Article not found.</div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="mb-6">
                    <Button asChild variant="outline">
                        <Link to="/master-admin/articles"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Articles</Link>
                    </Button>
                </div>
                
                <article>
                    <Card>
                        {article.featured_image_url && (
                            <img src={article.featured_image_url} alt={article.title} className="w-full h-64 object-cover rounded-t-lg" />
                        )}
                        <CardHeader>
                            <Badge variant="secondary" className="w-fit mb-2">{article.article_categories?.name || 'Uncategorized'}</Badge>
                            <CardTitle className="text-4xl font-bold">{article.title}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                <span className="flex items-center gap-1"><User className="h-4 w-4"/> {article.master_admin_profiles?.full_name || 'Unknown Author'}</span>
                                <span className="flex items-center gap-1"><Calendar className="h-4 w-4"/> {format(new Date(article.published_at || article.created_at), 'PPP')}</span>
                                <span className="flex items-center gap-1"><Eye className="h-4 w-4"/> {article.views_count + 1} views</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />

                            {article.meta_keywords?.length > 0 && (
                                <div className="mt-8 flex flex-wrap gap-2">
                                    {article.meta_keywords.map(kw => <Badge key={kw} variant="outline"><Tag className="mr-1 h-3 w-3" />{kw}</Badge>)}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </article>

                <section className="mt-12">
                    <h2 className="text-2xl font-bold mb-4">Related Articles</h2>
                    {relatedArticles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedArticles.map(rel => (
                                <Link key={rel.id} to={`/master-admin/articles/${rel.slug}`}>
                                    <Card className="h-full hover:shadow-md transition-shadow">
                                        <img src={rel.featured_image_url || 'https://via.placeholder.com/300x200'} alt={rel.title} className="w-full h-32 object-cover rounded-t-lg" />
                                        <CardHeader>
                                            <CardTitle className="text-lg">{rel.title}</CardTitle>
                                        </CardHeader>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : <p>No related articles found.</p>}
                </section>

                <section className="mt-12">
                    <Card>
                        <CardHeader>
                            <CardTitle>Comments</CardTitle>
                            <CardDescription>Feature coming soon!</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">ðŸš§ This feature isn't implemented yet”but don't worry! You can request it in your next prompt! ðŸš€</p>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </DashboardLayout>
    );
};

export default ViewArticle;

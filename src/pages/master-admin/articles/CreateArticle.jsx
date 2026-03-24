import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Upload } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CreateArticle = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [content, setContent] = useState('');
    const [featuredImageUrl, setFeaturedImageUrl] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [metaKeywords, setMetaKeywords] = useState('');
    const [status, setStatus] = useState('draft');
    
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase.from('article_categories').select('id, name');
            if (error) {
                toast({ variant: 'destructive', title: 'Error fetching categories.' });
            } else {
                setCategories(data);
            }
        };
        fetchCategories();
    }, [toast]);

    const generateSlug = (str) => {
        return str
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);

        const fileExt = file.name.split('.').pop();
        const fileName = `article-images/${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        try {
            const { error: uploadError } = await supabase.storage.from('cms-media').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('cms-media').getPublicUrl(fileName);
            setFeaturedImageUrl(publicUrl);
            toast({ title: 'Image uploaded successfully.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error uploading image.', description: error.message });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !categoryId) {
            toast({ variant: 'destructive', title: 'Please fill in all required fields.' });
            return;
        }

        setLoading(true);
        const slug = generateSlug(title);

        const { error } = await supabase.from('articles').insert({
            title,
            slug,
            category_id: categoryId,
            content,
            featured_image_url: featuredImageUrl,
            meta_description: metaDescription,
            meta_keywords: metaKeywords.split(',').map(k => k.trim()),
            author_id: user.id,
            status
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Error creating article.', description: error.message });
        } else {
            toast({ title: 'Article created successfully!' });
            navigate('/master-admin/articles');
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Create New Article</h1>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Article Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Article Title <span className="text-red-500">*</span></Label>
                                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                                </div>
                                <div>
                                    <Label>Article Content</Label>
                                    <ReactQuill theme="snow" value={content} onChange={setContent} className="bg-white" />
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="meta-desc">Meta Description</Label>
                                    <Textarea id="meta-desc" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="meta-keys">Meta Keywords</Label>
                                    <Input id="meta-keys" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} placeholder="e.g., tech, features, updates" />
                                    <p className="text-sm text-muted-foreground mt-1">Separate keywords with commas.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Publish Settings</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                                    <Select value={categoryId} onValueChange={setCategoryId} required>
                                        <SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Author</Label>
                                    <Input value={user?.user_metadata?.full_name || user?.email} disabled />
                                </div>
                                <div>
                                    <Label>Created Date</Label>
                                    <Input value={formatDate(new Date())} disabled />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Featured Image</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Input type="file" id="featured-image" onChange={handleImageUpload} accept="image/*" className="hidden" />
                                    <Button type="button" variant="outline" onClick={() => document.getElementById('featured-image').click()} disabled={uploading}>
                                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                        Upload Image
                                    </Button>
                                    {featuredImageUrl && (
                                        <div className="mt-4">
                                            <img src={featuredImageUrl} alt="Featured" className="rounded-md w-full h-auto object-cover" />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Article
                        </Button>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
};

export default CreateArticle;

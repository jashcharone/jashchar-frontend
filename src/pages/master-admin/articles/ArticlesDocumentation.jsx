import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Database, ListChecks, Server, Settings, Monitor, Bug, Rocket } from 'lucide-react';

const ArticlesDocumentation = () => {
    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Articles Module Documentation</h1>
                
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Rocket className="h-6 w-6 text-primary"/>Project Overview</CardTitle></CardHeader>
                    <CardContent>
                        <p>The Articles module is a full-featured content management system (CMS) within the Master Admin portal. It allows administrators to create, manage, and publish articles for a public-facing blog or knowledge base. It includes features for categorization, SEO optimization, and content creation using a rich text editor.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary"/>Features List</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Article Management:</strong> Create, Read, Update, and Delete (CRUD) operations for articles.</li>
                            <li><strong>Rich Text Editor:</strong> A "What You See Is What You Get" (WYSIWYG) editor for creating engaging article content.</li>
                            <li><strong>Categorization:</strong> Group articles into custom categories.</li>
                            <li><strong>Featured Image:</strong> Upload and display a featured image for each article.</li>
                            <li><strong>SEO Optimization:</strong> Fields for Meta Description and Meta Keywords.</li>
                            <li><strong>Status Control:</strong> Save articles as 'Draft' or 'Published'.</li>
                            <li><strong>Search & Filter:</strong> Powerful searching and filtering by title, category, and status.</li>
                            <li><strong>Pagination:</strong> Efficiently navigate through a large number of articles.</li>
                            <li><strong>View Counter:</strong> Automatically tracks how many times an article is viewed.</li>
                            <li><strong>Slug Generation:</strong> SEO-friendly URLs are automatically created from article titles.</li>
                            <li><strong>Related Articles:</strong> Viewers are shown articles from the same category.</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-primary"/>Tech Stack</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Frontend:</strong> React, Vite, TailwindCSS</li>
                            <li><strong>UI Components:</strong> shadcn/ui, Radix UI</li>
                            <li><strong>Routing:</strong> React Router</li>
                            <li><strong>State Management:</strong> React Hooks (useState, useEffect, etc.)</li>
                            <li><strong>Backend & Database:</strong> Supabase (PostgreSQL)</li>
                            <li><strong>Rich Text Editor:</strong> ReactQuill</li>
                            <li><strong>Icons:</strong> Lucide React</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-6 w-6 text-primary"/>Database Structure</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold">`article_categories` Table</h3>
                            <p className="text-sm text-muted-foreground">Stores the categories for articles.</p>
                            <pre className="mt-2 p-2 bg-muted rounded-md text-sm overflow-x-auto"><code>
{`
id (uuid, primary key)
name (text, not null)
slug (text, not null)
description (text)
created_at (timestamp)
`}
                            </code></pre>
                        </div>
                        <div>
                            <h3 className="font-semibold">`articles` Table</h3>
                            <p className="text-sm text-muted-foreground">Stores the main article data.</p>
                            <pre className="mt-2 p-2 bg-muted rounded-md text-sm overflow-x-auto"><code>
{`
id (uuid, primary key)
title (text, not null)
slug (text, not null, unique)
category_id (uuid, foreign key to article_categories.id)
content (text)
featured_image_url (text)
meta_description (text)
meta_keywords (text[])
author_id (uuid, foreign key to master_admin_profiles.id)
status (text, 'draft' or 'published')
views_count (integer, default 0)
created_at (timestamp)
updated_at (timestamp)
published_at (timestamp)
`}
                            </code></pre>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Server className="h-6 w-6 text-primary"/>API Endpoints</CardTitle></CardHeader>
                    <CardContent>
                        <p>All database interactions are handled via the Supabase JavaScript client. There are no custom backend API endpoints for this module. The primary interactions are:</p>
                        <ul className="list-disc list-inside space-y-2 mt-2">
                            <li><Code>supabase.from('articles').select(...)</Code> - Fetch articles with filters and pagination.</li>
                            <li><Code>supabase.from('articles').insert(...)</Code> - Create a new article.</li>
                            <li><Code>supabase.from('articles').update(...)</Code> - Update an existing article.</li>
                            <li><Code>supabase.from('articles').delete(...)</Code> - Delete an article.</li>
                            <li><Code>supabase.storage.from('cms-media').upload(...)</Code> - Upload featured images.</li>
                            <li><Code>supabase.rpc('increment', ...)</Code> - Increment the view count for an article.</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Monitor className="h-6 w-6 text-primary"/>How to Use</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold">1. Navigate to the Articles Module</h3>
                            <p>In the Master Admin dashboard, click on the "Articles" item in the sidebar.</p>
                            <img alt="Sidebar with Articles menu item highlighted" src="https://images.unsplash.com/photo-1560472354-0088b5dc9d8d" />
                        </div>
                         <div>
                            <h3 className="font-semibold">2. Create a New Article</h3>
                            <p>Click the "Create Article" button. Fill out the form, including title, content, and category. Upload a featured image and set the status to 'Published' or 'Draft'.</p>
                            <img alt="Create Article form page" src="https://images.unsplash.com/photo-1693045181224-9fc2f954f054" />
                        </div>
                         <div>
                            <h3 className="font-semibold">3. View and Manage Articles</h3>
                            <p>The main articles page lists all created articles. You can use the search and filter controls to find specific articles. The action menu on each row allows you to View, Edit, or Delete an article.</p>
                             <img alt="Articles list page with table and filters" src="https://images.unsplash.com/photo-1677694031058-95963b42a0b7" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Bug className="h-6 w-6 text-primary"/>Troubleshooting</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Image Upload Fails:</strong> Ensure the 'cms-media' storage bucket exists in Supabase and that appropriate storage policies are in place to allow uploads. Check browser console for specific error messages from Supabase Storage.</li>
                            <li><strong>Articles Not Appearing:</strong> Check that the Row Level Security (RLS) policies on the `articles` and `article_categories` tables are correctly configured to allow `master_admin` role to select data.</li>
                            <li><strong>View Count Not Increasing:</strong> The `increment` RPC function must exist in your Supabase project. If it doesn't, create it. The function should take a row ID and an integer to increment a column.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default ArticlesDocumentation;

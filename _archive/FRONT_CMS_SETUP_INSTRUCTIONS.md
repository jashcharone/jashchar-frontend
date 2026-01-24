# Front CMS Setup Instructions (Updated)

## 1. Database Setup (CRITICAL)
I have updated the SQL script to **DROP and RECREATE** the CMS tables to ensure the schema is correct.
This will fix the `column "school_id" does not exist` error which was likely caused by an old version of the tables.

1.  Open the file `setup_front_cms_full.sql` in your editor.
2.  Copy the entire content.
3.  Go to your Supabase Dashboard > SQL Editor.
4.  Paste the content and run it.

**Warning**: This will delete any existing data in `cms_menus`, `cms_pages`, etc. (but not `cms_settings`).

## 2. Backend API
The backend is ready.

## 3. Frontend Implementation
Ready to start once the database is fixed.

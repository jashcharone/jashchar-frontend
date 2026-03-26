import { supabase } from '@/lib/customSupabaseClient';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Helper to log activity
const logActivity = async (action, details) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('developer_activity_logs').insert({
      user_id: user.id,
      action_type: action,
      details,
      ip_address: 'client-side' 
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Helper to generate static backend content
const generateBackendContent = async (zip) => {
  const backend = zip.folder("backend");

  // 1. Root Files
  backend.file("package.json", JSON.stringify({
    "name": "jashchar-erp-backend",
    "version": "1.0.0",
    "description": "Node.js backend for Jashchar ERP with Supabase integration",
    "main": "server.js",
    "type": "module",
    "scripts": {
      "start": "node server.js",
      "dev": "nodemon server.js",
      "test": "jest"
    },
    "dependencies": {
      "cors": "^2.8.5",
      "dotenv": "^16.3.1",
      "express": "^4.18.2",
      "express-validator": "^7.0.1",
      "helmet": "^7.0.0",
      "jsonwebtoken": "^9.0.2",
      "morgan": "^1.10.0",
      "nodemailer": "^6.9.5",
      "pg": "^8.11.3",
      "razorpay": "^2.9.2",
      "@supabase/supabase-js": "^2.38.0",
      "winston": "^3.10.0"
    },
    "devDependencies": {
      "jest": "^29.7.0",
      "nodemon": "^3.0.1",
      "supertest": "^6.3.3"
    }
  }, null, 2));

  backend.file("server.js", `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import schoolRoutes from './routes/schools.js';
import paymentRoutes from './routes/payments.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/payments', paymentRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handling
app.use(errorHandler);

app.listen(port, () => {
  logger.info(\`Server running on port \${port}\`);
});
  `);

  backend.file(".env.example", `
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database Configuration (Direct Connection if needed)
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Configuration (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
  `);

  backend.file("README.md", `
# Jashchar ERP Backend

This is the backend server for Jashchar School ERP, built with Node.js, Express, and Supabase.

## Setup

1. Install dependencies:
   \`npm install\`

2. Configure environment variables:
   Copy \`.env.example\` to \`.env\` and fill in your credentials.

3. Start the server:
   - Development: \`npm run dev\`
   - Production: \`npm start\`

## API Structure

- \`/api/auth\`: Authentication endpoints
- \`/api/users\`: User management
- \`/api/schools\`: School management
- \`/api/payments\`: Payment processing

## Database

This backend is designed to work with Supabase (PostgreSQL). Use the SQL files in \`database/\` to initialize your schema.
  `);

  // 2. Configuration
  const config = backend.folder("config");
  config.file("supabase.js", `
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials');
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
  `);
  
  config.file("database.js", `
// Direct pg connection if needed alongside Supabase client
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
  `);

  // 3. Middleware
  const middleware = backend.folder("middleware");
  middleware.file("auth.js", `
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userRole = req.user.user_metadata.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
  `);

  middleware.file("errorHandler.js", `
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: true,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
  `);

  // 4. Routes
  const routes = backend.folder("routes");
  routes.file("auth.js", `
import express from 'express';
import { login, register, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/reset-password', resetPassword);

export default router;
  `);

  routes.file("users.js", `
import express from 'express';
import { getAllUsers, getUserById, updateUser } from '../controllers/userController.js';
import { authenticateUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', requireRole(['master_admin']), getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);

export default router;
  `);

  // 5. Controllers
  const controllers = backend.folder("controllers");
  controllers.file("authController.js", `
import { supabaseAdmin } from '../config/supabase.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { email, password, metadata } = req.body;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: true
    });

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email);
    if (error) throw error;
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
};
  `);

  controllers.file("userController.js", `
import { supabaseAdmin } from '../config/supabase.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(id);
    if (error) throw error;
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updates);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};
  `);

  // 6. Utils
  const utils = backend.folder("utils");
  utils.file("logger.js", `
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});
  `);

  // 7. Database Schemas (Fetching current SQL if possible, else generating template)
  const database = backend.folder("database");
  
  // Use RPC to get current schema ddl if available, or static backup
  let schemaContent = "-- Database Schema Export\n\n";
  
  // Add common tables static definition as backup
  schemaContent += `
-- Users and Roles
CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    branch_id uuid REFERENCES public.schools(id),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.schools (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    domain text UNIQUE,
    status text DEFAULT 'Active',
    created_at timestamptz DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users(id) PRIMARY KEY,
    full_name text,
    role_id uuid REFERENCES public.roles(id),
    branch_id uuid REFERENCES public.schools(id),
    created_at timestamptz DEFAULT now()
);
  `;
  
  database.file("schemas.sql", schemaContent);
  
  database.file("functions.sql", `
-- Example Database Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role_id, branch_id)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', (new.raw_user_meta_data->>'role_id')::uuid, (new.raw_user_meta_data->>'branch_id')::uuid);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  `);

  database.file("rls-policies.sql", `
-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "School admins can view profiles in their school"
ON public.profiles FOR SELECT
USING (
  branch_id IN (
    SELECT branch_id FROM public.profiles WHERE id = auth.uid() AND role_id IN (SELECT id FROM public.roles WHERE name = 'admin')
  )
);
  `);
  
  // 8. Install Scripts
  const scripts = backend.folder("scripts");
  scripts.file("install.sh", `
#!/bin/bash
npm install
npm run dev
  `);
};

// Helper to generate frontend content
const generateFrontendContent = async (zip, files) => {
  const frontend = zip.folder("frontend");
  
  // Root files
  frontend.file("index.html", `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Jashchar ERP</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`);

  frontend.file("package.json", JSON.stringify({
    "name": "jashchar-school-erp",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "lint": "eslint .",
      "preview": "vite preview"
    },
    "dependencies": {
      "@emotion/is-prop-valid": "^1.3.1",
      "@monaco-editor/react": "^4.6.0",
      "@radix-ui/react-accordion": "^1.2.2",
      "@radix-ui/react-alert-dialog": "^1.0.5",
      "@radix-ui/react-avatar": "^1.0.3",
      "@radix-ui/react-checkbox": "^1.0.4",
      "@radix-ui/react-collapsible": "^1.0.3",
      "@radix-ui/react-context-menu": "^2.1.5",
      "@radix-ui/react-dialog": "^1.0.5",
      "@radix-ui/react-dropdown-menu": "^2.0.6",
      "@radix-ui/react-label": "^2.0.2",
      "@radix-ui/react-popover": "^1.0.7",
      "@radix-ui/react-progress": "^1.1.1",
      "@radix-ui/react-radio-group": "^1.2.2",
      "@radix-ui/react-scroll-area": "^1.2.2",
      "@radix-ui/react-select": "^2.0.0",
      "@radix-ui/react-slider": "^1.1.2",
      "@radix-ui/react-slot": "^1.0.2",
      "@radix-ui/react-switch": "^1.1.2",
      "@radix-ui/react-tabs": "^1.0.4",
      "@radix-ui/react-toast": "^1.1.5",
      "@radix-ui/react-tooltip": "^1.1.6",
      "@supabase/supabase-js": "2.30.0",
      "class-variance-authority": "^0.7.0",
      "clsx": "^2.0.0",
      "cmdk": "^1.0.4",
      "date-fns": "^2.30.0",
      "file-saver": "^2.0.5",
      "framer-motion": "^10.16.4",
      "jszip": "^3.10.1",
      "lucide-react": "^0.292.0",
      "react": "^18.2.0",
      "react-day-picker": "^8.9.1",
      "react-dom": "^18.2.0",
      "react-dropzone": "^14.2.3",
      "react-helmet": "^6.1.0",
      "react-quill": "^2.0.0",
      "react-router-dom": "^6.16.0",
      "react-to-print": "^3.0.4",
      "recharts": "^2.12.7",
      "tailwind-merge": "^1.1.4",
      "tailwindcss-animate": "^1.0.7",
      "uuid": "^9.0.1"
    },
    "devDependencies": {
      "@types/react": "^18.2.15",
      "@types/react-dom": "^18.2.7",
      "@vitejs/plugin-react": "^4.0.3",
      "autoprefixer": "^10.4.16",
      "eslint": "^8.57.1",
      "eslint-plugin-react": "^7.32.2",
      "eslint-plugin-react-hooks": "^4.6.0",
      "eslint-plugin-react-refresh": "^0.4.3",
      "postcss": "^8.4.31",
      "tailwindcss": "^3.3.3",
      "vite": "^4.4.5"
    }
  }, null, 2));

  frontend.file("vite.config.js", `
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
  `);

  frontend.file("postcss.config.js", `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
  `);

  frontend.file("tailwind.config.js", `
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Add your custom theme extensions here
    },
  },
  plugins: [require("tailwindcss-animate")],
}
  `);

  frontend.file(".env.example", `
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  `);

  // Process files from the virtual file system
  if (files && files.length > 0) {
    files.forEach(file => {
      const path = file.path.startsWith('/') ? file.path.substring(1) : file.path;
      if (
        path.startsWith('src/') || 
        path.startsWith('public/') || 
        path.endsWith('.css')
      ) {
        frontend.file(path, file.content || '');
      }
    });
  }
  
  // Scripts
  const scripts = frontend.folder("scripts");
  scripts.file("install.sh", `
#!/bin/bash
npm install
npm run dev
  `);
};

export const developerApi = {
  // File Operations (keep existing methods)
  fetchFileTree: async () => {
    const { data, error } = await supabase
      .from('developer_files')
      .select('id, name, path, type, parent_id, updated_at')
      .order('type', { ascending: false }) // Folders first
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  getFileContent: async (fileId) => {
    const { data, error } = await supabase
      .from('developer_files')
      .select('content')
      .eq('id', fileId)
      .single();
    
    if (error) throw error;
    return data.content;
  },

  saveFile: async (fileId, content, commitMessage) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Update file content
    const { error: updateError } = await supabase
      .from('developer_files')
      .update({ 
        content, 
        updated_at: new Date().toISOString(),
        last_modified_by: user.id 
      })
      .eq('id', fileId);

    if (updateError) throw updateError;

    // 2. Get current version count
    const { count } = await supabase
      .from('developer_file_versions')
      .select('*', { count: 'exact', head: true })
      .eq('file_id', fileId);

    // 3. Create new version
    const { error: versionError } = await supabase
      .from('developer_file_versions')
      .insert({
        file_id: fileId,
        content,
        version_number: (count || 0) + 1,
        commit_message: commitMessage || 'Updated file content',
        created_by: user.id
      });

    if (versionError) console.error('Failed to create version:', versionError);

    await logActivity('FILE_UPDATE', { fileId, commitMessage });
  },

  createFile: async (name, type, parentId, content = '') => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Calculate path (simplified for now, ideally recursive)
    let path = name;
    if (parentId) {
      const { data: parent } = await supabase.from('developer_files').select('path').eq('id', parentId).single();
      if (parent) path = `${parent.path}/${name}`;
    }

    const { data, error } = await supabase
      .from('developer_files')
      .insert({
        name,
        type,
        path,
        parent_id: parentId,
        content: type === 'file' ? content : null,
        last_modified_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    await logActivity('FILE_CREATE', { name, type, path });
    return data;
  },

  deleteFile: async (fileId) => {
    const { error } = await supabase
      .from('developer_files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;
    await logActivity('FILE_DELETE', { fileId });
  },

  // Version Control
  getVersions: async (fileId) => {
    const { data, error } = await supabase
      .from('developer_file_versions')
      .select('*, created_by_user:created_by(email)')
      .eq('file_id', fileId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data;
  },

  rollbackVersion: async (fileId, versionId) => {
    // Get version content
    const { data: version, error: fetchError } = await supabase
      .from('developer_file_versions')
      .select('content, version_number')
      .eq('id', versionId)
      .single();

    if (fetchError) throw fetchError;

    // Save as new update
    await developerApi.saveFile(fileId, version.content, `Rollback to version ${version.version_number}`);
    await logActivity('VERSION_ROLLBACK', { fileId, versionId });
  },

  // Export
  exportProject: async (type = 'full', onProgress) => {
    const zip = new JSZip();
    let fileCount = 0;

    if (type === 'backend') {
      // GENERATE BACKEND ONLY STRUCTURE
      await generateBackendContent(zip);
      fileCount = 25; 
    } else if (type === 'frontend') {
      // GENERATE FRONTEND ONLY STRUCTURE
      const { data: files } = await supabase
        .from('developer_files')
        .select('*')
        .eq('type', 'file');
        
      await generateFrontendContent(zip, files || []);
      fileCount = files ? files.length : 0;
    } else if (type === 'full') {
      // FULL PROJECT: Frontend + Backend + Docs
      const { data: files } = await supabase
        .from('developer_files')
        .select('*')
        .eq('type', 'file');
        
      await generateFrontendContent(zip, files || []);
      await generateBackendContent(zip);
      
      // Add Documentation
      const docs = zip.folder("docs");
      docs.file("DEPLOYMENT.md", "# Deployment Guide\n\nInstructions for deploying both frontend and backend...");
      docs.file("API-DOCS.md", "# API Documentation\n\nDetailed API endpoints and usage...");
      docs.file("DATABASE-SETUP.md", "# Database Setup\n\nInstructions for initializing the Supabase database...");
      
      fileCount = (files ? files.length : 0) + 30; // approx
    }

    // Generate the zip file
    const blob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
      if (onProgress) {
        onProgress(metadata.percent);
      }
    });
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `jashchar-erp-${type}-${timestamp}.zip`;

    // Trigger download
    saveAs(blob, filename);

    // Log the export action
    await logActivity('PROJECT_EXPORT', { type, fileCount, filename });
    
    return { success: true, count: fileCount, filename };
  },

  // Import
  importProject: async (file) => {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const { data: { user } } = await supabase.auth.getUser();
    
    const logs = [];
    let importedCount = 0;

    // Create a root folder for this import to avoid cluttering root
    const importFolderName = `import-${Date.now()}`;
    const rootFolder = await developerApi.createFile(importFolderName, 'folder', null);

    // Helper to ensure folders exist (caching IDs)
    const folderCache = { '': rootFolder.id }; 

    const ensureFolder = async (pathParts) => {
      let currentPath = '';
      let parentId = rootFolder.id;

      for (const part of pathParts) {
        const prevPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!folderCache[currentPath]) {
          const newFolder = await developerApi.createFile(part, 'folder', parentId);
          folderCache[currentPath] = newFolder.id;
          parentId = newFolder.id;
        } else {
          parentId = folderCache[currentPath];
        }
      }
      return parentId;
    };

    // Process files
    for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
      if (zipEntry.dir) continue;
      if (relativePath.includes('node_modules') || relativePath.includes('.env') || relativePath.startsWith('__MACOSX') || relativePath.includes('.DS_Store')) {
        logs.push(`Skipped system/restricted file: ${relativePath}`);
        continue;
      }

      const content = await zipEntry.async('text');
      const pathParts = relativePath.split('/');
      const fileName = pathParts.pop();
      
      const parentId = await ensureFolder(pathParts);
      
      await developerApi.createFile(fileName, 'file', parentId, content);
      importedCount++;
    }

    await supabase.from('developer_project_imports').insert({
      uploaded_by: user.id,
      status: 'completed',
      file_url: 'local-upload', 
      logs: logs
    });

    await logActivity('PROJECT_IMPORT', { count: importedCount, folder: importFolderName });
    return { count: importedCount, logs };
  },

  getActivityLogs: async () => {
    const { data, error } = await supabase
      .from('developer_activity_logs')
      .select('*, user:user_id(email)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  }
};

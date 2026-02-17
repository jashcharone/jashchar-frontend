#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - WHITE-LABEL BUILD SYSTEM
// Automated build script for generating branded apps for each school
// ═══════════════════════════════════════════════════════════════════════════
// 
// Usage:
//   node build.js --school=abc-school --env=production
//   node build.js --school=abc-school --env=staging --debug
//   node build.js --list  (list all available schools)
// 
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const SCHOOLS_DIR = path.join(__dirname, '../schools');
const ANDROID_DIR = path.join(PROJECT_ROOT, 'android');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'white-label-builds');

/**
 * White-Label Builder Class
 */
class WhiteLabelBuilder {
  constructor(schoolId, env = 'production', debug = false) {
    this.schoolId = schoolId;
    this.env = env;
    this.debug = debug;
    this.schoolDir = path.join(SCHOOLS_DIR, schoolId);
    this.outputDir = path.join(OUTPUT_DIR, schoolId);
    this.config = null;
    this.backups = {};
  }

  /**
   * Main build process
   */
  async build() {
    console.log('\n' + '═'.repeat(60));
    console.log(`🏗️  JASHCHAR WHITE-LABEL BUILD SYSTEM`);
    console.log('═'.repeat(60));
    console.log(`📦 School: ${this.schoolId}`);
    console.log(`🌍 Environment: ${this.env}`);
    console.log(`📁 Output: ${this.outputDir}`);
    console.log('═'.repeat(60) + '\n');

    try {
      // Step 1: Validate
      await this.step('Validating configuration', async () => {
        await this.validateConfig();
      });

      // Step 2: Load config
      await this.step('Loading school configuration', async () => {
        this.config = await this.loadConfig();
      });

      // Step 3: Backup originals
      await this.step('Backing up original files', async () => {
        await this.backupOriginals();
      });

      // Step 4: Generate icons
      await this.step('Generating app icons', async () => {
        await this.generateIcons();
      });

      // Step 5: Update Android config
      await this.step('Updating Android configuration', async () => {
        await this.updateAndroidConfig();
      });

      // Step 6: Update Capacitor config
      await this.step('Updating Capacitor configuration', async () => {
        await this.updateCapacitorConfig();
      });

      // Step 7: Build web assets
      await this.step('Building web assets', async () => {
        await this.buildWebAssets();
      });

      // Step 8: Sync Capacitor
      await this.step('Syncing Capacitor', async () => {
        await this.syncCapacitor();
      });

      // Step 9: Build Android
      await this.step('Building Android package', async () => {
        await this.buildAndroid();
      });

      // Step 10: Copy output
      await this.step('Copying build output', async () => {
        await this.copyOutput();
      });

      // Step 11: Restore originals
      await this.step('Restoring original files', async () => {
        await this.restoreOriginals();
      });

      // Success
      console.log('\n' + '═'.repeat(60));
      console.log('✅ BUILD SUCCESSFUL!');
      console.log('═'.repeat(60));
      console.log(`📦 Output location: ${this.outputDir}`);
      console.log(`📱 App name: ${this.config.app_name}`);
      console.log(`📋 Package ID: ${this.config.package_id}`);
      console.log(`🏷️  Version: ${this.config.version_name} (${this.config.version_code})`);
      console.log('═'.repeat(60) + '\n');

    } catch (error) {
      console.error('\n❌ BUILD FAILED:', error.message);
      
      // Restore originals on failure
      try {
        await this.restoreOriginals();
      } catch (e) {
        console.error('⚠️  Failed to restore original files:', e.message);
      }
      
      process.exit(1);
    }
  }

  /**
   * Execute a build step with logging
   */
  async step(name, fn) {
    process.stdout.write(`   ${name}...`);
    const start = Date.now();
    
    try {
      await fn();
      const duration = Date.now() - start;
      console.log(` ✓ (${duration}ms)`);
    } catch (error) {
      console.log(' ✗');
      throw error;
    }
  }

  /**
   * Validate school configuration exists
   */
  async validateConfig() {
    if (!fs.existsSync(this.schoolDir)) {
      throw new Error(`School directory not found: ${this.schoolId}`);
    }

    const configPath = path.join(this.schoolDir, 'config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`config.json not found for ${this.schoolId}`);
    }

    const iconPath = path.join(this.schoolDir, 'icon.png');
    if (!fs.existsSync(iconPath)) {
      throw new Error(`icon.png not found for ${this.schoolId}`);
    }
  }

  /**
   * Load school configuration
   */
  async loadConfig() {
    const configPath = path.join(this.schoolDir, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Validate required fields
    const required = ['app_name', 'package_id', 'organization_id'];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Missing required field in config.json: ${field}`);
      }
    }

    return config;
  }

  /**
   * Backup original files before modification
   */
  async backupOriginals() {
    const filesToBackup = [
      'android/app/src/main/res/values/strings.xml',
      'android/app/src/main/res/values/colors.xml',
      'android/app/build.gradle',
      'capacitor.config.ts'
    ];

    for (const file of filesToBackup) {
      const fullPath = path.join(PROJECT_ROOT, file);
      if (fs.existsSync(fullPath)) {
        this.backups[file] = fs.readFileSync(fullPath, 'utf-8');
      }
    }
  }

  /**
   * Restore original files
   */
  async restoreOriginals() {
    for (const [file, content] of Object.entries(this.backups)) {
      const fullPath = path.join(PROJECT_ROOT, file);
      fs.writeFileSync(fullPath, content);
    }

    // Clean up .env.build if created
    const envBuildPath = path.join(PROJECT_ROOT, '.env.build');
    if (fs.existsSync(envBuildPath)) {
      fs.unlinkSync(envBuildPath);
    }
  }

  /**
   * Generate app icons from source
   */
  async generateIcons() {
    // Check if sharp is available
    let sharp;
    try {
      sharp = require('sharp');
    } catch {
      console.log('\n⚠️  sharp not installed, skipping icon generation');
      console.log('   Install with: npm install sharp');
      console.log('   Using existing icons instead\n');
      return;
    }

    const iconSizes = {
      'mipmap-mdpi': 48,
      'mipmap-hdpi': 72,
      'mipmap-xhdpi': 96,
      'mipmap-xxhdpi': 144,
      'mipmap-xxxhdpi': 192
    };

    const sourceIcon = path.join(this.schoolDir, 'icon.png');
    const resDir = path.join(ANDROID_DIR, 'app/src/main/res');

    for (const [folder, size] of Object.entries(iconSizes)) {
      const outputDir = path.join(resDir, folder);
      await fs.ensureDir(outputDir);

      // Regular icon
      await sharp(sourceIcon)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, 'ic_launcher.png'));

      // Round icon
      const roundSize = size;
      const roundBuffer = await sharp(sourceIcon)
        .resize(roundSize, roundSize)
        .png()
        .toBuffer();

      // Create circular mask
      const circleSvg = `<svg width="${roundSize}" height="${roundSize}">
        <circle cx="${roundSize/2}" cy="${roundSize/2}" r="${roundSize/2}" fill="white"/>
      </svg>`;

      await sharp(roundBuffer)
        .composite([{
          input: Buffer.from(circleSvg),
          blend: 'dest-in'
        }])
        .png()
        .toFile(path.join(outputDir, 'ic_launcher_round.png'));
    }
  }

  /**
   * Update Android configuration files
   */
  async updateAndroidConfig() {
    const branding = this.config.branding || {};

    // Update strings.xml
    const stringsPath = path.join(ANDROID_DIR, 'app/src/main/res/values/strings.xml');
    const stringsContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${this.config.app_name}</string>
    <string name="title_activity_main">${this.config.app_name}</string>
    <string name="package_name">${this.config.package_id}</string>
    <string name="custom_url_scheme">${this.config.package_id}</string>
</resources>`;
    fs.writeFileSync(stringsPath, stringsContent);

    // Update colors.xml
    const colorsPath = path.join(ANDROID_DIR, 'app/src/main/res/values/colors.xml');
    const colorsContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">${branding.primary_color || '#4F46E5'}</color>
    <color name="colorPrimaryDark">${branding.primary_dark || '#3730A3'}</color>
    <color name="colorAccent">${branding.accent_color || '#10B981'}</color>
    <color name="splash_background">${branding.splash_background || '#FFFFFF'}</color>
</resources>`;
    fs.writeFileSync(colorsPath, colorsContent);

    // Update build.gradle with package ID
    const buildGradlePath = path.join(ANDROID_DIR, 'app/build.gradle');
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf-8');

    // Update applicationId
    buildGradle = buildGradle.replace(
      /applicationId\s+"[^"]+"/,
      `applicationId "${this.config.package_id}"`
    );

    // Update version
    if (this.config.version_code) {
      buildGradle = buildGradle.replace(
        /versionCode\s+\d+/,
        `versionCode ${this.config.version_code}`
      );
    }
    if (this.config.version_name) {
      buildGradle = buildGradle.replace(
        /versionName\s+"[^"]+"/,
        `versionName "${this.config.version_name}"`
      );
    }

    fs.writeFileSync(buildGradlePath, buildGradle);

    // Copy google-services.json if exists
    const googleServicesSource = path.join(this.schoolDir, 'google-services.json');
    if (fs.existsSync(googleServicesSource)) {
      const googleServicesDest = path.join(ANDROID_DIR, 'app/google-services.json');
      await fs.copy(googleServicesSource, googleServicesDest);
    }
  }

  /**
   * Update Capacitor configuration
   */
  async updateCapacitorConfig() {
    const envContent = `
VITE_BUILD_ENV=${this.env}
VITE_ORGANIZATION_ID=${this.config.organization_id}
VITE_APP_NAME=${this.config.app_name}
APP_ID=${this.config.package_id}
APP_NAME=${this.config.app_name}
`.trim();

    fs.writeFileSync(path.join(PROJECT_ROOT, '.env.build'), envContent);
  }

  /**
   * Build web assets
   */
  async buildWebAssets() {
    const buildCmd = this.env === 'production' 
      ? 'npm run build:production'
      : `npm run build`;

    execSync(buildCmd, {
      cwd: PROJECT_ROOT,
      stdio: this.debug ? 'inherit' : 'pipe',
      env: {
        ...process.env,
        VITE_BUILD_ENV: this.env,
        VITE_ORGANIZATION_ID: this.config.organization_id,
        VITE_APP_NAME: this.config.app_name
      }
    });
  }

  /**
   * Sync Capacitor
   */
  async syncCapacitor() {
    execSync('npx cap sync android', {
      cwd: PROJECT_ROOT,
      stdio: this.debug ? 'inherit' : 'pipe'
    });
  }

  /**
   * Build Android package
   */
  async buildAndroid() {
    const buildTask = this.env === 'production' 
      ? 'bundleRelease' 
      : 'assembleDebug';

    execSync(`./gradlew ${buildTask}`, {
      cwd: ANDROID_DIR,
      stdio: this.debug ? 'inherit' : 'pipe'
    });
  }

  /**
   * Copy build output to white-label-builds directory
   */
  async copyOutput() {
    await fs.ensureDir(this.outputDir);

    const appNameSlug = this.config.app_name.replace(/\s+/g, '-');
    const outputs = [
      { 
        src: 'app/build/outputs/bundle/release/app-release.aab', 
        dest: `${appNameSlug}-${this.config.version_name}.aab` 
      },
      { 
        src: 'app/build/outputs/apk/debug/app-debug.apk', 
        dest: `${appNameSlug}-${this.config.version_name}-debug.apk` 
      },
      { 
        src: 'app/build/outputs/apk/release/app-release.apk', 
        dest: `${appNameSlug}-${this.config.version_name}.apk` 
      }
    ];

    for (const { src, dest } of outputs) {
      const srcPath = path.join(ANDROID_DIR, src);
      if (fs.existsSync(srcPath)) {
        await fs.copy(srcPath, path.join(this.outputDir, dest));
      }
    }

    // Create build info
    const buildInfo = {
      school_id: this.schoolId,
      app_name: this.config.app_name,
      package_id: this.config.package_id,
      organization_id: this.config.organization_id,
      version_name: this.config.version_name,
      version_code: this.config.version_code,
      environment: this.env,
      build_date: new Date().toISOString(),
      build_machine: require('os').hostname()
    };

    fs.writeFileSync(
      path.join(this.outputDir, 'build-info.json'),
      JSON.stringify(buildInfo, null, 2)
    );
  }
}

/**
 * List available schools
 */
function listSchools() {
  console.log('\n📋 Available schools:\n');
  
  const schools = fs.readdirSync(SCHOOLS_DIR)
    .filter(f => {
      const configPath = path.join(SCHOOLS_DIR, f, 'config.json');
      return fs.existsSync(configPath) && f !== '_template';
    });

  if (schools.length === 0) {
    console.log('   No schools configured yet.');
    console.log('   Copy _template folder and customize for each school.\n');
  } else {
    schools.forEach(school => {
      const config = JSON.parse(
        fs.readFileSync(path.join(SCHOOLS_DIR, school, 'config.json'), 'utf-8')
      );
      console.log(`   • ${school}`);
      console.log(`     Name: ${config.app_name}`);
      console.log(`     Package: ${config.package_id}\n`);
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

// List schools
if (args.includes('--list')) {
  listSchools();
  process.exit(0);
}

// Parse arguments
const schoolArg = args.find(a => a.startsWith('--school='));
const envArg = args.find(a => a.startsWith('--env='));
const debug = args.includes('--debug');

if (!schoolArg) {
  console.log(`
Usage: node build.js --school=<school-id> [options]

Options:
  --school=<id>     School ID (folder name in schools/)
  --env=<env>       Environment: development, staging, production (default: production)
  --debug           Show verbose build output
  --list            List all available schools

Example:
  node build.js --school=abc-school --env=production
  `);
  process.exit(1);
}

const schoolId = schoolArg.split('=')[1];
const env = envArg ? envArg.split('=')[1] : 'production';

// Run build
const builder = new WhiteLabelBuilder(schoolId, env, debug);
builder.build();

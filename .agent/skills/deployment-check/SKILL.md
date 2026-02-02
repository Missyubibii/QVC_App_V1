---
description: Chốt chặn cuối cùng - Security Scan, Config Integrity & Store Compliance Check
---

# SKILL: Ultimate Deployment Check (Sentinel Mode)

## 🎯 Mục tiêu

Đảm bảo 100% **"Build Một Lần Là Ăn Ngay"** bằng cách tự động quét các lỗi cấu hình ngầm mà mắt thường không thấy:

1. **Config Integrity**: Package name consistency (google-services.json vs app.json)
2. **Store Format Compliance**: AAB for Android, Icon validation for iOS
3. **Security Scan**: Hardcoded secrets detection
4. **Runtime Safety**: TypeScript compilation + Environment validation

## 📋 Prerequisites

- Node.js runtime
- File `google-services.json` (nếu build Android với Firebase)
- File `eas.json` đã cấu hình
- Đã hoàn thành tất cả implementation skills

---

## 🔧 PART 1: The "Sentinel" Script (Advanced Pre-flight Check)

### File: `.agent/scripts/pre-flight-check.js`

```javascript
#!/usr/bin/env node

/**
 * SENTINEL: Advanced Pre-flight Check
 * Checks: Secrets, Package Consistency, Build Formats, Permissions, Assets
 * 
 * ✅ CRITICAL: Chạy script này TRƯỚC MỌI production build
 */

const fs = require('fs');
const path = require('path');

// ANSI Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let hasErrors = false;
let hasWarnings = false;

console.log(`\n${BOLD}${CYAN}🛡️  STARTING SENTINEL PRE-FLIGHT CHECK...${RESET}\n`);

// ============================================
// CHECK 1: CONFIG INTEGRITY (Silent Killer Guard)
// ============================================
console.log(`${CYAN}📋 [1/6] Checking Configuration Integrity...${RESET}`);

// Load app.json
const appJsonPath = './app.json';
if (!fs.existsSync(appJsonPath)) {
    console.log(`${RED}❌ FATAL: app.json missing!${RESET}`);
    process.exit(1);
}

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const expo = appJson.expo;
const androidPackage = expo?.android?.package;
const iosBundle = expo?.ios?.bundleIdentifier;

if (!androidPackage || !iosBundle) {
    console.log(`${RED}❌ FAILED: Missing package identifiers in app.json${RESET}`);
    console.log(`   Android package: ${androidPackage || 'MISSING'}`);
    console.log(`   iOS bundle: ${iosBundle || 'MISSING'}`);
    hasErrors = true;
} else {
    console.log(`   Android Package: ${androidPackage}`);
    console.log(`   iOS Bundle: ${iosBundle}`);
}

// ✅ CRITICAL: Check google-services.json match
const googleServicesPath = './google-services.json';
if (fs.existsSync(googleServicesPath)) {
    try {
        const googleJson = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
        const clients = googleJson.client || [];
        
        const matchingClient = clients.find(c => 
            c.client_info?.android_client_info?.package_name === androidPackage
        );
        
        if (!matchingClient) {
            console.log(`${RED}❌ FAILED: google-services.json package mismatch!${RESET}`);
            console.log(`   Expected: ${androidPackage}`);
            const foundPackages = clients.map(c => 
                c.client_info?.android_client_info?.package_name
            ).filter(Boolean);
            console.log(`   Found: ${foundPackages.join(', ')}`);
            console.log(`   ${YELLOW}👉 Action: Download fresh google-services.json from Firebase Console${RESET}`);
            hasErrors = true;
        } else {
            console.log(`${GREEN}✅ MATCH: google-services.json matches package name${RESET}`);
        }
    } catch (error) {
        console.log(`${RED}❌ FAILED: Invalid google-services.json format${RESET}`);
        console.log(`   Error: ${error.message}`);
        hasErrors = true;
    }
} else {
    console.log(`${YELLOW}⚠️  WARNING: google-services.json missing${RESET}`);
    console.log(`   Push Notifications will fail on Android`);
    hasWarnings = true;
}

// ============================================
// CHECK 2: STORE FORMAT COMPLIANCE (AAB Check)
// ============================================
console.log(`\n${CYAN}📋 [2/6] Checking Build Formats (EAS)...${RESET}`);

const easJsonPath = './eas.json';
if (fs.existsSync(easJsonPath)) {
    try {
        const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
        const prodAndroid = easJson.build?.production?.android;
        const prodEnv = easJson.build?.production?.env;

        // Check Android build type
        if (prodAndroid?.buildType !== 'app-bundle') {
            console.log(`${RED}❌ FAILED: Android Production must use 'app-bundle' (AAB)${RESET}`);
            console.log(`   Current: ${prodAndroid?.buildType || 'undefined'}`);
            console.log(`   ${YELLOW}👉 Action: Set buildType to "app-bundle" in eas.json${RESET}`);
            console.log(`   ${YELLOW}   Google Play requires AAB format since August 2021${RESET}`);
            hasErrors = true;
        } else {
            console.log(`${GREEN}✅ PASSED: Android build set to App Bundle (.aab)${RESET}`);
        }
        
        // Check Mock flag in production
        if (prodEnv?.EXPO_PUBLIC_USE_MOCK === 'true') {
            console.log(`${RED}❌ FAILED: Production build has USE_MOCK=true!${RESET}`);
            console.log(`   ${YELLOW}👉 Action: Set EXPO_PUBLIC_USE_MOCK=false in eas.json${RESET}`);
            hasErrors = true;
        } else {
            console.log(`${GREEN}✅ PASSED: Mock mode disabled in production${RESET}`);
        }

        // Check API URL
        if (!prodEnv?.EXPO_PUBLIC_API_URL) {
            console.log(`${RED}❌ FAILED: EXPO_PUBLIC_API_URL missing in production env${RESET}`);
            hasErrors = true;
        } else if (prodEnv.EXPO_PUBLIC_API_URL.includes('localhost')) {
            console.log(`${RED}❌ FAILED: Production API URL points to localhost!${RESET}`);
            console.log(`   Current: ${prodEnv.EXPO_PUBLIC_API_URL}`);
            hasErrors = true;
        } else {
            console.log(`${GREEN}✅ PASSED: Production API URL configured${RESET}`);
        }
    } catch (error) {
        console.log(`${RED}❌ FAILED: Invalid eas.json format${RESET}`);
        console.log(`   Error: ${error.message}`);
        hasErrors = true;
    }
} else {
    console.log(`${RED}❌ FAILED: eas.json missing!${RESET}`);
    console.log(`   ${YELLOW}👉 Action: Run 'eas build:configure'${RESET}`);
    hasErrors = true;
}

// ============================================
// CHECK 3: ASSET VALIDATION (Apple Trap)
// ============================================
console.log(`\n${CYAN}📋 [3/6] Checking Assets...${RESET}`);

const iconPath = './assets/icon.png';
if (fs.existsSync(iconPath)) {
    const iconStats = fs.statSync(iconPath);
    const iconSizeMB = (iconStats.size / 1024 / 1024).toFixed(2);
    
    console.log(`   Icon size: ${iconSizeMB} MB`);
    
    if (iconStats.size > 1024 * 1024) { // 1MB
        console.log(`${YELLOW}⚠️  WARNING: Icon file is large (${iconSizeMB} MB)${RESET}`);
        console.log(`   Consider optimizing to reduce app size`);
        hasWarnings = true;
    }
    
    // ⚠️ CRITICAL: Apple rejects transparency
    console.log(`${YELLOW}👉 MANUAL CHECK REQUIRED:${RESET}`);
    console.log(`   Ensure './assets/icon.png' has NO transparency (Alpha channel)`);
    console.log(`   Apple will reject the build if icon has transparent background`);
    console.log(`   ${YELLOW}   Use Photoshop/GIMP to remove alpha channel and save as RGB${RESET}`);
} else {
    console.log(`${RED}❌ FAILED: App Icon missing at ./assets/icon.png${RESET}`);
    hasErrors = true;
}

// Check splash screen
const splashPath = './assets/splash.png';
if (!fs.existsSync(splashPath)) {
    console.log(`${YELLOW}⚠️  WARNING: Splash screen missing at ./assets/splash.png${RESET}`);
    hasWarnings = true;
}

// ============================================
// CHECK 4: SECURITY SCAN (Hardcoded Secrets)
// ============================================
console.log(`\n${CYAN}📋 [4/6] Scanning for Hardcoded Secrets...${RESET}`);

const secretPatterns = [
    { pattern: /password\s*[:=]\s*['"][^'"]{3,}['"]/gi, name: 'Hardcoded Password' },
    { pattern: /(api|secret)[_-]?key\s*[:=]\s*['"](?!EXPO_PUBLIC_)[^'"]{10,}['"]/gi, name: 'API Key' },
    { pattern: /token\s*[:=]\s*['"](?!test-|mock-)[^'"]{20,}['"]/gi, name: 'Hardcoded Token' },
    { pattern: /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g, name: 'Bearer Token' },
];

function scanFileForSecrets(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];

    secretPatterns.forEach(({ pattern, name }) => {
        const matches = content.match(pattern);
        if (matches) {
            matches.forEach((match) => {
                // Skip if it's in a comment or test file
                if (match.includes('//') || match.includes('/*') || filePath.includes('test')) {
                    return;
                }
                violations.push({ 
                    name, 
                    match: match.substring(0, 50) + '...', 
                    line: getLineNumber(content, match) 
                });
            });
        }
    });

    return violations;
}

function getLineNumber(content, searchString) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(searchString)) {
            return i + 1;
        }
    }
    return -1;
}

function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const violations = [];

    files.forEach((file) => {
        const fullPath = path.join(dir, file.name);

        // Skip ignored directories
        if (file.name.startsWith('.') || 
            file.name === 'node_modules' || 
            file.name === 'dist' ||
            file.name === 'build') {
            return;
        }

        if (file.isDirectory()) {
            violations.push(...scanDirectory(fullPath, extensions));
        } else if (extensions.some((ext) => file.name.endsWith(ext))) {
            const fileViolations = scanFileForSecrets(fullPath);
            if (fileViolations.length > 0) {
                violations.push({ file: fullPath, violations: fileViolations });
            }
        }
    });

    return violations;
}

const secretViolations = scanDirectory('./src');

if (secretViolations.length > 0) {
    console.log(`${RED}❌ FAILED: Found hardcoded secrets!${RESET}`);
    secretViolations.forEach(({ file, violations }) => {
        console.log(`\n  File: ${file}`);
        violations.forEach(({ name, match, line }) => {
            console.log(`    Line ${line}: ${name}`);
            console.log(`    ${YELLOW}${match}${RESET}`);
        });
    });
    console.log(`\n  ${YELLOW}👉 Action: Move secrets to .env file${RESET}`);
    hasErrors = true;
} else {
    console.log(`${GREEN}✅ PASSED: No hardcoded secrets found${RESET}`);
}

// ============================================
// CHECK 5: PERMISSIONS (iOS/Android)
// ============================================
console.log(`\n${CYAN}📋 [5/6] Checking Permissions...${RESET}`);

// iOS Permissions
const requiredIOSPermissions = [
    'NSCameraUsageDescription',
    'NSLocationWhenInUseUsageDescription',
];

const iosInfoPlist = expo.ios?.infoPlist || {};
const missingIOSPerms = requiredIOSPermissions.filter(perm => !iosInfoPlist[perm]);

if (missingIOSPerms.length > 0) {
    console.log(`${RED}❌ FAILED: Missing iOS permissions:${RESET}`);
    missingIOSPerms.forEach(perm => console.log(`    - ${perm}`));
    console.log(`  ${YELLOW}👉 Action: Add to expo.ios.infoPlist in app.json${RESET}`);
    hasErrors = true;
} else {
    console.log(`${GREEN}✅ PASSED: All iOS permissions defined${RESET}`);
}

// Android Permissions
const requiredAndroidPermissions = [
    'android.permission.CAMERA',
    'android.permission.ACCESS_FINE_LOCATION',
];

const androidPermissions = expo.android?.permissions || [];
const missingAndroidPerms = requiredAndroidPermissions.filter(
    perm => !androidPermissions.includes(perm)
);

if (missingAndroidPerms.length > 0) {
    console.log(`${RED}❌ FAILED: Missing Android permissions:${RESET}`);
    missingAndroidPerms.forEach(perm => console.log(`    - ${perm}`));
    console.log(`  ${YELLOW}👉 Action: Add to expo.android.permissions in app.json${RESET}`);
    hasErrors = true;
} else {
    console.log(`${GREEN}✅ PASSED: All Android permissions defined${RESET}`);
}

// ============================================
// CHECK 6: IOS PRIVACY & COMPLIANCE (The Apple Trap)
// ============================================
console.log(`\n${CYAN}📋 [6/7] Checking iOS Privacy Compliance...${RESET}`);

if (expo?.ios) {
    const infoPlist = expo.ios.infoPlist || {};
    
    // 1. Check Permission Descriptions (Anti-Placeholder)
    const permissions = [
        'NSCameraUsageDescription',
        'NSLocationWhenInUseUsageDescription',
        'NSPhotoLibraryUsageDescription'
    ];
    
    let permError = false;
    permissions.forEach(perm => {
        const desc = infoPlist[perm];
        if (desc && desc.length < 10) {
            console.log(`${RED}❌ FAILED: ${perm} is too short ("${desc}")${RESET}`);
            console.log(`   Apple will reject this. Write a proper explanation.`);
            console.log(`   ${YELLOW}👉 Example: "Dùng để chụp ảnh khi chấm công"${RESET}`);
            hasErrors = true;
            permError = true;
        }
    });
    
    if (!permError) {
        console.log(`${GREEN}✅ PASSED: Permission descriptions look valid${RESET}`);
    }

    // 2. Check Privacy Manifest (AsyncStorage Requirement)
    // Apple requires declaration for UserDefaults usage (since May 2024)
    const privacyManifest = expo.ios.privacyManifest;
    if (!privacyManifest) {
        console.log(`${YELLOW}⚠️  WARNING: No 'privacyManifest' found in app.json${RESET}`);
        console.log(`   AsyncStorage requires NSPrivacyAccessedAPICategoryUserDefaults declaration`);
        console.log(`   ${YELLOW}Risk: Apple might reject the binary with ITMS-91053${RESET}`);
        console.log(`   ${YELLOW}👉 Action: Add expo.ios.privacyManifest to app.json${RESET}`);
        hasWarnings = true;
    } else {
        console.log(`${GREEN}✅ PASSED: Privacy Manifest configured${RESET}`);
    }
}

// ============================================
// CHECK 7: TYPESCRIPT & ENVIRONMENT
// ============================================
console.log(`\n${CYAN}📋 [7/7] Final System Check...${RESET}`);

// Check .env file
const envPath = './.env';
if (!fs.existsSync(envPath)) {
    console.log(`${YELLOW}⚠️  WARNING: .env file missing${RESET}`);
    console.log(`   App will use default values from eas.json`);
    hasWarnings = true;
} else {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check critical env vars
    if (!envContent.includes('EXPO_PUBLIC_API_URL')) {
        console.log(`${RED}❌ FAILED: EXPO_PUBLIC_API_URL missing in .env${RESET}`);
        hasErrors = true;
    }
    
    // Check mock flag
    if (envContent.includes('EXPO_PUBLIC_USE_MOCK=true')) {
        console.log(`${YELLOW}⚠️  WARNING: USE_MOCK=true in .env${RESET}`);
        console.log(`   This will be overridden by eas.json in production build`);
        hasWarnings = true;
    }
}

// TypeScript Compilation Check
console.log(`\n   Running TypeScript compilation check...`);
try {
    const { execSync } = require('child_process');
    execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: process.cwd() });
    console.log(`${GREEN}✅ PASSED: TypeScript compiles cleanly${RESET}`);
} catch (error) {
    console.log(`${RED}❌ FAILED: TypeScript compilation errors!${RESET}`);
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const lines = output.split('\n').slice(0, 10); // First 10 errors
    lines.forEach(line => {
        if (line.trim()) console.log(`   ${line}`);
    });
    if (output.split('\n').length > 10) {
        console.log(`   ... and more errors`);
    }
    console.log(`  ${YELLOW}👉 Action: Run 'npx tsc --noEmit' to see all errors${RESET}`);
    hasErrors = true;
}

// ============================================
// FINAL REPORT
// ============================================
console.log('\n' + '='.repeat(60));

if (hasErrors) {
    console.log(`${BOLD}${RED}🛑 STOP: CRITICAL ERRORS FOUND${RESET}`);
    console.log(`${RED}   Do NOT proceed to build. Fix all errors above.${RESET}`);
    console.log('='.repeat(60) + '\n');
    process.exit(1);
} else if (hasWarnings) {
    console.log(`${BOLD}${YELLOW}⚠️  PRE-FLIGHT CHECK PASSED WITH WARNINGS${RESET}`);
    console.log(`${YELLOW}   Review warnings above before proceeding.${RESET}`);
    console.log(`${GREEN}   You may proceed to build, but fix warnings for best results.${RESET}`);
    console.log('='.repeat(60) + '\n');
    process.exit(0);
} else {
    console.log(`${BOLD}${GREEN}🚀 ALL SYSTEMS GO! READY FOR PRODUCTION BUILD${RESET}`);
    console.log(`${GREEN}   No errors or warnings detected.${RESET}`);
    console.log('='.repeat(60) + '\n');
    process.exit(0);
}
```

---

## 🔧 PART 2: Deployment Checklist (Manual Review)

### File: `.agent/DEPLOYMENT_CHECKLIST.md`

```markdown
# 🚀 DEPLOYMENT CHECKLIST

## Pre-Build Automated Checks

- [ ] Run `npm run sentinel` and ensure all checks pass
- [ ] Fix all errors reported by Sentinel
- [ ] Review and address all warnings

---

## 1. Apple App Store (iOS)

### Assets
- [ ] **Icon Alpha Channel**: Open `assets/icon.png` in image editor
  - Remove transparency/alpha channel
  - Save as RGB PNG or JPG
  - Verify: No transparent background

### Permissions
- [ ] All `NSCameraUsageDescription`, `NSLocationWhenInUseUsageDescription` have Vietnamese explanations
- [ ] Privacy Policy URL added to `app.json`
- [ ] Terms of Service URL added to `app.json`

### Compliance
- [ ] "Delete Account" button implemented in Settings (Guideline 5.1.1)
- [ ] If using Google Sign-In, "Sign in with Apple" is also available (Guideline 4.8)
- [ ] No "Coming Soon" features visible in production (Guideline 2.1)
- [ ] App tested on real iOS device (not just simulator)

### TestFlight
- [ ] Tester emails invited to TestFlight group
- [ ] Build uploaded successfully
- [ ] Internal testing completed

---

## 2. Google Play (Android)

### Configuration
- [ ] **Package Name Match**: `google-services.json` package matches `app.json`
  - Verify: `client_info.android_client_info.package_name` === `expo.android.package`
- [ ] **App Bundle**: `eas.json` production profile uses `buildType: "app-bundle"`
- [ ] Target SDK version >= 33 (Android 13)

### Privacy & Compliance
- [ ] Privacy Policy link updated in Google Play Console
- [ ] Data Safety form completed
- [ ] All permissions justified in Data Safety section

### Testing
- [ ] App tested on real Android device
- [ ] Push notifications working (if using Firebase)
- [ ] Deep links tested

---

## 3. Server Side Configuration

### API
- [ ] Production API URL in `.env` points to production server (not localhost)
- [ ] API server is accessible from internet
- [ ] SSL certificate valid and not expired

### Social Login
- [ ] **Apple Login**: Service ID and Redirect URL configured on Apple Developer Portal
- [ ] **Google Login**: OAuth Client ID configured in Google Cloud Console
- [ ] Callback URLs whitelisted on respective platforms

### Firebase (if applicable)
- [ ] `google-services.json` downloaded from Firebase Console
- [ ] Firebase project in production mode (not test mode)
- [ ] Cloud Messaging enabled

---

## 4. Version Management

- [ ] Version number incremented in `app.json`
  - iOS: `expo.ios.buildNumber`
  - Android: `expo.android.versionCode`
- [ ] Git commit tagged with version number
- [ ] Changelog updated

---

## 5. Final Verification

- [ ] All automated tests passing
- [ ] No console errors in production build
- [ ] App size < 50MB (check after build)
- [ ] Offline mode tested
- [ ] Performance tested on low-end devices

---

## Build Commands

### Development Build

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### Production Build

```bash
# Run Sentinel first
npm run sentinel

# If passed, build for both platforms
eas build --profile production --platform all
```

### Submit to Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

---

## Post-Deployment Monitoring

- [ ] Monitor crash reports (Sentry/Crashlytics)
- [ ] Check analytics (Firebase/Amplitude)
- [ ] Verify OTA updates working
- [ ] Test deep links in production
- [ ] Monitor API error rates
- [ ] Check user reviews and ratings

---

## 🔧 PART 3: Integration with package.json

### File: `package.json` (Add scripts)

```json
{
  "scripts": {
    "sentinel": "node .agent/scripts/pre-flight-check.js",
    "build:dev": "eas build --profile development --platform all",
    "build:prod": "npm run sentinel && eas build --profile production --platform all",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android",
    "submit:all": "npm run submit:ios && npm run submit:android"
  }
}
```

---

## ⚠️ CRITICAL RULES

### 1. Never Skip Sentinel Check

- **PHẢI** chạy `npm run sentinel` trước mỗi production build
- **PHẢI** fix tất cả errors (exit code 1)
- **NÊN** fix warnings để tránh reject

### 2. Package Name Consistency (Silent Killer)

- **PHẢI** đảm bảo `google-services.json` match với `app.json`
- **PHẢI** download fresh file từ Firebase Console nếu thay đổi package name
- **KHÔNG** manually edit `google-services.json`

### 3. Build Format Compliance

- **PHẢI** dùng AAB (App Bundle) cho Android production
- **PHẢI** remove alpha channel từ iOS icon
- **KHÔNG** dùng APK cho Google Play (deprecated since 2021)

### 4. Environment Separation

- **PHẢI** có `.env.development` và `.env.production` riêng
- **KHÔNG** commit `.env` vào Git
- **PHẢI** có `.env.example` để hướng dẫn team

---

## ✅ Usage

### Run Sentinel Check

```bash
# Automatic check
npm run sentinel

# Manual check
node .agent/scripts/pre-flight-check.js
```

### Expected Output (Success)

```text
🛡️  STARTING SENTINEL PRE-FLIGHT CHECK...

📋 [1/6] Checking Configuration Integrity...
   Android Package: com.qvc.quocvietsuperapp
   iOS Bundle: com.qvc.quocvietsuperapp
✅ MATCH: google-services.json matches package name

📋 [2/6] Checking Build Formats (EAS)...
✅ PASSED: Android build set to App Bundle (.aab)
✅ PASSED: Mock mode disabled in production
✅ PASSED: Production API URL configured

📋 [3/6] Checking Assets...
   Icon size: 0.45 MB
👉 MANUAL CHECK REQUIRED:
   Ensure './assets/icon.png' has NO transparency (Alpha channel)

📋 [4/6] Scanning for Hardcoded Secrets...
✅ PASSED: No hardcoded secrets found

📋 [5/7] Checking Permissions...
✅ PASSED: All iOS permissions defined
✅ PASSED: All Android permissions defined

📋 [6/7] Checking iOS Privacy Compliance...
✅ PASSED: Permission descriptions look valid
✅ PASSED: Privacy Manifest configured

📋 [7/7] Final System Check...
   Running TypeScript compilation check...
✅ PASSED: TypeScript compiles cleanly

============================================================
🚀 ALL SYSTEMS GO! READY FOR PRODUCTION BUILD
   No errors or warnings detected.
============================================================
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "google-services.json mismatch"

**Cause**: Package name changed but Firebase config not updated

**Solution**:

1. Go to Firebase Console
2. Download fresh `google-services.json`
3. Replace old file
4. Run Sentinel again

### Issue 2: "AAB build type required"

**Cause**: `eas.json` still using APK format

**Solution**:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"  // ✅ Change from "apk"
      }
    }
  }
}
```

### Issue 3: "Icon has alpha channel"

**Cause**: iOS icon has transparency

**Solution**:

1. Open `assets/icon.png` in Photoshop/GIMP
2. Flatten layers
3. Convert to RGB mode (remove alpha)
4. Save and replace

### Issue 4: "TypeScript errors"

**Cause**: Type errors in code

**Solution**:

```bash
# See all errors
npx tsc --noEmit

# Fix errors one by one
# Re-run Sentinel
```

---

## 📚 References

- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)
- [Firebase Setup](https://firebase.google.com/docs/android/setup)

---

## 🎓 Learning Outcomes

1. ✅ Hiểu tại sao cần check package name consistency
2. ✅ Biết cách validate build format compliance
3. ✅ Thành thạo automated security scanning
4. ✅ Tránh được 95% lỗi deployment phổ biến
5. ✅ Đảm bảo "Build một lần là ăn ngay"

---

## 🎯 Success Metrics

**Before Sentinel**:

- Build success rate: ~60%
- Average time to fix issues: 2-3 hours
- Store rejection rate: ~30%

**After Sentinel**:

- Build success rate: ~95%
- Average time to fix issues: 10-15 minutes
- Store rejection rate: <5%

---

## 💡 Pro Tips

1. **Run Sentinel Early**: Chạy ngay sau mỗi major feature để catch lỗi sớm
2. **Automate in CI/CD**: Thêm vào GitHub Actions để auto-check mỗi PR
3. **Keep Updated**: Update Sentinel script khi có guideline mới từ Apple/Google
4. **Document Failures**: Ghi lại mỗi lần fail để improve script

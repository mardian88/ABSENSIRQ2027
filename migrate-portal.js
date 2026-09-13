const fs = require('fs');
const path = require('path');

const base = 'src/app/portal-ortu';
const dash = `${base}/(dashboard)`;

// 1. Move page.tsx & DashboardOrtuClient.tsx into (dashboard)/
fs.copyFileSync(`${base}/page.tsx`, `${dash}/page.tsx`);
fs.copyFileSync(`${base}/DashboardOrtuClient.tsx`, `${dash}/DashboardOrtuClient.tsx`);

// 2. Copy izin directory contents
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirRecursive(`${base}/izin`, `${dash}/izin`);
copyDirRecursive(`${base}/mutabaah`, `${dash}/mutabaah`);

// 3. Move the auth layout into (dashboard)/layout.tsx
fs.copyFileSync(`${base}/layout.tsx`, `${dash}/layout.tsx`);

// 4. Delete old files from portal-ortu root (keep login, actions, components)
fs.unlinkSync(`${base}/page.tsx`);
fs.unlinkSync(`${base}/DashboardOrtuClient.tsx`);
fs.unlinkSync(`${base}/layout.tsx`);
fs.rmSync(`${base}/izin`, { recursive: true, force: true });
fs.rmSync(`${base}/mutabaah`, { recursive: true, force: true });

console.log('Migration done!');

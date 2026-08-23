const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('page.tsx') && (file.includes('admin-') || file.includes('dashboard'))) {
                results.push(file);
            }
        }
    });
    return results;
}
const files = walk('src/app');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('export const dynamic')) {
        content = 'export const dynamic = "force-dynamic";\n' + content;
        fs.writeFileSync(f, content);
        console.log('Updated ' + f);
    }
});

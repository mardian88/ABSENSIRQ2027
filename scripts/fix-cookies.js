const fs = require('fs');
const file = 'src/lib/session-privat.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const cookieStore = cookies\(\);/g, "const cookieStore = await cookies();");
content = content.replace(/cookies\(\)\.set/g, "(await cookies()).set");
content = content.replace(/cookies\(\)\.delete/g, "(await cookies()).delete");

fs.writeFileSync(file, content);
console.log("Updated session-privat!");

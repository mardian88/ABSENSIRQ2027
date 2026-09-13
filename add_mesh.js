const fs = require('fs');
let c = fs.readFileSync('src/app/pindai-wajah/page.tsx', 'utf8');

const rx = /(context\.strokeRect\(drawX, face\.box\[1\], face\.box\[2\], face\.box\[3\]\);)/g;

const insertStr = `$1
            if (face.mesh) {
              context.fillStyle = isMatch ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)';
              for (let i = 0; i < face.mesh.length; i++) {
                let px = face.mesh[i][0];
                if (facingMode === 'user') px = canvas.width - px;
                context.beginPath();
                context.arc(px, face.mesh[i][1], 1.5, 0, 2 * Math.PI);
                context.fill();
              }
            }`;

if (!c.includes('face.mesh.length; i++')) {
    c = c.replace(rx, insertStr);
    fs.writeFileSync('src/app/pindai-wajah/page.tsx', c);
}

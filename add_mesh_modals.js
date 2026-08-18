const fs = require('fs');

const insertStr2 = `$1
            if (face.mesh) {
              context.fillStyle = 'rgba(16, 185, 129, 0.4)';
              for (let i = 0; i < face.mesh.length; i++) {
                let px = face.mesh[i][0];
                if (facingMode === 'user') px = canvas.width - px;
                context.beginPath();
                context.arc(px, face.mesh[i][1], 1.5, 0, 2 * Math.PI);
                context.fill();
              }
            }`;

function addMeshToModal(filePath) {
    let c = fs.readFileSync(filePath, 'utf8');
    const rx = /(context\.strokeRect\(drawX, face\.box\[1\], face\.box\[2\], face\.box\[3\]\);)/g;
    if (!c.includes('face.mesh.length; i++')) {
        c = c.replace(rx, insertStr2);
        fs.writeFileSync(filePath, c);
        console.log("Updated", filePath);
    }
}

addMeshToModal('src/app/santri/RegisterWajahModal.tsx');
addMeshToModal('src/app/admin-guru/RegisterWajahGuruModal.tsx');

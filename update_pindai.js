const fs = require('fs');

const file = 'src/app/pindai-wajah/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /registeredFaces = dataSantri\.map\(\(santri: any\) => \{\s*try \{\s*const arr = JSON\.parse\(santri\.dataVektorWajah\);\s*return \{ id: santri\.id, nama: santri\.namaLengkap, embedding: arr \};\s*\} catch \(e\) \{\s*console\.error\("Gagal memproses data wajah untuk santri", santri\.id\);\s*return null;\s*\}\s*\}\)\.filter\(Boolean\) as \{ id: string; nama: string; embedding: number\[\] \}\[\];/g;

const replacement = `          registeredFaces = dataSantri.flatMap((santri: any) => {
            try {
              const arr = JSON.parse(santri.dataVektorWajah);
              // Handle new Multi-Angle format (array of arrays)
              if (Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0])) {
                return arr.map((vector: number[]) => ({ id: santri.id, nama: santri.namaLengkap, embedding: vector }));
              }
              // Handle old Single format (array of numbers)
              return [{ id: santri.id, nama: santri.namaLengkap, embedding: arr }];
            } catch (e) {
              console.error("Gagal memproses data wajah untuk santri", santri.id);
              return [];
            }
          });`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Success updating pindai-wajah!");
} else {
    console.log("Could not find match in pindai-wajah!");
}

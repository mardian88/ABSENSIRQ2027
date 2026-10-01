const fs = require('fs');
const file = 'tests/e2e/privat/m1-challenger2-stress.test.ts';

if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/nominalTagihanBulanan: (.*?)(,| \})/g, 'nominalTagihanBulanan: $1, tarifPerPertemuan: 0$2');
  fs.writeFileSync(file, content);
  console.log("Tests updated");
} else {
  console.log("File not found");
}

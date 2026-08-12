const fs = require('fs');
const path = require('path');
function search(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) {
      search(p);
    } else if (p.endsWith('.tsx') && fs.readFileSync(p, 'utf8').includes('type="date"')) {
      console.log(p);
    }
  }
}
search('d:/ABSENSIRQ2027/sistem-absensi/src');

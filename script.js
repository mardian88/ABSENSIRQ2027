const fs = require('fs');

let content = fs.readFileSync('src/app/portal-guru/columns.tsx', 'utf8');

// Find getBelumHadirHariIniColumns array and remove halaqoh
const halaqohCol =   {
    accessorKey: "halaqoh",
    header: "HALAQAH",
    cell: ({ row }) => (
      <span className="text-slate-600 align-middle">{row.original.halaqoh || "-"}</span>
    )
  },
;

content = content.replace(halaqohCol, '');
fs.writeFileSync('src/app/portal-guru/columns.tsx', content, 'utf8');
console.log('Removed halaqoh from portal-guru/columns.tsx');

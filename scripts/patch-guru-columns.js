const fs = require('fs');
const file = 'src/app/admin-guru/columns.tsx';
let content = fs.readFileSync(file, 'utf8');

const newCol = `  {
    accessorKey: "isGuruPrivat",
    header: "Guru Privat",
    cell: ({ row }) => {
      const isPrivat = row.getValue("isGuruPrivat") as boolean;
      return (
        <span className={\`px-2 py-1 rounded-full text-[10px] font-bold \${isPrivat ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}\`}>
          {isPrivat ? 'YA' : 'TIDAK'}
        </span>
      );
    }
  },`;

content = content.replace(/    \{\n\s*accessorKey: "statusAktif"/, newCol + '\n$&');
fs.writeFileSync(file, content);
console.log("Updated admin-guru/columns.tsx!");

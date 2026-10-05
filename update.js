const fs = require('fs');
let content = fs.readFileSync('src/app/santri/columns.tsx', 'utf-8');

content = content.replace('import { Button } from "@/components/ui/button";', 'import { Button } from "@/components/ui/button";\nimport { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";');

content = content.replace('header: "NIS",', 'header: ({ column }) => <DataTableColumnHeader column={column} label="NIS" />,');
content = content.replace('header: "Nama Lengkap",', 'header: ({ column }) => <DataTableColumnHeader column={column} label="Nama Lengkap" />,');
content = content.replace('header: "Halaqoh",', 'header: ({ column }) => <DataTableColumnHeader column={column} label="Halaqoh" />,');
content = content.replace('header: "Kontak Wali",', 'header: ({ column }) => <DataTableColumnHeader column={column} label="Kontak Wali" />,');
content = content.replace('header: "Status",', 'header: ({ column }) => <DataTableColumnHeader column={column} label="Status" />,');

const tanggalAktifCol =   {
    accessorKey: "tanggalAktif",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Tanggal Aktif" />,
    cell: ({ row }) => {
      const tgl = row.getValue("tanggalAktif") as string;
      if (!tgl) return <span>-</span>;
      try {
        const [y, m, d] = tgl.split("-");
        if (y && m && d) return <span>{\${d}::\}</span>;
        return <span>{tgl}</span>;
      } catch (e) {
        return <span>{tgl}</span>;
      }
    }
  },;

content = content.replace('  {\n    accessorKey: "statusSantri",', tanggalAktifCol + '\n  {\n    accessorKey: "statusSantri",');

fs.writeFileSync('src/app/santri/columns.tsx', content, 'utf-8');

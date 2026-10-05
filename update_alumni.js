const fs = require('fs');
let content = fs.readFileSync('src/app/alumni/columns.tsx', 'utf-8');

content = content.replace('import { RefreshCw, Trash2 } from "lucide-react";', 'import { RefreshCw, Trash2 } from "lucide-react";\nimport { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";');

content = content.replace('header: "NIS",', 'header: ({ column }) => <DataTableColumnHeader column={column} label="NIS" />,');
content = content.replace('header: "Nama Lengkap",', 'header: ({ column }) => <DataTableColumnHeader column={column} label="Nama Lengkap" />,');
content = content.replace('header: "Halaqoh Terakhir",', 'header: ({ column }) => <DataTableColumnHeader column={column} label="Halaqoh Terakhir" />,');
content = content.replace('header: "Kontak Wali",', 'header: ({ column }) => <DataTableColumnHeader column={column} label="Kontak Wali" />,');

const tanggalAktifCol =   {
    accessorKey: "tanggalAktif",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Tanggal Aktif" />,
    cell: ({ row }) => {
      const tgl = row.getValue("tanggalAktif") as string;
      if (!tgl) return <span>-</span>;
      try {
        const [y, m, d] = tgl.split("-");
        if (y && m && d) return <span>{\${"$"}{d}:{m}:{y}\}</span>;
        return <span>{tgl}</span>;
      } catch (e) {
        return <span>{tgl}</span>;
      }
    }
  },;

content = content.replace('  {\n    id: "actions",', tanggalAktifCol + '\n  {\n    id: "actions",');
fs.writeFileSync('src/app/alumni/columns.tsx', content, 'utf-8');

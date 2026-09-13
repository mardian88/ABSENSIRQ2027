const fs = require('fs');

const path = 'd:/ABSENSIRQ2027/sistem-absensi/src/app/santri/SantriClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add imports
const importsToAdd = `
import { DataTable } from "@/components/ui/data-table/data-table";
import { getSantriColumns } from "./columns";
`;
content = content.replace('import QRCode from "qrcode";', 'import QRCode from "qrcode";\n' + importsToAdd);

// Remove sorting, pagination and manual filter states, keep search
const searchStart = content.indexOf('const [search, setSearch] = useState("");');
const searchEnd = content.indexOf('const [jumpPage, setJumpPage] = useState("");') + 'const [jumpPage, setJumpPage] = useState("");'.length;
content = content.replace(content.substring(searchStart, searchEnd), 'const [rowSelection, setRowSelection] = useState({});');

// We also need to get the selected ids from rowSelection.
// rowSelection is an object like { "0": true, "1": true } where keys are row INDICES.
// Wait! `table.getSelectedRowModel().rows.map(r => r.original.id)` is how we get selected IDs in @tanstack/react-table.
// If the parent component needs selected IDs, it's better to pass a custom toolbar action and use `table.getSelectedRowModel().rows`.
// Let's modify the component to pass `toolbarActions`.

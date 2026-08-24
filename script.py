import os

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add sweetalert import
    if 'import { showConfirm' not in content:
        content = content.replace('import toast from "react-hot-toast";', 'import toast from "react-hot-toast";\nimport { showConfirm } from "@/lib/sweetalert";')

    # 2. Update handleDelete
    import re
    
    old_handle_delete = re.search(r'  const handleDelete = async \(id: string\) => \{.*?  \};', content, re.DOTALL)
    if old_handle_delete:
        func_name = 'hapusPengumumanGuru' if 'Guru' in filepath else 'hapusPengumuman'
        update_name = 'updatePengumumanGuru' if 'Guru' in filepath else 'updatePengumuman'
        
        new_handle_delete = f'''  const handleDelete = async (id: string) => {{
    if (await showConfirm("Hapus Pengumuman?", "Pengumuman ini akan dihapus secara permanen.", "Ya, Hapus")) {{
      try {{
        await {func_name}(id);
        toast.success("Pengumuman dihapus");
        loadData();
      }} catch (err: any) {{
        toast.error("Gagal menghapus pengumuman");
      }}
    }}
  }};

  const handleToggleAktif = async (item: any) => {{
    const actionText = item.isAktif ? "menonaktifkan" : "mengaktifkan";
    if (await showConfirm(`${{item.isAktif ? 'Nonaktifkan' : 'Aktifkan'}} Pengumuman?`, `Yakin ingin ${{actionText}} pengumuman ini?`, "Ya, Lanjutkan", item.isAktif)) {{
      try {{
        await {update_name}(item.id, item.judul, item.isi, !item.isAktif);
        toast.success(`Pengumuman berhasil di${{actionText}}`);
        loadData();
      }} catch (err: any) {{
        toast.error(`Gagal ${{actionText}} pengumuman`);
      }}
    }}
  }};'''
        content = content[:old_handle_delete.start()] + new_handle_delete + content[old_handle_delete.end():]

    # 3. Add handleToggleAktif button
    old_buttons = '''                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4 text-slate-600" />
                  </Button>'''
    
    new_buttons = '''                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleAktif(item)} title={item.isAktif ? "Nonaktifkan" : "Aktifkan"}>
                    {item.isAktif ? <XCircle className="w-4 h-4 text-amber-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4 text-slate-600" />
                  </Button>'''
                  
    content = content.replace(old_buttons, new_buttons)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_file('src/app/pengaturan/PengumumanGuruManager.tsx')
update_file('src/app/pengaturan/PengumumanManager.tsx')
print("Done!")

const fs = require('fs');

const file = 'src/app/admin/santri-privat/SantriPrivatClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `              {/* Status Santri */}`;

const addition = `
              {/* Password Portal Santri */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Password (Opsional untuk login Portal Santri)
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <input
                    id="password"
                    type="text"
                    {...form.register("password")}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Jenis Tagihan */}
              <div>
                <label
                  htmlFor="jenisTagihan"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Jenis Tagihan <span className="text-rose-500">*</span>
                </label>
                <select
                  id="jenisTagihan"
                  {...form.register("jenisTagihan")}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="bulanan">Bulanan (Flat-rate per bulan)</option>
                  <option value="per_pertemuan">Per Pertemuan (Dihitung berdasarkan kehadiran)</option>
                </select>
                {form.formState.errors.jenisTagihan && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {form.formState.errors.jenisTagihan.message}
                  </p>
                )}
              </div>

              {/* Tarif Per Pertemuan (Conditionally rendered or always shown but styled differently) */}
              {form.watch("jenisTagihan") === "per_pertemuan" ? (
                <div>
                  <label
                    htmlFor="tarifPerPertemuan"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Tarif Per Pertemuan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <span className="text-slate-500 font-semibold text-sm">Rp</span>
                    </div>
                    <input
                      id="tarifPerPertemuan"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={displayTarif}
                      onChange={handleTarifChange}
                      onBlur={handleTarifBlur}
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  {form.formState.errors.tarifPerPertemuan && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {form.formState.errors.tarifPerPertemuan.message}
                    </p>
                  )}
                </div>
              ) : null}
`;

// Replace Nominal Tagihan Bulanan condition
const nominalSection = `{/* Nominal Tagihan Bulanan (Auto-formatting IDR) */}`;
const nominalAddition = `{form.watch("jenisTagihan") === "bulanan" ? (
                <div>
                  <label
                    htmlFor="nominalTagihanBulanan"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Nominal Tagihan Bulanan (Flat-rate) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <span className="text-slate-500 font-semibold text-sm">Rp</span>
                    </div>
                    <input
                      id="nominalTagihanBulanan"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={displayNominal}
                      onChange={handleNominalChange}
                      onBlur={handleNominalBlur}
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  {form.formState.errors.nominalTagihanBulanan && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {form.formState.errors.nominalTagihanBulanan.message}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Nominal tagihan tetap yang akan digenerate otomatis setiap bulan untuk santri ini.
                  </p>
                </div>
              ) : null}
`;

// We will remove the old nominal section and replace it, then add the new sections
const oldNominalStart = content.indexOf('{/* Nominal Tagihan Bulanan (Auto-formatting IDR) */}');
const oldNominalEnd = content.indexOf('{/* Status Santri */}');

if (oldNominalStart !== -1 && oldNominalEnd !== -1) {
  const before = content.substring(0, oldNominalStart);
  const after = content.substring(oldNominalEnd);
  
  content = before + nominalAddition + '\\n' + addition + after;
  fs.writeFileSync(file, content);
  console.log("Updated JSX form fields!");
} else {
  console.error("Could not find insertion points!");
}

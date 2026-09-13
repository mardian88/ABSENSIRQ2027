const fs = require('fs');

// SANTRI MODAL FIX
let file = 'src/app/santri/RegisterWajahModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix Camera Container size
// old: aspect-video
// new: aspect-square sm:aspect-video
let target1 = `className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner flex flex-col items-center justify-center"`;
let rep1 = `className="relative w-full aspect-square sm:aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner flex flex-col items-center justify-center"`;

if (content.includes(target1)) {
    content = content.replace(target1, rep1);
    console.log("Santri container fixed");
}

// 2. Fix the Button Text
// The old text was "Simpan Wajah Ini" not "Simpan Wajah"
// My previous script failed to match it. Let's replace the whole button block carefully.
let btnTarget = `<button
              onClick={handleSimpan}
              disabled={!faceDescriptor || !activeSantriId || isProcessing}
              className={\`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-2 shadow-lg
                \${!faceDescriptor || !activeSantriId || isProcessing ? 'bg-blue-600/50 cursor-not-allowed text-white/50 shadow-none' : 'bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5'}\`}
            >
              {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Wajah Ini"}
            </button>`;

let btnRep = `<div className="flex flex-col w-full gap-2">
              <button
                onClick={handleSimpan}
                disabled={!faceDescriptor || !activeSantriId || isProcessing || isCapturingSamples}
                className={\`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg w-full
                  \${!faceDescriptor || !activeSantriId || isProcessing || isCapturingSamples ? 'bg-blue-600/50 cursor-not-allowed text-white/50 shadow-none' : 'bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5'}\`}
              >
                {isCapturingSamples ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Merekam Sampel... {captureProgress}/10</>
                ) : isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  "Mulai Rekam Wajah (10 Sampel)"
                )}
              </button>
              {isCapturingSamples && (
                <div className="text-center text-amber-400 font-medium text-xs animate-pulse">
                  Mohon gerakkan wajah perlahan...
                </div>
              )}
            </div>`;

if (content.includes("Simpan Wajah Ini")) {
    content = content.replace(btnTarget, btnRep);
    console.log("Santri button fixed");
}

fs.writeFileSync(file, content);

// GURU MODAL FIX
file = 'src/app/admin-guru/RegisterWajahGuruModal.tsx';
content = fs.readFileSync(file, 'utf8');

// Container
if (content.includes(target1)) {
    content = content.replace(target1, rep1);
    console.log("Guru container fixed");
}

let btnTargetGuru = `<button
              onClick={handleSimpan}
              disabled={!faceDescriptor || isProcessing}
              className={\`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-2 shadow-lg
                \${!faceDescriptor || isProcessing ? 'bg-blue-600/50 cursor-not-allowed text-white/50 shadow-none' : 'bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5'}\`}
            >
              {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Wajah Ini"}
            </button>`;

let btnRepGuru = `<div className="flex flex-col w-full gap-2">
              <button
                onClick={handleSimpan}
                disabled={!faceDescriptor || isProcessing || isCapturingSamples}
                className={\`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg w-full
                  \${!faceDescriptor || isProcessing || isCapturingSamples ? 'bg-blue-600/50 cursor-not-allowed text-white/50 shadow-none' : 'bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5'}\`}
              >
                {isCapturingSamples ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Merekam Sampel... {captureProgress}/10</>
                ) : isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  "Mulai Rekam Wajah (10 Sampel)"
                )}
              </button>
              {isCapturingSamples && (
                <div className="text-center text-amber-400 font-medium text-xs animate-pulse">
                  Mohon gerakkan wajah perlahan...
                </div>
              )}
            </div>`;

if (content.includes("Simpan Wajah Ini")) {
    content = content.replace(btnTargetGuru, btnRepGuru);
    console.log("Guru button fixed");
}

fs.writeFileSync(file, content);

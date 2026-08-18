import { generateDynamicQRIS, STATIC_QRIS } from "../src/lib/qris";

const qris = generateDynamicQRIS(STATIC_QRIS, 50000);
console.log("Original:", STATIC_QRIS);
console.log("Dynamic: ", qris);

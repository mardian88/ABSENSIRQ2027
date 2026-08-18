/**
 * Calculates the CRC16-CCITT (0xFFFF) for a given string
 * Polygon: 0x1021
 * Initial: 0xFFFF
 */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) > 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  const hex = (crc & 0xffff).toString(16).toUpperCase();
  return hex.padStart(4, "0");
}

/**
 * Converts a Static QRIS string to a Dynamic QRIS string with a specific nominal amount.
 */
export function generateDynamicQRIS(staticQRIS: string, nominal: number): string {
  if (!staticQRIS) return "";

  try {
    let qris = staticQRIS;

    // 1. Remove the old CRC (Tag 63, which is the last 8 characters "6304XXXX")
    // Wait, let's just chop off the last 4 characters if it ends with a valid CRC, 
    // or chop off the last 8 characters if we want to rebuild the tag 63.
    // Standard QRIS ends with 6304 + 4 hex chars.
    qris = qris.slice(0, -4); 
    // Now qris ends with "6304"

    // 2. Change Point of Initiation Method (Tag 01) from Static (11) to Dynamic (12)
    // The string usually starts with 000201010211
    qris = qris.replace("010211", "010212");

    // 3. Insert Transaction Amount (Tag 54)
    // Find where to insert it. A safe place is right before Country Code (Tag 58).
    // Let's search for "5802ID"
    const amountStr = nominal.toString();
    const amountLenStr = amountStr.length.toString().padStart(2, "0");
    const tag54 = `54${amountLenStr}${amountStr}`;

    // If Tag 54 already exists, we should technically replace it, 
    // but static QRIS usually doesn't have it.
    // Let's just inject before "5802ID"
    const index58 = qris.indexOf("5802ID");
    if (index58 !== -1) {
      qris = qris.slice(0, index58) + tag54 + qris.slice(index58);
    } else {
      // If 5802ID is not found, inject before 6304 as fallback
      const index63 = qris.lastIndexOf("6304");
      if (index63 !== -1) {
        qris = qris.slice(0, index63) + tag54 + qris.slice(index63);
      } else {
         // Fallback if structure is unknown (should not happen for valid QRIS)
         return staticQRIS;
      }
    }

    // 4. Calculate new CRC
    // We calculate CRC up to and including the "6304" part.
    // Note: The previous slice(0, -4) removed the old 4-digit CRC hex, so the string ends with "6304".
    // Wait, let's make sure it really ends with 6304.
    if (!qris.endsWith("6304")) {
       // if for some reason it didn't end with 6304XXXX, let's just append 6304
       // strip anything after 6304 if exists
       const idx = qris.lastIndexOf("6304");
       if (idx !== -1) {
         qris = qris.slice(0, idx + 4);
       } else {
         qris += "6304";
       }
    }

    const newCrc = crc16(qris);
    return qris + newCrc;
  } catch (error) {
    console.error("Error generating dynamic QRIS:", error);
    return staticQRIS; // Fallback to static if something goes wrong
  }
}

export const STATIC_QRIS = "00020101021126610014COM.GO-JEK.WWW01189360091435157603750210G5157603750303UMI51440014ID.CO.QRIS.WWW0215ID10265724678210303UMI5204839853033605802ID5925Rumah Quran Muharrik, TRG6005GARUT61054415162140703A0111036216304F3E0";

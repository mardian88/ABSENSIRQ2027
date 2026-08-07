const { getSantriForManualAbsen } = require('./src/app/absensi/actions'); getSantriForManualAbsen().then(res => console.log('Result:', res.length)).catch(console.error);  

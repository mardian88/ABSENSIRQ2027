const Database = require('better-sqlite3');
function reset() {
  const db = new Database('sqlite.db');
  db.prepare('UPDATE santri SET data_vektor_wajah = NULL').run();
  console.log('Reset face vectors for all santri');
  db.close();
}
reset();

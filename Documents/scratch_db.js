const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('backend/db/aethon.db');
db.serialize(() => {
    db.each("SELECT sql FROM sqlite_master WHERE type='table'", (err, row) => {
        console.log(row.sql);
    });
});

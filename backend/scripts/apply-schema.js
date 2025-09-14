/* Apply schema.sql to the database defined in .env (DATABASE_URL). */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const schemaPath = path.resolve(__dirname, '..', 'db', 'schema.sql');

(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL is not set in backend/.env');
        process.exit(1);
    }

    const pool = new Pool({ connectionString: url });
    const client = await pool.connect();
    try {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        console.log(`Applying schema from ${schemaPath} ...`);
        await client.query(sql);
        console.log('Schema applied successfully.');
    } catch (err) {
        console.error('Failed to apply schema:', err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
})();

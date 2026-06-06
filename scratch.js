require('dotenv').config();
const { query } = require('./src/db/pool');
async function run() {
  const result = await query("SELECT id, role, employee_id, company_id FROM users WHERE id = 'a7963776-3155-4768-810a-ecdd905d7d40' OR employee_id = 'a7963776-3155-4768-810a-ecdd905d7d40' OR company_id = 'a7963776-3155-4768-810a-ecdd905d7d40'");
  console.log('users:', result.rows);
  try {
    const result2 = await query("SELECT id, name FROM companies WHERE id = 'a7963776-3155-4768-810a-ecdd905d7d40'");
    console.log('companies:', result2.rows);
  } catch (e) { console.log('not company', e.message); }
  const result3 = await query("SELECT id, name FROM employees WHERE id = 'a7963776-3155-4768-810a-ecdd905d7d40'");
  console.log('employees:', result3.rows);
  process.exit(0);
}
run();

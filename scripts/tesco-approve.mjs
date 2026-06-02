/**
 * Fill Tesco cart from latest proposal (run locally after npm run tesco:login).
 * Usage: npm run tesco:approve
 */
import 'dotenv/config';
import { execSync } from 'child_process';

const token = process.env.GA_ACCESS_TOKEN || 'ga_dev_key_123';
const base = process.env.GROCER_API_BASE || 'http://localhost:3000';

console.log(`Approving via ${base}/api/v1/tesco/approve …`);
const res = execSync(
  `curl -s -X POST -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d '{"approved_by":"Jakub"}' "${base}/api/v1/tesco/approve"`,
  { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
);
const data = JSON.parse(res);
if (data.error) {
  console.error('Error:', data.error.message);
  process.exit(1);
}
console.log(JSON.stringify(data, null, 2));
if (data.cart_url) console.log('\n→ Otvorte košík:', data.cart_url);
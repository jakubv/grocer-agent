import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.production.local', override: true });

const token = process.env.GA_ACCESS_TOKEN;
const base = process.env.GROCER_API_BASE || 'https://nakup.voskar.sk';

const res = await fetch(`${base}/api/v1/tesco/prepare`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: '{}',
});
const text = await res.text();
console.log(res.status, text.slice(0, 3000));
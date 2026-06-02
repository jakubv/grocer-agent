/**
 * Add Vercel A record for nakup.voskar.sk via Websupport REST API.
 * Requires: WEBSUPPORT_API_KEY, WEBSUPPORT_SECRET, WEBSUPPORT_SERVICE (domain service id)
 */
import crypto from 'crypto';

const API_KEY = process.env.WEBSUPPORT_API_KEY;
const API_SECRET = process.env.WEBSUPPORT_SECRET;
const SERVICE = process.env.WEBSUPPORT_SERVICE || 'voskar.sk';
const SUBDOMAIN = process.env.DNS_NAME || 'nakup';
const IP = process.env.VERCEL_IP || '76.76.21.21';

if (!API_KEY || !API_SECRET) {
  console.error('Missing WEBSUPPORT_API_KEY or WEBSUPPORT_SECRET');
  process.exit(1);
}

function sign(method, path) {
  const ts = Math.floor(Date.now() / 1000);
  const canonical = `${method} ${path} ${ts}`;
  const signature = crypto.createHmac('sha1', API_SECRET).update(canonical).digest('hex');
  const auth = Buffer.from(`${API_KEY}:${signature}`).toString('base64');
  return { auth, date: new Date(ts * 1000).toISOString() };
}

async function api(method, path, body) {
  const { auth, date } = sign(method, path);
  const res = await fetch(`https://rest.websupport.sk${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'X-Date': date,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function listServices() {
  const path = '/v2/service';
  const { auth, date } = sign('GET', path);
  const res = await fetch(`https://rest.websupport.sk${path}`, {
    headers: { Authorization: `Basic ${auth}`, 'X-Date': date },
  });
  return res.json();
}

async function listRecords(service) {
  const path = `/v2/service/${encodeURIComponent(service)}/dns/record`;
  const { auth, date } = sign('GET', path);
  const res = await fetch(`https://rest.websupport.sk${path}`, {
    headers: { Authorization: `Basic ${auth}`, 'X-Date': date },
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function main() {
  let service = SERVICE;

  if (SERVICE === 'auto') {
    const services = await listServices();
    const match = services?.find?.((s) => s.name === 'voskar.sk' || s.domain === 'voskar.sk');
    if (!match) {
      console.log('Services:', JSON.stringify(services, null, 2));
      throw new Error('Could not find voskar.sk service');
    }
    service = match.id || match.name;
  }

  const existing = await listRecords(service);
  const records = existing.data || [];
  const dup = records.find((r) => r.name === SUBDOMAIN && r.type === 'A');
  if (dup?.content === IP) {
    console.log(`OK: ${SUBDOMAIN}.voskar.sk already points to ${IP}`);
    return;
  }

  if (dup) {
    const delPath = `/v2/service/${encodeURIComponent(service)}/dns/record/${dup.id}`;
    await api('DELETE', delPath);
    console.log(`Removed old A record ${dup.id}`);
  }

  const createPath = `/v2/service/${encodeURIComponent(service)}/dns/record`;
  const result = await api('POST', createPath, {
    type: 'A',
    name: SUBDOMAIN,
    content: IP,
    ttl: 300,
  });

  if (result.status === 204) {
    console.log(`Created A record: ${SUBDOMAIN}.voskar.sk -> ${IP}`);
  } else {
    console.error('Create failed:', result.status, result.text);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
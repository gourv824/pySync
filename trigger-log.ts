import { getDb } from './src/lib/db.ts';

async function test() {
  const res = await fetch('http://localhost:3000/api/users', { headers: { 'x-user-role': 'admin' } });
  console.log(res.status);
}
test();

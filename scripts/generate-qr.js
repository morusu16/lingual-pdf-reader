import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = 'https://life-circuits-approve-sudden.trycloudflare.com';
const publicDir = path.join(__dirname, '..', 'public');

async function run() {
  await QRCode.toFile(path.join(publicDir, 'phone-qr.png'), url, {
    width: 360,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' }
  });
  console.log('Successfully updated phone-qr.png with Cloudflare URL');
}

run();

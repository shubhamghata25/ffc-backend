// Run this on your server to debug login:
// node test-login.js
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const password = 'gym@admin123'

const hash = process.env.ADMIN_PASSWORD_HASH
  || bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'gym@admin123', 10)

console.log('ADMIN_PASSWORD env:', process.env.ADMIN_PASSWORD || '(not set)')
console.log('ADMIN_PASSWORD_HASH env:', process.env.ADMIN_PASSWORD_HASH ? process.env.ADMIN_PASSWORD_HASH.slice(0,20)+'...' : '(not set)')
console.log('Hash being used:', hash.slice(0,20)+'...')
console.log('Testing password "gym@admin123":', await bcrypt.compare('gym@admin123', hash))
console.log('Testing password "gym@admin123" (trimmed):', await bcrypt.compare('gym@admin123'.trim(), hash))

if (process.env.ADMIN_PASSWORD_HASH) {
  console.log('\n⚠️  ADMIN_PASSWORD_HASH is SET in env — only that hash will work.')
  console.log('To reset: remove ADMIN_PASSWORD_HASH from env vars and redeploy.')
}

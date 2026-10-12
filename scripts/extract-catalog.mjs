import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const script = fs.readFileSync(path.join(root, 'scripts/implement-ai-data-gov.mjs'), 'utf8')
const marker = "  'src/data/tenants/gra/aiDataGovernance.ts',\n  `"
const start = script.indexOf(marker)
if (start < 0) throw new Error('start marker not found')
const contentStart = start + marker.length
const end = script.indexOf('\n`,\n)', contentStart)
if (end < 0) throw new Error('end marker not found')
const body = script.slice(contentStart, end)
const out = path.join(root, 'src/data/tenants/gra/aiDataGovernance.ts')
fs.writeFileSync(out, body, 'utf8')
console.log('wrote', out, body.length, body.slice(0, 50))

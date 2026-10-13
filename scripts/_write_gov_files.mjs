import fs from 'fs'
import path from 'path'

const root = process.cwd()

function writeUtf8(rel, content) {
  const p = path.join(root, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content, 'utf8')
  const b = fs.readFileSync(p)
  if (b.length > 2 && b[1] === 0) throw new Error(`UTF-16 written: ${rel}`)
  console.log('wrote', rel, b.length)
}

const catalog = fs.readFileSync(path.join(root, 'scripts/_gov_catalog_src.txt'), 'utf8')
writeUtf8('src/data/tenants/gra/aiDataGovernance.ts', catalog)

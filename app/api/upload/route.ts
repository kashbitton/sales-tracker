import { NextRequest } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { requireManager, authError } from '@/lib/auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try { requireManager(req) } catch (e: any) { return authError(e.message, e.message === 'Unauthorized' ? 401 : 403) }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return Response.json({ error: 'Invalid file type' }, { status: 400 })
  if (file.size > MAX_SIZE) return Response.json({ error: 'File too large (max 10MB)' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${randomUUID()}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), 'public')
  await writeFile(path.join(dataDir, 'uploads', filename), buffer)

  return Response.json({ path: `/uploads/${filename}` })
}

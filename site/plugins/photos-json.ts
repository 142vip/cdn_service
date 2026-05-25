import type { LifePhotoItem } from '../src/types/photo-story'
import fs from 'node:fs'
import path from 'node:path'
import { siteConfig } from '../src/site.config'
import { normalizePhotoStory, validatePhotoStory } from '../src/types/photo-story'
import { resolveAppsAbsolute } from './apps-fs'

const PHOTO_FILE = siteConfig.photoStories.filePath

function parsePhotoStories(content: string): LifePhotoItem[] {
  const parsed = JSON.parse(content)
  if (!Array.isArray(parsed))
    throw new Error('photos.json 必须是数组')
  return parsed as LifePhotoItem[]
}

function assertValidStories(items: LifePhotoItem[]): LifePhotoItem[] {
  const ids = new Set<number>()
  const normalized = items.map((item) => {
    const story = normalizePhotoStory(item)
    const errors = validatePhotoStory(story)
    if (errors.length > 0)
      throw new Error(`故事 #${story.id}：${errors.join('；')}`)
    if (ids.has(story.id))
      throw new Error(`重复的故事 ID：${story.id}`)
    ids.add(story.id)
    return story
  })
  return normalized
}

export function readPhotoStories(repoRoot: string): LifePhotoItem[] {
  const absolutePath = resolveAppsAbsolute(repoRoot, PHOTO_FILE)
  if (!fs.existsSync(absolutePath))
    return []
  const content = fs.readFileSync(absolutePath, 'utf-8').trim()
  if (!content)
    return []
  return parsePhotoStories(content)
}

export function writePhotoStories(repoRoot: string, items: LifePhotoItem[]): void {
  const normalized = assertValidStories(items)
  const absolutePath = resolveAppsAbsolute(repoRoot, PHOTO_FILE)
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
  fs.writeFileSync(absolutePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf-8')
}

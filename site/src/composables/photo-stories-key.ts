import type { InjectionKey } from 'vue'
import type { usePhotoStories } from '@/composables/usePhotoStories'

export type PhotoStoriesContext = ReturnType<typeof usePhotoStories>

export const PHOTO_STORIES_KEY: InjectionKey<PhotoStoriesContext> = Symbol('photoStories')

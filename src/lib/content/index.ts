// Re-export content collections from velite generated output
// This provides a centralized import path compatible with the previous contentlayer API
export { posts as allPosts, authors as allAuthors, pages as allPages } from "#site/content"

export type { Post, Author, Page } from "#site/content"

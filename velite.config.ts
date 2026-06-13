import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeSlug from "rehype-slug"
import { defineCollection, defineConfig, s } from "velite"

const computedFields = <T extends { metadata: { path: string } }>(data: T) => {
  const flattenedPath = data.metadata.path
  return {
    ...data,
    slug: `/${flattenedPath}`,
    slugAsParams: flattenedPath.split("/").slice(1).join("/"),
  }
}

const posts = defineCollection({
  name: "Post",
  pattern: "blog/**/*.mdx",
  schema: s
    .object({
      title: s.string(),
      description: s.string().optional(),
      date: s.string(),
      published: s.boolean().default(true),
      image: s.string(),
      authors: s.array(s.string()),
      body: s.mdx(),
      metadata: s.metadata(),
    })
    .transform((data) => {
      const base = computedFields(data)
      const wordsPerMinute = 200
      const numberOfWords = data.body.split(/\s/g).length
      const readingTime = Math.ceil(numberOfWords / wordsPerMinute)
      return {
        ...base,
        readingTime,
      }
    }),
})

const authors = defineCollection({
  name: "Author",
  pattern: "authors/**/*.mdx",
  schema: s
    .object({
      title: s.string(),
      description: s.string().optional(),
      avatar: s.string(),
      twitter: s.string(),
      body: s.mdx(),
      metadata: s.metadata(),
    })
    .transform(computedFields),
})

const pages = defineCollection({
  name: "Page",
  pattern: "pages/**/*.mdx",
  schema: s
    .object({
      title: s.string(),
      description: s.string().optional(),
      body: s.mdx(),
      metadata: s.metadata(),
    })
    .transform(computedFields),
})

export default defineConfig({
  root: "src/content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts, authors, pages },
  mdx: {
    rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
  },
})

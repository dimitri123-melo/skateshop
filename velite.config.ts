import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeSlug from "rehype-slug"
import { defineCollection, defineConfig, s } from "velite"

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
      slug: s.path(),
    })
    .transform((data) => {
      const wordsPerMinute = 200
      const numberOfWords = data.body.split(/\s/g).length
      const readingTime = Math.ceil(numberOfWords / wordsPerMinute)
      return {
        ...data,
        slug: `/${data.slug}`,
        slugAsParams: data.slug.split("/").slice(1).join("/"),
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
      slug: s.path(),
    })
    .transform((data) => ({
      ...data,
      _id: data.slug,
      slug: `/${data.slug}`,
      slugAsParams: data.slug.split("/").slice(1).join("/"),
    })),
})

const pages = defineCollection({
  name: "Page",
  pattern: "pages/**/*.mdx",
  schema: s
    .object({
      title: s.string(),
      description: s.string().optional(),
      body: s.mdx(),
      slug: s.path(),
    })
    .transform((data) => ({
      ...data,
      slug: `/${data.slug}`,
      slugAsParams: data.slug.split("/").slice(1).join("/"),
    })),
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

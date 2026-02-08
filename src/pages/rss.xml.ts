import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('posts')).sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );

  return rss({
    title: 'Dreamy Draw Weekly 🦞',
    description: 'Sunday weekly recaps from the Dreamy Draw Lab — networks, narratives, and numbers.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: post.data.description || '',
      link: `/dreamy-lab/posts/${post.id}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}

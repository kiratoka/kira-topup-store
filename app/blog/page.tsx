import { getAllPosts } from '@/lib/mdx';
import BlogCard from '@/components/Blog/BlogCard';

export const metadata = {
  title: 'Gaming Blog | Artikel Terbaru',
  description: 'Baca artikel terbaru seputar dunia game',
};

export default async function BlogPage() {
  const posts = await getAllPosts();
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-black to-cyan-950 py-20">
        <div className="container mx-auto px-8">
          <h1 className="text-5xl max-sm:text-center font-bold text-white mb-4">
            <span className="text-cyan-400">Game</span> Blog
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            Temukan artikel terbaru seputar dunia gaming, tips & trik, review, dan berita terkini.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard
              key={post.slug}
              title={post.frontMatter.title}
              date={post.frontMatter.date}
              excerpt={post.frontMatter.excerpt}
              slug={post.slug}
              readingTime={post.frontMatter.readingTime}
              coverImage={post.frontMatter.coverImage}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
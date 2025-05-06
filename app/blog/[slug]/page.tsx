import { MDXRemote } from 'next-mdx-remote/rsc';
import { getPostBySlug, getAllPosts } from '@/lib/mdx';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getAllPosts();
  
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  
  return {
    title: `${post.frontMatter.title} | Gaming Blog`,
    description: post.frontMatter.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="relative h-96 w-full">
        <Image
          src={post.frontMatter.coverImage}
          alt={post.frontMatter.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80"></div>
        
        <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full">
          <Link href="/blog" className="inline-flex items-center text-cyan-400 mb-6 hover:text-cyan-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Kembali ke Blog
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {post.frontMatter.title}
          </h1>
          
          <div className="flex items-center text-sm text-cyan-400 space-x-4">
            <span>{format(new Date(post.frontMatter.date), 'MMMM dd, yyyy')}</span>
            <span>•</span>
            <span>{post.frontMatter.readingTime}</span>
            <span>•</span>
            <span>oleh {post.frontMatter.author}</span>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-gray-900 rounded-lg p-8 shadow-lg shadow-cyan-950/20">
          <div className="prose prose-lg prose-invert prose-cyan max-w-none">
            <MDXRemote source={post.content} />
          </div>
          
          <div className="mt-12 pt-8 border-t border-cyan-900/30">
            <div className="flex flex-wrap gap-2">
              {post.frontMatter.tags?.map((tag) => (
                <span key={tag} className="bg-cyan-900/30 text-cyan-400 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
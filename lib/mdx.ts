import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const rootDirectory = path.join(process.cwd(), 'content');

export type PostFrontMatter = {
  title: string;
  date: string;
  excerpt: string;
  author: string;
  tags?: string[];
  coverImage: string;
  readingTime: string;
}

export type Post = {
  slug: string;
  frontMatter: PostFrontMatter;
  content?: string;
}

export async function getPostBySlug(slug: string): Promise<Post & { content: string }> {
  const fullPath = path.join(rootDirectory, 'blog', `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  
  const { data, content } = matter(fileContents);
  const readTime = readingTime(content);
  
  return {
    slug,
    frontMatter: {
      ...(data as PostFrontMatter),
      readingTime: readTime.text,
    },
    content,
  };
}

export async function getAllPosts(): Promise<Post[]> {
  const postsDirectory = path.join(rootDirectory, 'blog');
  const filenames = fs.readdirSync(postsDirectory);
  
  const posts = filenames.map((filename) => {
    const slug = filename.replace(/\.mdx$/, '');
    const fullPath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    
    const { data } = matter(fileContents);
    const readTime = readingTime(fileContents);
    
    return {
      slug,
      frontMatter: {
        ...(data as PostFrontMatter),
        readingTime: readTime.text,
      },
    };
  });
  
  // Sort posts by date in descending order
  return posts.sort((post1, post2) => {
    return new Date(post2.frontMatter.date).getTime() - new Date(post1.frontMatter.date).getTime();
  });
}
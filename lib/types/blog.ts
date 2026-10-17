export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: {
    name: string;
    image: string;
  };
  tags: string[];
}

export type PostFrontMatter = {
  title: string;
  date: string;
  excerpt: string;
  author: string;
  tags?: string[];
  coverImage: string;
  readingTime: string;
};

export type Post = {
  slug: string;
  frontMatter: PostFrontMatter;
  content?: string;
};

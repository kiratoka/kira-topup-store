// types.ts
export type ServerOption = {
  id: string;
  name: string;
}

export type GameInfo = {
  id: string;
  name: string;
  image: string;
  description: string;
  requiresServer: boolean;
  serverOptions?: ServerOption[] | null;
  instructions: string[];
}

export type TopUpProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "subscription" | "currency" | "bundle";
  gameId: string;
  image: string;
  currency: {
    name: string;
    amount: number;
    bonus?: number;
  };
  validity?: string;
  featured?: boolean;
  popular?: boolean;
}



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

interface FrontMatter {
  title: string;
  excerpt: string;
  coverImage: string;
  date: string;
  readingTime: string;
  author: string;
  tags?: string[];
}

interface Post {
  content: string;
  frontMatter: FrontMatter;
}

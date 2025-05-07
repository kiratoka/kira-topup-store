import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

type BlogCardProps = {
  title: string;
  date: string;
  excerpt: string;
  slug: string;
  readingTime: string;
  coverImage: string;
};

export default function BlogCard({ title, date, excerpt, slug, readingTime, coverImage }: BlogCardProps) {
  return (
    <Link href={`/blog/${slug}`}>
      <div className="h-full group cursor-pointer overflow-hidden rounded-lg border border-cyan-800 bg-black hover:shadow-cyan-500/20 hover:shadow-lg transition-all duration-300">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
        </div>
        
        <div className="p-5">
          <h2 className="text-xl font-bold text-cyan-400 group-hover:text-cyan-300 mb-2 line-clamp-2">
            {title}
          </h2>
          
          <div className="flex items-center text-xs text-cyan-600 mb-3 space-x-2">
            <span>{format(new Date(date), 'MMMM dd, yyyy')}</span>
            <span>•</span>
            <span>{readingTime}</span>
          </div>
          
          <p className="text-gray-300 line-clamp-3 text-sm">
            {excerpt}
          </p>
          
          <div className="mt-4 flex items-center text-cyan-500 text-sm">
            <span>Baca selengkapnya</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
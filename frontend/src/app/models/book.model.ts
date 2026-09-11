import { Author } from './author.model';
import { Publisher } from './publisher.model';

export interface Book {
  id: string;
  title: string;
  subTitle: string;
  description?: string | null;
  pages: number;
  isbn?: string | null;
  authors: Author[];
  publishers: Publisher[];
}

export interface BookRequest {
  title: string;
  subTitle: string;
  description?: string | null;
  pages: number;
  isbn?: string | null;
  authorIds: string[];
  publisherIds: string[];
}

export interface BookSummary {
  id: string;
  title: string;
}

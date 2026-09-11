import { Routes } from '@angular/router';
import { BooksPlaceholderComponent } from './pages/books-placeholder.component';
import { AuthorsPlaceholderComponent } from './pages/authors-placeholder.component';
import { PublishersPlaceholderComponent } from './pages/publishers-placeholder.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'books' },
  { path: 'books', component: BooksPlaceholderComponent },
  { path: 'authors', component: AuthorsPlaceholderComponent },
  { path: 'publishers', component: PublishersPlaceholderComponent },
];

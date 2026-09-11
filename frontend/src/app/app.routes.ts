import { Routes } from '@angular/router';
import { BooksPlaceholderComponent } from './pages/books-placeholder.component';
import { AuthorsPlaceholderComponent } from './pages/authors-placeholder.component';
import { PublisherListComponent } from './publishers/publisher-list.component';
import { PublisherFormComponent } from './publishers/publisher-form.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'books' },
  { path: 'books', component: BooksPlaceholderComponent },
  { path: 'authors', component: AuthorsPlaceholderComponent },
  { path: 'publishers', component: PublisherListComponent },
  { path: 'publishers/new', component: PublisherFormComponent },
  { path: 'publishers/:id/edit', component: PublisherFormComponent },
];

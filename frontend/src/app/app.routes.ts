import { Routes } from '@angular/router';
import { BooksPlaceholderComponent } from './pages/books-placeholder.component';
import { AuthorListComponent } from './authors/author-list.component';
import { AuthorFormComponent } from './authors/author-form.component';
import { PublisherListComponent } from './publishers/publisher-list.component';
import { PublisherFormComponent } from './publishers/publisher-form.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'books' },
  { path: 'books', component: BooksPlaceholderComponent },
  { path: 'authors', component: AuthorListComponent },
  { path: 'authors/new', component: AuthorFormComponent },
  { path: 'authors/:id/edit', component: AuthorFormComponent },
  { path: 'publishers', component: PublisherListComponent },
  { path: 'publishers/new', component: PublisherFormComponent },
  { path: 'publishers/:id/edit', component: PublisherFormComponent },
];

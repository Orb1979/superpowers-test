import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book } from '../models/book.model';
import { BookService } from '../services/book.service';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Books</h1>
    <p>
      <a routerLink="/books/new">Create</a>
    </p>
    @if (error) {
      <p>{{ error }}</p>
    }
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Subtitle</th>
          <th>Authors</th>
          <th>Publishers</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @for (book of books; track book.id) {
          <tr>
            <td>{{ book.title }}</td>
            <td>{{ book.subTitle }}</td>
            <td>{{ authorNames(book) }}</td>
            <td>{{ publisherNames(book) }}</td>
            <td>
              <a [routerLink]="['/books', book.id, 'edit']">Edit</a>
              <button type="button" (click)="onDelete(book)">Delete</button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class BookListComponent implements OnInit {
  books: Book[] = [];
  error = '';

  constructor(private readonly bookService: BookService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.bookService.list().subscribe({
      next: (books) => {
        this.books = books;
        this.error = '';
      },
      error: () => {
        this.error = 'Failed to load books.';
      },
    });
  }

  authorNames(book: Book): string {
    return (book.authors ?? [])
      .map((a) => `${a.firstName} ${a.lastName}`.trim())
      .join(', ');
  }

  publisherNames(book: Book): string {
    return (book.publishers ?? []).map((p) => p.name).join(', ');
  }

  onDelete(book: Book): void {
    if (!confirm('Delete book?')) {
      return;
    }
    this.bookService.delete(book.id).subscribe({
      next: () => this.load(),
      error: () => {
        this.error = 'Failed to delete book.';
      },
    });
  }
}

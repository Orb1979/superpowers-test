import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Author } from '../../models/author.model';
import { AuthorService } from '../../services/author.service';

@Component({
  selector: 'app-author-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Authors</h1>
    <p>
      <a routerLink="/authors/new">Create</a>
    </p>
    @if (error) {
      <p>{{ error }}</p>
    }
    <table>
      <thead>
        <tr>
          <th>First name</th>
          <th>Last name</th>
          <th>Birth date</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @for (author of authors; track author.id) {
          <tr>
            <td>{{ author.firstName }}</td>
            <td>{{ author.lastName }}</td>
            <td>{{ author.birthDate }}</td>
            <td>
              <a [routerLink]="['/authors', author.id, 'edit']">Edit</a>
              <button type="button" (click)="onDelete(author)">Delete</button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class AuthorListComponent implements OnInit {
  authors: Author[] = [];
  error = '';

  constructor(private readonly authorService: AuthorService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.authorService.list().subscribe({
      next: (authors) => {
        this.authors = authors;
        this.error = '';
      },
      error: () => {
        this.error = 'Failed to load authors.';
      },
    });
  }

  onDelete(author: Author): void {
    this.authorService.listBooksByAuthor(author.id).subscribe({
      next: (books) => {
        const message =
          books.length === 0
            ? 'Delete this author?'
            : `This author is linked to the following books. Removing the author will unlink them from those books: ${books
                .map((b) => b.title)
                .join(', ')}. Continue?`;
        if (!confirm(message)) {
          return;
        }
        this.authorService.delete(author.id).subscribe({
          next: () => this.load(),
          error: () => {
            this.error = 'Failed to delete author.';
          },
        });
      },
      error: () => {
        this.error = 'Failed to load linked books for author.';
      },
    });
  }
}

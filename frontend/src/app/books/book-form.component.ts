import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Author } from '../models/author.model';
import { BookRequest } from '../models/book.model';
import { Publisher } from '../models/publisher.model';
import { AuthorService } from '../services/author.service';
import { BookService } from '../services/book.service';
import { PublisherService } from '../services/publisher.service';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1>{{ isEdit ? 'Edit book' : 'Create book' }}</h1>
    @if (error) {
      <p>{{ error }}</p>
    }
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div>
        <label for="title">Title</label>
        <input id="title" type="text" formControlName="title" />
      </div>
      <div>
        <label for="subTitle">Subtitle</label>
        <input id="subTitle" type="text" formControlName="subTitle" />
      </div>
      <div>
        <label for="description">Description</label>
        <textarea id="description" formControlName="description"></textarea>
      </div>
      <div>
        <label for="pages">Pages</label>
        <input id="pages" type="number" formControlName="pages" />
      </div>
      <div>
        <label for="isbn">ISBN</label>
        <input id="isbn" type="text" formControlName="isbn" />
      </div>
      <div>
        <label for="authorIds">Authors</label>
        <select id="authorIds" multiple formControlName="authorIds" size="5">
          @for (author of authors; track author.id) {
            <option [value]="author.id">
              {{ author.firstName }} {{ author.lastName }}
            </option>
          }
        </select>
      </div>
      <div>
        <label for="publisherIds">Publishers</label>
        <select id="publisherIds" multiple formControlName="publisherIds" size="5">
          @for (publisher of publishers; track publisher.id) {
            <option [value]="publisher.id">{{ publisher.name }}</option>
          }
        </select>
      </div>
      <button type="submit" [disabled]="form.invalid || saving">Save</button>
      <a routerLink="/books">Cancel</a>
    </form>
  `,
})
export class BookFormComponent implements OnInit {
  readonly form;
  isEdit = false;
  private bookId: string | null = null;
  saving = false;
  error = '';
  authors: Author[] = [];
  publishers: Publisher[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly bookService: BookService,
    private readonly authorService: AuthorService,
    private readonly publisherService: PublisherService,
  ) {
    this.form = this.fb.nonNullable.group({
      title: ['', Validators.required],
      subTitle: ['', Validators.required],
      description: [''],
      pages: [1 as number, [Validators.required, Validators.min(1)]],
      isbn: [''],
      authorIds: [[] as string[]],
      publisherIds: [[] as string[]],
    });
  }

  ngOnInit(): void {
    this.bookId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.bookId;

    this.authorService.list().subscribe({
      next: (authors) => {
        this.authors = authors;
      },
      error: () => {
        this.error = 'Failed to load authors.';
      },
    });

    this.publisherService.list().subscribe({
      next: (publishers) => {
        this.publishers = publishers;
      },
      error: () => {
        this.error = 'Failed to load publishers.';
      },
    });

    if (this.bookId) {
      this.bookService.get(this.bookId).subscribe({
        next: (book) => {
          this.form.patchValue({
            title: book.title,
            subTitle: book.subTitle,
            description: book.description ?? '',
            pages: book.pages,
            isbn: book.isbn ?? '',
            authorIds: (book.authors ?? []).map((a) => a.id),
            publisherIds: (book.publishers ?? []).map((p) => p.id),
          });
        },
        error: () => {
          this.error = 'Failed to load book.';
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const request: BookRequest = {
      title: value.title,
      subTitle: value.subTitle,
      description: value.description || null,
      pages: Number(value.pages),
      isbn: value.isbn || null,
      authorIds: value.authorIds ?? [],
      publisherIds: value.publisherIds ?? [],
    };

    this.saving = true;
    const request$ =
      this.isEdit && this.bookId
        ? this.bookService.update(this.bookId, request)
        : this.bookService.create(request);

    request$.subscribe({
      next: () => {
        this.saving = false;
        void this.router.navigate(['/books']);
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save book.';
      },
    });
  }
}

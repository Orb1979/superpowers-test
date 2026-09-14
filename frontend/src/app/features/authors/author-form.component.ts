import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthorRequest } from '../models/author.model';
import { AuthorService } from '../services/author.service';

@Component({
  selector: 'app-author-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1>{{ isEdit ? 'Edit author' : 'Create author' }}</h1>
    @if (error) {
      <p>{{ error }}</p>
    }
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div>
        <label for="firstName">First name</label>
        <input id="firstName" type="text" formControlName="firstName" />
      </div>
      <div>
        <label for="lastName">Last name</label>
        <input id="lastName" type="text" formControlName="lastName" />
      </div>
      <div>
        <label for="birthDate">Birth date</label>
        <input id="birthDate" type="date" formControlName="birthDate" />
      </div>
      <button type="submit" [disabled]="form.invalid || saving">Save</button>
      <a routerLink="/authors">Cancel</a>
    </form>
  `,
})
export class AuthorFormComponent implements OnInit {
  readonly form;
  isEdit = false;
  private authorId: string | null = null;
  saving = false;
  error = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authorService: AuthorService,
  ) {
    this.form = this.fb.nonNullable.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.authorId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.authorId;

    if (this.authorId) {
      this.authorService.get(this.authorId).subscribe({
        next: (author) => {
          this.form.patchValue({
            firstName: author.firstName,
            lastName: author.lastName,
            birthDate: author.birthDate ?? '',
          });
        },
        error: () => {
          this.error = 'Failed to load author.';
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const request: AuthorRequest = {
      firstName: value.firstName,
      lastName: value.lastName,
      birthDate: value.birthDate,
    };

    this.saving = true;
    const request$ =
      this.isEdit && this.authorId
        ? this.authorService.update(this.authorId, request)
        : this.authorService.create(request);

    request$.subscribe({
      next: () => {
        this.saving = false;
        void this.router.navigate(['/authors']);
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save author.';
      },
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublisherRequest } from '../models/publisher.model';
import { PublisherService } from '../services/publisher.service';

@Component({
  selector: 'app-publisher-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1>{{ isEdit ? 'Edit publisher' : 'Create publisher' }}</h1>
    @if (error) {
      <p>{{ error }}</p>
    }
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div>
        <label for="name">Name</label>
        <input id="name" type="text" formControlName="name" />
      </div>
      <div>
        <label for="country">Country</label>
        <input id="country" type="text" formControlName="country" />
      </div>
      <button type="submit" [disabled]="form.invalid || saving">Save</button>
      <a routerLink="/publishers">Cancel</a>
    </form>
  `,
})
export class PublisherFormComponent implements OnInit {
  readonly form;
  isEdit = false;
  private publisherId: string | null = null;
  saving = false;
  error = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly publisherService: PublisherService,
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      country: [''],
    });
  }

  ngOnInit(): void {
    this.publisherId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.publisherId;

    if (this.publisherId) {
      this.publisherService.get(this.publisherId).subscribe({
        next: (publisher) => {
          this.form.patchValue({
            name: publisher.name,
            country: publisher.country ?? '',
          });
        },
        error: () => {
          this.error = 'Failed to load publisher.';
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const request: PublisherRequest = {
      name: value.name,
      country: value.country || null,
    };

    this.saving = true;
    const request$ =
      this.isEdit && this.publisherId
        ? this.publisherService.update(this.publisherId, request)
        : this.publisherService.create(request);

    request$.subscribe({
      next: () => {
        this.saving = false;
        void this.router.navigate(['/publishers']);
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save publisher.';
      },
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Publisher } from '../models/publisher.model';
import { PublisherService } from '../services/publisher.service';

@Component({
  selector: 'app-publisher-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Publishers</h1>
    <p>
      <a routerLink="/publishers/new">Create</a>
    </p>
    @if (error) {
      <p>{{ error }}</p>
    }
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Country</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @for (publisher of publishers; track publisher.id) {
          <tr>
            <td>{{ publisher.name }}</td>
            <td>{{ publisher.country }}</td>
            <td>
              <a [routerLink]="['/publishers', publisher.id, 'edit']">Edit</a>
              <button type="button" (click)="onDelete(publisher)">Delete</button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class PublisherListComponent implements OnInit {
  publishers: Publisher[] = [];
  error = '';

  constructor(private readonly publisherService: PublisherService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.publisherService.list().subscribe({
      next: (publishers) => {
        this.publishers = publishers;
        this.error = '';
      },
      error: () => {
        this.error = 'Failed to load publishers.';
      },
    });
  }

  onDelete(publisher: Publisher): void {
    if (!confirm('Delete publisher?')) {
      return;
    }
    this.publisherService.delete(publisher.id).subscribe({
      next: () => this.load(),
      error: () => {
        this.error = 'Failed to delete publisher.';
      },
    });
  }
}

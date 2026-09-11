import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Publisher, PublisherRequest } from '../models/publisher.model';
import { BookSummary } from '../models/book.model';

@Injectable({ providedIn: 'root' })
export class PublisherService {
  private readonly baseUrl = `${environment.apiBaseUrl}/publishers`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Publisher[]> {
    return this.http.get<Publisher[]>(this.baseUrl);
  }

  get(id: string): Observable<Publisher> {
    return this.http.get<Publisher>(`${this.baseUrl}/${id}`);
  }

  create(request: PublisherRequest): Observable<Publisher> {
    return this.http.post<Publisher>(this.baseUrl, request);
  }

  update(id: string, request: PublisherRequest): Observable<Publisher> {
    return this.http.put<Publisher>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listBooksByPublisher(id: string): Observable<BookSummary[]> {
    return this.http.get<BookSummary[]>(`${this.baseUrl}/${id}/books`);
  }
}

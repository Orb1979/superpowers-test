import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Author, AuthorRequest } from '../models/author.model';
import { BookSummary } from '../models/book.model';

@Injectable({ providedIn: 'root' })
export class AuthorService {
  private readonly baseUrl = `${environment.apiBaseUrl}/authors`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Author[]> {
    return this.http.get<Author[]>(this.baseUrl);
  }

  get(id: string): Observable<Author> {
    return this.http.get<Author>(`${this.baseUrl}/${id}`);
  }

  create(request: AuthorRequest): Observable<Author> {
    return this.http.post<Author>(this.baseUrl, request);
  }

  update(id: string, request: AuthorRequest): Observable<Author> {
    return this.http.put<Author>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listBooksByAuthor(id: string): Observable<BookSummary[]> {
    return this.http.get<BookSummary[]>(`${this.baseUrl}/${id}/books`);
  }
}

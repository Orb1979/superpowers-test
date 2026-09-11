import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Book, BookRequest } from '../models/book.model';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly baseUrl = `${environment.apiBaseUrl}/books`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Book[]> {
    return this.http.get<Book[]>(this.baseUrl);
  }

  get(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/${id}`);
  }

  create(request: BookRequest): Observable<Book> {
    return this.http.post<Book>(this.baseUrl, request);
  }

  update(id: string, request: BookRequest): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

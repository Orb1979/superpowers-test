export interface Author {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
}

export interface AuthorRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
}

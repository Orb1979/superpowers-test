export interface Publisher {
  id: string;
  name: string;
  country?: string | null;
}

export interface PublisherRequest {
  name: string;
  country?: string | null;
}

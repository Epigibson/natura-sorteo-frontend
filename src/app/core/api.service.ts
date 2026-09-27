import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AccessCheck,
  PublicRaffle,
  Raffle,
  RaffleStats,
  Ticket,
} from './models';

const API = '/api/v1';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ---------- Staff ----------
  listRaffles(): Observable<Raffle[]> {
    return this.http.get<Raffle[]>(`${API}/raffles`);
  }

  getRaffle(id: string): Observable<Raffle> {
    return this.http.get<Raffle>(`${API}/raffles/${id}`);
  }

  createRaffle(body: {
    title: string;
    prize: string;
    prize_value: number;
    price_min: number;
    price_max: number;
    draw_date?: string;
    notes?: string;
  }): Observable<Raffle> {
    return this.http.post<Raffle>(`${API}/raffles`, body);
  }

  getStats(id: string): Observable<RaffleStats> {
    return this.http.get<RaffleStats>(`${API}/raffles/${id}/stats`);
  }

  listTickets(id: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${API}/raffles/${id}/tickets`);
  }

  assignTicket(
    raffleId: string,
    folio: number,
    body: { name?: string; phone?: string },
  ): Observable<Ticket> {
    return this.http.post<Ticket>(
      `${API}/raffles/${raffleId}/tickets/${folio}/assign`,
      body,
    );
  }

  markPaid(raffleId: string, folio: number, note?: string): Observable<Ticket> {
    return this.http.post<Ticket>(
      `${API}/raffles/${raffleId}/tickets/${folio}/pay`,
      { note },
    );
  }

  releaseTicket(raffleId: string, folio: number): Observable<Ticket> {
    return this.http.post<Ticket>(
      `${API}/raffles/${raffleId}/tickets/${folio}/release`,
      {},
    );
  }

  closeRaffle(id: string): Observable<Raffle> {
    return this.http.post<Raffle>(`${API}/raffles/${id}/close`, {});
  }

  draw(id: string): Observable<{
    winner: { folio: number; amount: number; participant?: { name?: string } };
    total_paid: number;
  }> {
    return this.http.post<{
      winner: { folio: number; amount: number; participant?: { name?: string } };
      total_paid: number;
    }>(`${API}/raffles/${id}/draw`, {});
  }

  exportParticipants(raffleId: string): Observable<Blob> {
    return this.http.get(`${API}/raffles/${raffleId}/export/participants`, {
      responseType: 'blob',
    });
  }

  changePassword(current: string, next: string): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${API}/change-password`, {
      current_password: current,
      new_password: next,
    });
  }

  // ---------- Público ----------
  publicRaffle(slug: string): Observable<PublicRaffle> {
    return this.http.get<PublicRaffle>(`${API}/public/raffles/${slug}`);
  }

  getBoard(slug: string): Observable<any> {
    return this.http.get<any>(`${API}/public/raffles/${slug}/board`);
  }

  claimTicket(
    slug: string,
    body: { folio: number; name: string; phone: string },
  ): Observable<any> {
    return this.http.post<any>(`${API}/public/raffles/${slug}/claim`, body);
  }

  access(body: {
    folio: number;
    code: string;
    raffle_slug: string;
  }): Observable<AccessCheck> {
    return this.http.post<AccessCheck>(`${API}/public/access`, body);
  }

  register(body: {
    folio: number;
    code: string;
    raffle_slug: string;
    name: string;
    phone: string;
  }): Observable<{ ok: boolean; amount: number | null; message: string }> {
    return this.http.post<{ ok: boolean; amount: number | null; message: string }>(
      `${API}/public/register`,
      body,
    );
  }

  scratch(body: {
    folio: number;
    code: string;
    raffle_slug: string;
  }): Observable<{ ok: boolean; amount: number; folio: number; message: string }> {
    return this.http.post<{ ok: boolean; amount: number; folio: number; message: string }>(
      `${API}/public/scratch`,
      body,
    );
  }
}

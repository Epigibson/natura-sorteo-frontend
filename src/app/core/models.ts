/** Modelos compartidos del frontend. */
export interface User {
  sub: string;
  role: string;
  name: string;
}

export interface TokenOut {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: string;
  name: string;
}

export interface Raffle {
  id: string;
  slug: string;
  title: string;
  prize: string;
  prize_value: number;
  price_min: number;
  price_max: number;
  ticket_count: number;
  status: 'draft' | 'open' | 'closed' | 'drawing' | 'drawn';
  draw_date?: string | null;
  notes?: string | null;
  created_at: string;
  drawn_at?: string | null;
  winner?: {
    folio: number;
    amount: number;
    participant?: { name?: string; phone?: string };
  } | null;
}

export interface RaffleStats {
  raffle_id: string;
  total_tickets: number;
  free: number;
  delivered: number;
  registered: number;
  scratched: number;
  paid: number;
  released: number;
  revenue_expected: number;
  revenue_confirmed: number;
  participants: number;
}

export interface Ticket {
  id: string;
  raffle_id: string;
  folio: number;
  amount: number;
  status: 'free' | 'delivered' | 'registered' | 'scratched' | 'paid' | 'released';
  access_code: string;
  participant?: { name?: string; phone?: string } | null;
  delivered_at?: string | null;
  registered_at?: string | null;
  scratched_at?: string | null;
  paid_at?: string | null;
  payment_reported_at?: string | null;
  updated_at: string;
}

export interface PublicRaffle {
  slug: string;
  title: string;
  prize: string;
  prize_value: number;
  price_min: number;
  price_max: number;
  ticket_count: number;
  status: string;
  draw_date?: string | null;
  paid_count: number;
  drawn: boolean;
  winner_folio?: number | null;
  winner_name?: string | null;
}

export interface AccessCheck {
  ok: boolean;
  raffle_title: string;
  raffle_slug: string;
  folio: number;
  status: string;
  needs_registration: boolean;
  participant_name?: string | null;
  amount?: number | null;
  message: string;
}

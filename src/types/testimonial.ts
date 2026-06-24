// ---------------------------------------------------------------------------
// Testimonial domain type
// ---------------------------------------------------------------------------

export interface Testimonial {
  id: string;
  customerName: string;
  projectName: string | null;
  locality: string | null;
  review: string;
  rating: number;            // 1–5
  deliveryDate: string | null;        // 'YYYY-MM-DD'
  deliveryImageUrl: string | null;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

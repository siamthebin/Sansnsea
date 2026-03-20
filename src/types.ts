export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  displayName?: string;
  photoURL?: string;
  createdAt: string;
}

export interface TourPlan {
  name: string;
  price: number;
  description: string;
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  destinationType: 'domestic' | 'international';
  location: string;
  price: number; // Default/Base price
  plans: TourPlan[];
  startDate: string;
  endDate: string;
  imageUrl: string;
  authorUid: string;
  createdAt: string;
  status: 'active' | 'draft' | 'archived';
}

export interface Booking {
  id: string;
  tourId: string;
  userId: string;
  planName: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  numberOfPeople: number;
  totalPrice: number;
  createdAt: string;
}

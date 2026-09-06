export interface Review {
  author: string;
  location: string;
  rating: number;
  text: string;
  source: 'google' | 'yelp';
  serviceCategory?: string;
  date: string;
  authorPhoto?: string | null;
  ownerReply?: string | null;
}

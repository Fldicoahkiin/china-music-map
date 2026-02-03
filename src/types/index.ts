export interface Band {
  id: string;
  name: string;
  province: string;
  city?: string;
  genres: string[];
  description: string;
  links: { type: string; url: string }[];
  imageUrl?: string;
  yearFormed?: number;
  featured?: boolean;
}

export interface Genre {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface Province {
  name: string;
  bandCount: number;
}

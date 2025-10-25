
export interface WeddingPlan {
  coupleNames: [string, string];
  familyMembers: string[];
  engagementDate: string;
  weddingDate: string;
  guestCount: number;
  location: string;
  budget: string;
  traditions: string;
  customRituals: string;
  priorities: string[];
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  vendors?: Vendor[];
  generatedImage?: string;
  virtualTryOn?: {
    person: string;
    clothing: string;
    result: string;
  };
  groundingSources?: GroundingSource[];
  isLoading?: boolean;
}

export interface Vendor {
  name: string;
  type: string;
  map_link: string;
  image: string;
  rating: string;
  contact: string;
  notes: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
  type: 'web' | 'maps';
}

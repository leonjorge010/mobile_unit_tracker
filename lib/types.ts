export interface MobileUnit {
  id: string;
  name: string;
  status: "available" | "dispatched" | "out-of-service";
  createdAt: Date;
}

export interface Location {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  category?: "medical" | "security" | "stage" | "gate" | "general";
  createdAt: Date;
}
export type ObservationCategory = 'contact' | 'payment' | 'personal' | 'administrative' | 'maintenance' | 'other';

export interface ObservationInterface {
  _id?: string;
  clientId?: string;
  description: string;
  category: ObservationCategory;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ObservationApiInterface {
  status: string;
  message: string;
  data: {
    notes: ObservationInterface[];
  };
}

export interface ObservationCreateInterface {
  description: string;
  createdBy: string;
  category: ObservationCategory;
}

export interface ObservationUpdateInterface {
  description: string;
  createdBy: string;
  category: ObservationCategory;
}

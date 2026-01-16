export enum CardType {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  OTHER = 'other',
}

export interface Card {
  _id: string;
  userId: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  tripId?: string;
  trip?: {
    _id: string;
    name: string;
  };
  name: string;
  lastFourDigits: string;
  type: CardType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardDto {
  tripId?: string;
  name: string;
  lastFourDigits: string;
  type?: CardType;
}

export interface UpdateCardDto extends Partial<CreateCardDto> {
  isActive?: boolean;
}

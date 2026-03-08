export interface Room {
  id: string;
  number: string;
  floor: number;
  roomTypeName: string;
  pricePerNight: number;
  capacity: number;
  imageUrl?: string;
}

export interface GuestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  identificationNumber: string;
  notes: string;
}

export interface BookingState {
  checkIn: string;
  checkOut: string;
  room: Room | null;
  guest: GuestData;
}
export interface ParticipantItem {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  profilePhoto: string | null;
  country: string | null;
  age: number | null;
  joinedAt: Date;
}

/** Mobile — "Contact Us" page (Email + Phone number). */
export interface ContactInfoItem {
  email: string;
  phoneNumber: string;
}

/** Admin — full record with timestamps. */
export interface AdminContactInfo extends ContactInfoItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

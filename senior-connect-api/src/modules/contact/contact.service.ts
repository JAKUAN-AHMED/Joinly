import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceResponse } from '../../common/interfaces/api-response.interface';
import { AdminContactInfo, ContactInfoItem } from './interfaces/contact.interface';
import { ContactInfo } from './entities';
import { UpdateContactDto } from './dto';

/** Seeded on first read so the app always has something to show. */
const DEFAULT_CONTACT = {
  email: 'support@joinly.io',
  phoneNumber: '+654203540012',
};

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactInfo)
    private readonly contactRepository: Repository<ContactInfo>,
  ) {}

  /** Mobile — "Contact Us" page (Email + Phone number). Public. */
  async getPublic(): Promise<ServiceResponse<ContactInfoItem>> {
    const contact = await this.getOrCreate();
    return {
      message: 'Contact information retrieved successfully',
      data: { email: contact.email, phoneNumber: contact.phoneNumber },
    };
  }

  /** Admin — full record for the dashboard editor. */
  async adminGet(): Promise<ServiceResponse<AdminContactInfo>> {
    const contact = await this.getOrCreate();
    return { message: 'Contact information retrieved successfully', data: contact };
  }

  /** Admin — update Email and/or Phone number. */
  async update(dto: UpdateContactDto): Promise<ServiceResponse<AdminContactInfo>> {
    const contact = await this.getOrCreate();
    Object.assign(contact, dto);
    const saved = await this.contactRepository.save(contact);
    return { message: 'Contact information updated successfully', data: saved };
  }

  /** The Contact Us page is a singleton — return the one row, creating it if missing. */
  private async getOrCreate(): Promise<ContactInfo> {
    const existing = await this.contactRepository.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });
    if (existing) return existing;
    return this.contactRepository.save(this.contactRepository.create(DEFAULT_CONTACT));
  }
}

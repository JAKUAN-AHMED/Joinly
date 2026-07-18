import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { ContactService } from './contact.service';
import { CONTACT_ROUTES } from './contact.routes';
import { UpdateContactDto } from './dto';

@Controller(CONTACT_ROUTES.ROOT)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /** Mobile — "Contact Us" page (Email + Phone number). No auth required. */
  @Public()
  @Get(CONTACT_ROUTES.PUBLIC)
  getPublic() {
    return this.contactService.getPublic();
  }

  /** Admin — read current contact info for the dashboard editor. */
  @Roles(UserRole.Admin)
  @Get(CONTACT_ROUTES.ADMIN_CONTACT)
  adminGet() {
    return this.contactService.adminGet();
  }

  /** Admin — update Email and/or Phone number. */
  @Roles(UserRole.Admin)
  @Patch(CONTACT_ROUTES.ADMIN_CONTACT)
  update(@Body() dto: UpdateContactDto) {
    return this.contactService.update(dto);
  }
}

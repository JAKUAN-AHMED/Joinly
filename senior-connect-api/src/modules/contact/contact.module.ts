import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactController } from './contact.controller';
import { ContactInfo } from './entities';
import { ContactService } from './contact.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactInfo])],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}

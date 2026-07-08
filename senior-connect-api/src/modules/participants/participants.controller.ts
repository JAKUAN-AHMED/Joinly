import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/api-response.interface';
import { ParticipantsService } from './participants.service';
import { PARTICIPANTS_ROUTES } from './participants.routes';
import { ListParticipantsDto } from './dto';

@Controller(PARTICIPANTS_ROUTES.ROOT)
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  /** Join an activity */
  @Post(PARTICIPANTS_ROUTES.JOIN)
  join(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId', ParseUUIDPipe) activityId: string,
  ) {
    return this.participantsService.join(user, activityId);
  }

  /** Leave an activity */
  @Delete(PARTICIPANTS_ROUTES.LEAVE)
  leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('activityId', ParseUUIDPipe) activityId: string,
  ) {
    return this.participantsService.leave(user, activityId);
  }

  /** Participants of an activity */
  @Get(PARTICIPANTS_ROUTES.LIST)
  list(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Query() query: ListParticipantsDto,
  ) {
    return this.participantsService.list(activityId, query);
  }
}

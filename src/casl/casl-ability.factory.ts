import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { JwtUser } from '../auth/decorators/current-user.decorator';
import { Action, AppAbility } from './casl.types';

@Injectable()
export class CaslAbilityFactory {
  defineAbilityFor(user: JwtUser): AppAbility {
    const { can, build, cannot } = new AbilityBuilder<AppAbility>(createMongoAbility);

    can(Action.Create, 'Todo');

    can(Action.Read, 'Todo');
    return build();
  }
}

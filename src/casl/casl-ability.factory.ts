import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { JwtUser } from '../auth/decorators/current-user.decorator';
import { Action, AppAbility } from './casl.types';

@Injectable()
export class CaslAbilityFactory {
  defineAbilityFor(user: JwtUser): AppAbility {
    const { can, build, cannot } = new AbilityBuilder<AppAbility>(createMongoAbility);

    can(Action.Create, 'Todo');

    can(Action.Read, 'Todo', { ownerId: user.userId } as any);
    can(Action.Read, 'Todo', { editors: user.userId } as any);
    can(Action.Read, 'Todo', { viewers: user.userId } as any);

    can(Action.Update, 'Todo', { ownerId: user.userId } as any);
    can(Action.Update, 'Todo', { editors: user.userId } as any);

    can(Action.Delete, 'Todo', { ownerId: user.userId } as any);
    can(Action.Manage, 'Todo', { ownerId: user.userId } as any);

    cannot(Action.Update, 'Todo', { viewers: user.userId } as any).because("Viewers are not allowed to edit the todo");
    cannot(Action.Delete, 'Todo', { editors: user.userId } as any).because("Editors are not allowed to delete the todo");
    cannot(Action.Delete, 'Todo', { viewers: user.userId } as any).because("Viewers are not allowed to delete the todo");
    cannot(Action.Manage, 'Todo', { editors: user.userId } as any).because("Only the owner can manage sharing");
    cannot(Action.Manage, 'Todo', { viewers: user.userId } as any).because("Only the owner can manage sharing");

    return build();
  }
}

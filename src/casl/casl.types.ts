import { InferSubjects, MongoAbility, ForcedSubject } from '@casl/ability';
import { Todo } from '../todo/schemas/todo.schema';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type AppSubjects = 'all' | 'Todo' | (Todo & ForcedSubject<'Todo'>);

export type AppAbility = MongoAbility<[Action, AppSubjects]>;

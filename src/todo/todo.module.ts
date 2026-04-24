import { Module } from '@nestjs/common';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Todo, TodoSchema } from './schemas/todo.schema';
import { CaslModule } from '../casl/casl.module';
import { PoliciesGuard } from '../auth/guards/policies.guard';
import { Relation, RelationSchema } from 'src/relations/schemas/relation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Todo.name, schema: TodoSchema },
      { name: Relation.name, schema: RelationSchema },
    ]),
    CaslModule,
  ],
  controllers: [TodoController],
  providers: [TodoService, PoliciesGuard],
})
export class TodoModule { }

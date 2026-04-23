import { Module } from '@nestjs/common';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Todo, TodoSchema } from './schemas/todo.schema';
import { CaslModule } from '../casl/casl.module';
import { PoliciesGuard } from '../auth/guards/policies.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Todo.name, schema: TodoSchema }]),
    CaslModule,
  ],
  controllers: [TodoController],
  providers: [TodoService, PoliciesGuard],
})
export class TodoModule {}

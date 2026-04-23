import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { subject } from '@casl/ability';
import { Todo, TodoDocument } from './schemas/todo.schema';

import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { ShareTodoDto } from './dto/share-todo.dto';
import { Action, AppAbility } from '../casl/casl.types';

@Injectable()
export class TodoService {
  constructor(
    @InjectModel(Todo.name) private todoModel: Model<TodoDocument>,
  ) { }

  async findAll(userId: string): Promise<TodoDocument[]> {
    const objectId = new Types.ObjectId(userId);
    return this.todoModel.find({
      $or: [
        { ownerId: objectId },
        { editors: objectId },
        { viewers: objectId }
      ]
    }).sort({ created_at: -1 }).exec();
  }

  private mapToCaslSubject(todo: TodoDocument) {
    return subject('Todo', {
      ...todo.toObject(),
      ownerId: todo.ownerId.toString(),
      editors: todo.editors.map(id => id.toString()),
      viewers: todo.viewers.map(id => id.toString()),
    } as any);
  }

  async findOne(id: string, ability: AppAbility): Promise<TodoDocument> {
    const todo = await this.todoModel.findById(id).exec();

    if (!todo) {
      throw new NotFoundException(`Todo with id '${id}' not found`);
    }

    if (!ability.can(Action.Read, this.mapToCaslSubject(todo))) {
      throw new ForbiddenException('You do not have permission to read this todo');
    }

    return todo;
  }

  async create(
    createTodoDto: CreateTodoDto,
    userId: string,
  ): Promise<TodoDocument> {
    const newTodo = new this.todoModel({
      ...createTodoDto,
      ownerId: new Types.ObjectId(userId),
      editors: [],
      viewers: [],
    });

    return newTodo.save();
  }

  async update(
    id: string,
    updateTodoDto: UpdateTodoDto,
    ability: AppAbility,
  ): Promise<TodoDocument> {
    const todo = await this.todoModel.findById(id).exec();

    if (!todo) {
      throw new NotFoundException(`Todo with id '${id}' not found`);
    }

    if (!ability.can(Action.Update, this.mapToCaslSubject(todo))) {
      throw new ForbiddenException(
        'You do not have permission to update this todo',
      );
    }

    return this.todoModel
      .findByIdAndUpdate(id, updateTodoDto, { new: true })
      .exec() as Promise<TodoDocument>;
  }

  async remove(id: string, ability: AppAbility): Promise<void> {
    const todo = await this.todoModel.findById(id).exec();

    if (!todo) {
      throw new NotFoundException(`Todo with id '${id}' not found`);
    }

    if (!ability.can(Action.Delete, this.mapToCaslSubject(todo))) {
      throw new ForbiddenException(
        'You do not have permission to delete this todo',
      );
    }

    await this.todoModel.findByIdAndDelete(id).exec();
  }

  async share(
    id: string,
    shareDto: ShareTodoDto,
    ability: AppAbility,
  ): Promise<TodoDocument> {
    const todo = await this.todoModel.findById(id).exec();

    if (!todo) {
      throw new NotFoundException(`Todo with id '${id}' not found`);
    }

    if (!ability.can(Action.Manage, this.mapToCaslSubject(todo))) {
      throw new ForbiddenException('Only the owner can share this todo');
    }

    const targetUserId = new Types.ObjectId(shareDto.userId);

    todo.editors = todo.editors.filter(eId => eId.toString() !== targetUserId.toString());
    todo.viewers = todo.viewers.filter(vId => vId.toString() !== targetUserId.toString());

    if (shareDto.role === 'editor') {
      todo.editors.push(targetUserId);
    } else if (shareDto.role === 'viewer') {
      todo.viewers.push(targetUserId);
    }

    return todo.save();
  }
}

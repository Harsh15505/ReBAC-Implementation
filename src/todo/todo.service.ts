import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Todo, TodoDocument } from './schemas/todo.schema';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { ShareTodoDto } from './dto/share-todo.dto';
import { Relation, RelationDocument } from 'src/relations/schemas/relation.schema';
import { ENTITY_TODO } from './constants/entities.constant';
import { Role } from './enums/roles.enum';
import { ErrorMessages } from './constants/error-messages.constant';

@Injectable()
export class TodoService {
  constructor(
    @InjectModel(Todo.name) private todoModel: Model<TodoDocument>,
    @InjectModel(Relation.name) private relationModel: Model<RelationDocument>,
  ) { }

  async findAll(userId: string): Promise<TodoDocument[]> {
    try {
      const relations = await this.relationModel.find({
        subjectId: new Types.ObjectId(userId),
        resourceType: ENTITY_TODO,
      });

      const resourceIds = relations.map((rel) => rel.resourceId);

      return await this.todoModel
        .find({ _id: { $in: resourceIds } })
        .sort({ created_at: -1 });
    } catch (error) {
      throw new InternalServerErrorException(ErrorMessages.FAILED_TO_FETCH_TODOS);
    }
  }

  async findOne(id: string, userId: string): Promise<TodoDocument> {
    try {
      const todo = await this.todoModel.findById(id);
      if (!todo) {
        throw new NotFoundException(ErrorMessages.TODO_NOT_FOUND);
      }

      const relation = await this.relationModel.findOne({
        subjectId: new Types.ObjectId(userId),
        resourceId: new Types.ObjectId(id),
        resourceType: ENTITY_TODO,
      });

      if (!relation) {
        throw new ForbiddenException(ErrorMessages.FORBIDDEN_READ);
      }

      return todo;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException(ErrorMessages.FAILED_TO_FETCH_TODO);
    }
  }

  async create(createTodoDto: CreateTodoDto, userId: string): Promise<TodoDocument> {
    try {
      const newTodo = new this.todoModel(createTodoDto);
      const savedTodo = await newTodo.save();

      await this.relationModel.create({
        subjectId: new Types.ObjectId(userId),
        resourceId: savedTodo._id,
        resourceType: ENTITY_TODO,
        role: Role.Owner,
      });

      return savedTodo;
    } catch (error) {
      throw new InternalServerErrorException(ErrorMessages.FAILED_TO_CREATE);
    }
  }

  async update(id: string, updateTodoDto: UpdateTodoDto, userId: string): Promise<TodoDocument> {
    try {
      const relation = await this.relationModel.findOne({
        subjectId: new Types.ObjectId(userId),
        resourceId: new Types.ObjectId(id),
        resourceType: ENTITY_TODO,
        role: { $in: [Role.Owner, Role.Editor] },
      });

      if (!relation) {
        throw new ForbiddenException(ErrorMessages.FORBIDDEN_UPDATE);
      }

      const updatedTodo = await this.todoModel
        .findByIdAndUpdate(id, updateTodoDto, { new: true });

      if (!updatedTodo) {
        throw new NotFoundException(ErrorMessages.TODO_NOT_FOUND);
      }

      return updatedTodo;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException(ErrorMessages.FAILED_TO_UPDATE);
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const relation = await this.relationModel.findOne({
        subjectId: new Types.ObjectId(userId),
        resourceId: new Types.ObjectId(id),
        resourceType: ENTITY_TODO,
        role: Role.Owner,
      });

      if (!relation) {
        throw new ForbiddenException(ErrorMessages.FORBIDDEN_DELETE);
      }

      const deletedTodo = await this.todoModel.findByIdAndDelete(id);
      if (!deletedTodo) {
        throw new NotFoundException(ErrorMessages.TODO_NOT_FOUND);
      }

      await this.relationModel.deleteMany({
        resourceId: new Types.ObjectId(id),
        resourceType: ENTITY_TODO,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException(ErrorMessages.FAILED_TO_DELETE);
    }
  }

  async share(id: string, shareDto: ShareTodoDto, userId: string): Promise<RelationDocument> {
    try {
      const ownerRelation = await this.relationModel.findOne({
        subjectId: new Types.ObjectId(userId),
        resourceId: new Types.ObjectId(id),
        resourceType: ENTITY_TODO,
        role: Role.Owner,
      });

      if (!ownerRelation) {
        throw new ForbiddenException(ErrorMessages.FORBIDDEN_SHARE);
      }

      const todoExists = await this.todoModel.exists({ _id: new Types.ObjectId(id) });
      if (!todoExists) {
        throw new NotFoundException(ErrorMessages.TODO_NOT_FOUND);
      }

      const targetUserId = new Types.ObjectId(shareDto.userId);
      const resourceId = new Types.ObjectId(id);

      await this.relationModel.deleteMany({
        subjectId: targetUserId,
        resourceId: resourceId,
        resourceType: ENTITY_TODO,
      });

      return await this.relationModel.create({
        subjectId: targetUserId,
        resourceId: resourceId,
        resourceType: ENTITY_TODO,
        role: shareDto.role,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException(ErrorMessages.FAILED_TO_SHARE);
    }
  }
}

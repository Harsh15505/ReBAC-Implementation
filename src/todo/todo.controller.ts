import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { ShareTodoDto } from './dto/share-todo.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { PoliciesGuard } from '../auth/guards/policies.guard';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { Action } from '../casl/casl.types';

@UseGuards(PoliciesGuard)
@Controller('todo')
export class TodoController {
  constructor(
    private readonly todoService: TodoService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'Todo'))
  async findAll(@CurrentUser() user: JwtUser) {
    return await this.todoService.findAll(user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const ability = this.caslAbilityFactory.defineAbilityFor(user);
    return await this.todoService.findOne(id, ability);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Todo'))
  async create(@Body() createTodoDto: CreateTodoDto, @CurrentUser() user: JwtUser) {
    return await this.todoService.create(createTodoDto, user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @CurrentUser() user: JwtUser,
  ) {
    const ability = this.caslAbilityFactory.defineAbilityFor(user);
    return await this.todoService.update(id, updateTodoDto, ability);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const ability = this.caslAbilityFactory.defineAbilityFor(user);
    return await this.todoService.remove(id, ability);
  }

  @Post(':id/share')
  @HttpCode(HttpStatus.OK)
  async share(
    @Param('id') id: string,
    @Body() shareDto: ShareTodoDto,
    @CurrentUser() user: JwtUser,
  ) {
    const ability = this.caslAbilityFactory.defineAbilityFor(user);
    return await this.todoService.share(id, shareDto, ability);
  }
}
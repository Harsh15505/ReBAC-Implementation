import { IsEnum, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { Role } from '../enums/roles.enum';

export class ShareTodoDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

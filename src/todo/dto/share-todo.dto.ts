import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ShareTodoDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['editor', 'viewer'])
  role: 'editor' | 'viewer';
}

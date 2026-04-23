import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";


export class CreateTodoDto{

    @IsNotEmpty({ message: 'Title cannot be empty' })
    @IsString({ message: 'Title must be a string' })
    @MaxLength(100)
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
}
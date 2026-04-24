import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type TodoDocument = HydratedDocument<Todo>;

@Schema({ timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
} })
export class Todo{
    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ default: false })
    completed: boolean;
}

export const TodoSchema = SchemaFactory.createForClass(Todo);

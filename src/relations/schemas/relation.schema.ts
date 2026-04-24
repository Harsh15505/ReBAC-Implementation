import { subject } from "@casl/ability";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Role } from "src/todo/enums/roles.enum";


export type RelationDocument = Relation & Document;

@Schema({
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
})
export class Relation {
    @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
    subjectId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, required: true })
    resourceId: Types.ObjectId;

    @Prop({ type: String, required: true })
    resourceType: string;

    @Prop({ type: String, enum: Role, required: true })
    role: Role;
}

export const RelationSchema = SchemaFactory.createForClass(Relation);

RelationSchema.index({ subjectId: 1, resourceId: 1, resourceType: 1, role: 1 }, { unique: true });

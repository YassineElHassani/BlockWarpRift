import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'ADMIN',
  MERCHANT = 'MERCHANT',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  Email!: string;

  @Prop({ required: true })
  Password!: string;

  @Prop({
    enum: UserRole,
    default: UserRole.MERCHANT,
  })
  Role!: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);

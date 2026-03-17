import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: { email: string; password: string }): Promise<UserDocument> {
    return this.userModel.create({ Email: data.email, Password: data.password });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ Email: email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
}


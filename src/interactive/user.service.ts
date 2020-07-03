import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Account } from './account.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {
  }

  async findByAccount(account: string) {
    const found = await this.accountRepo.findOne({ account });
    return found?.user;
  }
}

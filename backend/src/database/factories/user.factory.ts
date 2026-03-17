import { faker } from '@faker-js/faker';
import { User, UserStatus } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';

export class UserFactory {
  static build(overrides: Partial<User> = {}): User {
    const user = new User();
    user.name = faker.person.fullName();
    user.email = faker.internet.email();
    user.status = UserStatus.ACTIVE;
    user.roles = [];

    Object.assign(user, overrides);
    return user;
  }

  static buildWithRoles(roles: Role[], overrides: Partial<User> = {}): User {
    const user = this.build(overrides);
    user.roles = roles;
    return user;
  }
}

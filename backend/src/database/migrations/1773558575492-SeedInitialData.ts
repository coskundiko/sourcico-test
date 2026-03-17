import { MigrationInterface, QueryRunner } from 'typeorm';
import { RoleFactory } from '../factories/role.factory';
import { UserFactory } from '../factories/user.factory';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entity';

export class SeedInitialData1773558575492 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const roleRepo = queryRunner.manager.getRepository(Role);
    const userRepo = queryRunner.manager.getRepository(User);

    // 1. Create Roles
    const adminRole = RoleFactory.getAdminRole();
    const editorRole = RoleFactory.getEditorRole();
    const viewerRole = RoleFactory.getViewerRole();

    await roleRepo.save([adminRole, editorRole, viewerRole]);

    // 2. Create Users
    const adminUser = UserFactory.buildWithRoles([adminRole], {
      name: 'Admin User',
      email: 'admin@test.com',
    });

    const editorUser = UserFactory.buildWithRoles([editorRole], {
      name: 'Editor User',
      email: 'editor@test.com',
    });

    const viewerUser = UserFactory.buildWithRoles([viewerRole], {
      name: 'Viewer User',
      email: 'viewer@test.com',
    });

    await userRepo.save([adminUser, editorUser, viewerUser]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const userRepo = queryRunner.manager.getRepository(User);
    const roleRepo = queryRunner.manager.getRepository(Role);

    await userRepo.delete({ email: 'admin@test.com' });
    await userRepo.delete({ email: 'editor@test.com' });
    await userRepo.delete({ email: 'viewer@test.com' });

    await roleRepo.delete({ name: 'Admin' });
    await roleRepo.delete({ name: 'Editor' });
    await roleRepo.delete({ name: 'Viewer' });
  }
}

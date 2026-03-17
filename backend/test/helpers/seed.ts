import { DataSource } from 'typeorm';
import { User, UserStatus } from '../../src/users/entities/user.entity';
import { Role } from '../../src/roles/entities/role.entity';
import { RolePermission } from '../../src/roles/entities/role-permission.entity';
import { Permission } from '../../src/common/enums/permission.enum';

export interface SeededIds {
  adminUserId: number;
  editorUserId: number;
  viewerUserId: number;
  viewerRoleId: number;
  toDeleteUserId: number;
}

export async function seedE2EData(ds: DataSource): Promise<SeededIds> {
  const userRepo = ds.getRepository(User);
  const roleRepo = ds.getRepository(Role);
  const permRepo = ds.getRepository(RolePermission);

  await ds.query('TRUNCATE TABLE "user_roles" CASCADE');
  await ds.query('TRUNCATE TABLE "role_permissions" CASCADE');
  await ds.query('TRUNCATE TABLE "users" CASCADE');
  await ds.query('TRUNCATE TABLE "roles" CASCADE');

  const adminRole = await roleRepo.save(roleRepo.create({ name: 'Admin' }));
  const editorRole = await roleRepo.save(roleRepo.create({ name: 'Editor' }));
  const viewerRole = await roleRepo.save(roleRepo.create({ name: 'Viewer' }));

  const adminPerms = [
    Permission.USER_VIEW, Permission.USER_CREATE, Permission.USER_EDIT, Permission.USER_DELETE,
    Permission.ROLE_VIEW, Permission.ROLE_EDIT,
  ].map((code) => permRepo.create({ code, role: adminRole }));

  const editorPerms = [
    Permission.USER_VIEW, Permission.USER_EDIT, Permission.ROLE_VIEW,
  ].map((code) => permRepo.create({ code, role: editorRole }));

  const viewerPerms = [
    Permission.USER_VIEW,
  ].map((code) => permRepo.create({ code, role: viewerRole }));

  await permRepo.save([...adminPerms, ...editorPerms, ...viewerPerms]);

  const adminUser = await userRepo.save(
    userRepo.create({ name: 'Admin', email: 'admin@test.com', status: UserStatus.ACTIVE, roles: [adminRole] }),
  );
  const editorUser = await userRepo.save(
    userRepo.create({ name: 'Editor', email: 'editor@test.com', status: UserStatus.ACTIVE, roles: [editorRole] }),
  );
  const viewerUser = await userRepo.save(
    userRepo.create({ name: 'Viewer', email: 'viewer@test.com', status: UserStatus.ACTIVE, roles: [viewerRole] }),
  );
  const toDeleteUser = await userRepo.save(
    userRepo.create({ name: 'ToDelete', email: 'delete@test.com', status: UserStatus.ACTIVE, roles: [viewerRole] }),
  );

  return {
    adminUserId: adminUser.id,
    editorUserId: editorUser.id,
    viewerUserId: viewerUser.id,
    viewerRoleId: viewerRole.id,
    toDeleteUserId: toDeleteUser.id,
  };
}

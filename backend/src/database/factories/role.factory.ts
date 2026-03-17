import { Role } from '../../roles/entities/role.entity';
import { RolePermission } from '../../roles/entities/role-permission.entity';
import { Permission } from '../../common/enums/permission.enum';

export class RoleFactory {
  static createRole(name: string, permissions: Permission[]): Role {
    const role = new Role();
    role.name = name;
    role.permissions = permissions.map((code) => {
      const rp = new RolePermission();
      rp.code = code;
      return rp;
    });
    return role;
  }

  static getAdminRole(): Role {
    return this.createRole('Admin', [
      Permission.USER_VIEW,
      Permission.USER_CREATE,
      Permission.USER_EDIT,
      Permission.USER_DELETE,
      Permission.ROLE_VIEW,
      Permission.ROLE_EDIT,
    ]);
  }

  static getEditorRole(): Role {
    return this.createRole('Editor', [
      Permission.USER_VIEW,
      Permission.USER_EDIT,
      Permission.ROLE_VIEW,
    ]);
  }

  static getViewerRole(): Role {
    return this.createRole('Viewer', [Permission.USER_VIEW]);
  }
}

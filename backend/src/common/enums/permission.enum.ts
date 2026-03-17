export enum Permission {
  USER_VIEW = 1000,
  USER_CREATE = 1001,
  USER_EDIT = 1002,
  USER_DELETE = 1003,

  ROLE_VIEW = 1100,
  ROLE_EDIT = 1101,
}

export const PermissionLabels: Record<Permission, string> = {
  [Permission.USER_VIEW]: 'user.view',
  [Permission.USER_CREATE]: 'user.create',
  [Permission.USER_EDIT]: 'user.edit',
  [Permission.USER_DELETE]: 'user.delete',
  [Permission.ROLE_VIEW]: 'role.view',
  [Permission.ROLE_EDIT]: 'role.edit',
};

export const getPermissionLabel = (permission: Permission): string => {
  return PermissionLabels[permission];
};

export const getPermissionFromLabel = (label: string): Permission | undefined => {
  const entry = Object.entries(PermissionLabels).find(([_, l]) => l === label);
  return entry ? (Number(entry[0]) as Permission) : undefined;
};

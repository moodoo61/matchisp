export type RolePermission = {
  id: string;
  code: string;
  name: string;
};

export type RoleRow = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  usersCount: number;
  permissions: RolePermission[];
};

export type CreateRolePayload = {
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
};

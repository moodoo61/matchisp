export type TeamRole = {
  id: string;
  code: string;
  name: string;
};

export type TeamMember = {
  id: string;
  name: string;
  username: string;
  status: string;
  roles: TeamRole[];
};

export type TeamRoleOption = {
  id: string;
  name: string;
  code?: string;
};

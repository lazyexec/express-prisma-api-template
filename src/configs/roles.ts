interface RoleRights {
  [key: string]: string[];
}

const allRoles: RoleRights = {
  admin: ["common", "admin"],
  user: ["common", "user"],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));
export { roles, roleRights };

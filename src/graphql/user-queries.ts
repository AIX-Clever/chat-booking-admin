// GraphQL queries and mutations for user management

export const LIST_TENANT_USERS = `
  query ListTenantUsers {
    listTenantUsers {
      userId
      tenantId
      email
      name
      role
      status
      createdAt
      lastLogin
    }
  }
`;

export const GET_TENANT_USER = `
  query GetTenantUser($userId: ID!) {
    getTenantUser(userId: $userId) {
      userId
      tenantId
      email
      name
      role
      status
      createdAt
      lastLogin
    }
  }
`;

export const INVITE_USER = `
  mutation InviteUser($input: InviteUserInput!) {
    inviteUser(input: $input) {
      userId
      tenantId
      email
      name
      role
      status
      createdAt
    }
  }
`;

export const UPDATE_USER_ROLE = `
  mutation UpdateUserRole($input: UpdateUserRoleInput!) {
    updateUserRole(input: $input) {
      userId
      email
      role
      status
    }
  }
`;

export const REMOVE_USER = `
  mutation RemoveUser($userId: ID!) {
    removeUser(userId: $userId) {
      userId
      email
      status
    }
  }
`;

export const RESET_USER_PASSWORD = `
  mutation ResetUserPassword($userId: ID!) {
    resetUserPassword(userId: $userId)
  }
`;

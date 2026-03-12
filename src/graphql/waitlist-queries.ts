// GraphQL queries and mutations for Waitlist management

export const GET_WAITING_LIST_BY_SERVICE = `
  query GetWaitingListByService($serviceId: ID!, $tenantId: ID) {
    getWaitingListByService(serviceId: $serviceId, tenantId: $tenantId) {
      tenantId
      waitingListId
      serviceId
      providerId
      clientId
      preferredDays
      requestedDates
      contactStatus
      createdAt
      ttl
    }
  }
`;

export const ADD_TO_WAITING_LIST = `
  mutation AddToWaitingList($input: AddToWaitingListInput!) {
    addToWaitingList(input: $input) {
      tenantId
      waitingListId
      serviceId
      providerId
      clientId
      preferredDays
      requestedDates
      contactStatus
      createdAt
      ttl
    }
  }
`;

export const REMOVE_WAITING_LIST_ENTRY = `
  mutation RemoveWaitingListEntry($tenantId: ID, $waitingListId: ID!) {
    removeWaitingListEntry(tenantId: $tenantId, waitingListId: $waitingListId)
  }
`;

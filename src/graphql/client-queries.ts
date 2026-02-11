
export const LIST_CLIENTS = `
  query ListClients {
    listClients {
      id
      names {
        given
        family
      }
      identifiers {
        type
        value
      }
      contactInfo {
        system
        value
        use
      }
      providerIds
      createdAt
      updatedAt
    }
  }
`;

export const GET_CLIENT = `
  query GetClient($clientId: ID!) {
    getClient(clientId: $clientId) {
      id
      names {
        given
        family
      }
      identifiers {
        type
        value
      }
      birthDate
      gender
      contactInfo {
        system
        value
        use
      }
      address {
        text
        lat
        lng
      }
      occupation
      healthInsurance {
        provider
        type
      }
      communicationLanguage
      providerIds
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_CLIENT = `
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      id
      names {
        given
        family
      }
      providerIds
    }
  }
`;

export const UPDATE_CLIENT = `
  mutation UpdateClient($input: UpdateClientInput!) {
    updateClient(input: $input) {
      id
      names {
        given
        family
      }
      providerIds
      updatedAt
    }
  }
`;

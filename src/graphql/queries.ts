
export const LIST_PROVIDERS = `
  query ListProviders {
    listProviders {
      providerId
      name
      timezone
      available
    }
  }
`;

export const LIST_BOOKINGS_BY_PROVIDER = `
  query ListBookingsByProvider($input: ListBookingsByProviderInput!) {
    listBookingsByProvider(input: $input) {
      bookingId
      clientName
      clientEmail
      clientPhone
      start
      end
      status
      notes
      serviceId
      providerId
    }
  }
`;

export const GET_SERVICE = `
  query GetService($serviceId: ID!) {
     getService(serviceId: $serviceId) {
        name
     }
}
`;

export const CANCEL_BOOKING = `
  mutation CancelBooking($input: CancelBookingInput!) {
    cancelBooking(input: $input) {
      bookingId
      status
    }
  }
`;

export const REGISTER_TENANT = `
  mutation RegisterTenant($input: RegisterTenantInput!) {
    registerTenant(input: $input) {
      tenantId
      name
      billingEmail
      status
    }
  }
`;

export const UPDATE_TENANT = `
  mutation UpdateTenant($input: UpdateTenantInput!) {
    updateTenant(input: $input) {
      tenantId
      name
      plan
      billingEmail
    }
  }
`;

export const CREATE_SERVICE = `
  mutation CreateService($input: CreateServiceInput!) {
    createService(input: $input) {
      serviceId
      name
      durationMinutes
      price
    }
  }
`;

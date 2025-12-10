
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


export const LIST_PROVIDERS = `
  query ListProviders {
    listProviders {
      providerId
      name
      bio
      serviceIds
      timezone
      metadata
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

export const SEARCH_SERVICES = `
  query SearchServices($text: String) {
    searchServices(text: $text) {
      serviceId
      name
      durationMinutes
      category
      price
    }
  }
`;

export const CREATE_BOOKING = `
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      bookingId
      clientName
      clientEmail
      start
      status
    }
  }
`;

export const CONFIRM_BOOKING = `
  mutation ConfirmBooking($input: ConfirmBookingInput!) {
    confirmBooking(input: $input) {
      bookingId
      status
    }
  }
`;

export const MARK_AS_NO_SHOW = `
  mutation MarkAsNoShow($input: MarkAsNoShowInput!) {
    markAsNoShow(input: $input) {
      bookingId
      status
    }
  }
`;

export const UPDATE_SERVICE = `
  mutation UpdateService($input: UpdateServiceInput!) {
    updateService(input: $input) {
      serviceId
      name
      description
      category
      durationMinutes
      price
      available
    }
  }
`;

export const DELETE_SERVICE = `
  mutation DeleteService($serviceId: ID!) {
    deleteService(serviceId: $serviceId) {
      serviceId
    }
  }
`;

export const GET_PROVIDER_AVAILABILITY = `
  query GetProviderAvailability($providerId: ID!) {
    getProviderAvailability(providerId: $providerId) {
      providerId
      dayOfWeek
      timeRanges {
        startTime
        endTime
      }
      breaks {
        startTime
        endTime
      }
      exceptions
    }
  }
`;

export const SET_PROVIDER_AVAILABILITY = `
  mutation SetProviderAvailability($input: SetAvailabilityInput!) {
    setProviderAvailability(input: $input) {
      providerId
      dayOfWeek
      timeRanges {
        startTime
        endTime
      }
    }
  }
`;

export const SET_PROVIDER_EXCEPTIONS = `
  mutation SetProviderExceptions($input: SetExceptionsInput!) {
    setProviderExceptions(input: $input) {
      providerId
      exceptions
    }
  }
`;

export const LIST_CATEGORIES = `
  query ListCategories($activeOnly: Boolean) {
  listCategories(activeOnly: $activeOnly) {
    categoryId
    name
    description
    isActive
    displayOrder
  }
}
`;

export const CREATE_CATEGORY = `
  mutation CreateCategory($input: CreateCategoryInput!) {
  createCategory(input: $input) {
    categoryId
    name
    description
    isActive
    displayOrder
  }
}
`;

export const UPDATE_CATEGORY = `
  mutation UpdateCategory($input: UpdateCategoryInput!) {
  updateCategory(input: $input) {
    categoryId
    name
    description
    isActive
    displayOrder
  }
}
`;

export const DELETE_CATEGORY = `
  mutation DeleteCategory($categoryId: ID!) {
  deleteCategory(categoryId: $categoryId) {
    categoryId
  }
}
`;

export const CREATE_PROVIDER = `
  mutation CreateProvider($input: CreateProviderInput!) {
    createProvider(input: $input) {
      providerId
      name
      bio
      serviceIds
      timezone
      metadata
      available
    }
  }
`;

export const UPDATE_PROVIDER = `
  mutation UpdateProvider($input: UpdateProviderInput!) {
    updateProvider(input: $input) {
      providerId
      name
      bio
      serviceIds
      timezone
      metadata
      available
    }
  }
`;

export const DELETE_PROVIDER = `
  mutation DeleteProvider($providerId: ID!) {
    deleteProvider(providerId: $providerId) {
      providerId
    }
  }
`;

export const GET_TENANT = `
  query GetTenant($tenantId: ID) {
    getTenant(tenantId: $tenantId) {
      tenantId
      name
      status
      plan
      billingEmail
      settings
      createdAt
      updatedAt
    }
  }
`;

export const GET_DASHBOARD_METRICS = `
  query GetDashboardMetrics {
    getDashboardMetrics {
      period
      summary {
        revenue
        bookings
        messages
        tokensIA
        conversionsChat
        aiResponses
        conversionRate
        autoAttendanceRate
      }
      daily {
        date
        bookings
        messages
      }
      topServices {
        serviceId
        name
        bookings
      }
      topProviders {
        providerId
        name
        bookings
      }
      bookingStatus {
        CONFIRMED
        PENDING
        CANCELLED
        NO_SHOW
      }
      errors {
        type
        count
        lastOccurred
      }
    }
  }
`;

export const GET_PLAN_USAGE = `
  query GetPlanUsage {
    getPlanUsage {
      messages
      bookings
      tokensIA
    }
  }
`;

export const LIST_FAQS = `
  query ListFAQs {
    listFAQs {
      faqId
      question
      answer
      category
      active
    }
  }
`;

export const CREATE_FAQ = `
  mutation CreateFAQ($input: CreateFAQInput!) {
    createFAQ(input: $input) {
      faqId
      question
      answer
      category
      active
    }
  }
`;

export const UPDATE_FAQ = `
  mutation UpdateFAQ($input: UpdateFAQInput!) {
    updateFAQ(input: $input) {
      faqId
      question
      answer
      category
      active
    }
  }
`;

export const DELETE_FAQ = `
  mutation DeleteFAQ($faqId: ID!) {
     deleteFAQ(faqId: $faqId) {
       faqId
     }
  }
`;

export const LIST_WORKFLOWS = `
  query ListWorkflows {
    listWorkflows {
      workflowId
      name
      description
      isActive
      steps
      updatedAt
    }
  }
`;

export const GET_WORKFLOW = `
  query GetWorkflow($workflowId: ID!) {
    getWorkflow(workflowId: $workflowId) {
      workflowId
      name
      description
      isActive
      steps
      metadata
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_WORKFLOW = `
  mutation CreateWorkflow($input: CreateWorkflowInput!) {
    createWorkflow(input: $input) {
      workflowId
      name
      description
      isActive
      steps
    }
  }
`;

export const UPDATE_WORKFLOW = `
  mutation UpdateWorkflow($input: UpdateWorkflowInput!) {
    updateWorkflow(input: $input) {
      workflowId
      name
      description
      isActive
      steps
      metadata
      updatedAt
    }
  }
`;

export const DELETE_WORKFLOW = `
  mutation DeleteWorkflow($workflowId: ID!) {
     deleteWorkflow(workflowId: $workflowId) {
       workflowId
     }
  }
`;

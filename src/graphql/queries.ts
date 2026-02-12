
export const LIST_PROVIDERS = `
  query ListProviders {
    listProviders {
      providerId
      name
      bio
      serviceIds
      timezone
      photoUrl
      photoUrlThumbnail
      metadata
      available
      hasGoogleCalendar
      slug
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
      roomId
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
      slug
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
      category
      durationMinutes
      price
      requiredRoomIds
    }
  }
`;

export const SEARCH_SERVICES = `
  query SearchServices($text: String, $availableOnly: Boolean) {
    searchServices(text: $text, availableOnly: $availableOnly) {
      serviceId
      name
      durationMinutes
      category
      price
      requiredRoomIds
      locationType
      available
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
      requiredRoomIds
      locationType
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
      exceptions {
        date
        timeRanges {
          startTime
          endTime
        }
      }
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
      exceptions {
        date
        timeRanges {
          startTime
          endTime
        }
      }
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
      photoUrl
      photoUrlThumbnail
      metadata
      available
      hasGoogleCalendar
      slug
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
      photoUrl
      photoUrlThumbnail
      metadata
      available
      hasGoogleCalendar
      slug
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
      slug
      status
      plan
      billingEmail
      settings
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
      providers
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

export const UPDATE_BOOKING_STATUS = `
  mutation UpdateBookingStatus($bookingId: ID!, $status: String!) {
    updateBookingStatus(bookingId: $bookingId, status: $status) {
      bookingId
      status
    }
  }
`;

export const LIST_ROOMS = `
  query ListRooms {
    listRooms {
      roomId
      tenantId
      name
      description
      capacity
      status
      isVirtual
      minDuration
      maxDuration
      operatingHours
      metadata
      createdAt
      updatedAt
    }
  }
`;

export const GET_ROOM = `
  query GetRoom($roomId: ID!) {
    getRoom(roomId: $roomId) {
      roomId
      tenantId
      name
      description
      capacity
      status
      isVirtual
      minDuration
      maxDuration
      operatingHours
      metadata
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_ROOM = `
  mutation CreateRoom($input: CreateRoomInput!) {
    createRoom(input: $input) {
      roomId
      name
      description
      capacity
      status
      isVirtual
      minDuration
      maxDuration
      operatingHours
      metadata
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ROOM = `
  mutation UpdateRoom($input: UpdateRoomInput!) {
    updateRoom(input: $input) {
      roomId
      name
      description
      capacity
      status
      isVirtual
      minDuration
      maxDuration
      operatingHours
      metadata
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_ROOM = `
  mutation DeleteRoom($roomId: ID!) {
  deleteRoom(roomId: $roomId) {
    roomId
  }
}
`;

export const GENERATE_PRESIGNED_URL = `
  mutation GeneratePresignedUrl($fileName: String!, $contentType: String!) {
    generatePresignedUrl(fileName: $fileName, contentType: $contentType)
  }
`;

export const LIST_API_KEYS = `
  query ListApiKeys {
    listApiKeys {
      apiKeyId
      name
      keyPreview
      status
      createdAt
      lastUsedAt
    }
  }
`;

export const CREATE_API_KEY = `
  mutation CreateApiKey($name: String) {
    createApiKey(name: $name) {
      apiKeyId
      name
      keyPreview
      status
      createdAt
      apiKey
    }
  }
`;

export const REVOKE_API_KEY = `
  mutation RevokeApiKey($apiKeyId: ID!) {
    revokeApiKey(apiKeyId: $apiKeyId) {
      apiKeyId
      status
    }
  }
`;

export const SUBSCRIBE = `
  mutation Subscribe($planId: String!, $email: String, $backUrl: String) {
    subscribe(planId: $planId, email: $email, backUrl: $backUrl) {
      subscriptionId
      initPoint
      message
    }
  }
`;

export const GET_AVAILABLE_SLOTS = `
  query GetAvailableSlots($input: GetAvailableSlotsInput!) {
    getAvailableSlots(input: $input) {
      providerId
      serviceId
      start
      end
      isAvailable
    }
  }
`;

export const GET_PUBLIC_LINK_STATUS = `
  query GetPublicLinkStatus($providerId: String) {
    getPublicLinkStatus(providerId: $providerId) {
      isPublished
      publishedAt
      slug
      publicUrl
      completenessPercentage
      completenessChecklist {
        item
        status
        label
        isRequired
      }
    }
  }
`;

export const SET_PUBLIC_LINK_STATUS = `
  mutation SetPublicLinkStatus($isPublished: Boolean!) {
    setPublicLinkStatus(isPublished: $isPublished) {
      success
      isPublished
      publishedAt
      message
    }
  }
`;


export const LIST_BOOKINGS_BY_CLIENT = `
  query ListBookingsByClient($input: ListBookingsByClientInput!) {
    listBookingsByClient(input: $input) {
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

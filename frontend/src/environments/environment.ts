export const environment = {
  production: false,
  apiUrl: 'http://localhost:9080',
  // IMPORTANT: This must be your Stripe PUBLISHABLE key (pk_test_...), NOT secret key (sk_test_...)
  // Get your publishable key from: https://dashboard.stripe.com/test/apikeys
  stripePublicKey: 'pk_test_51Qoq2iA0ESShc8j98vcBdOqfojuxg1Ck0mGEN6jbmILjYqtbO0ru7TNSsuGq0Ni769iIg5gWoYQy77I9tcTLmeez00PCLYk9mP', // Replace with your Stripe PUBLISHABLE key
  googleMapsApiKey: 'AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Replace with your Google Maps API key
  // Get your PayPal client ID from: https://developer.paypal.com/dashboard/applications/sandbox
  paypalClientId: 'ASJItSF796pXcHJ3_hipemmX0X71ICeBYDZ_DyM9JiBRRI2D461yQyxW3WvPgw6eBnaE8ZR8rFg9UvHq', // Replace with your PayPal Sandbox Client ID
  endpoints: {
    auth: {
      login: '/api/v1/auth/login',
      register: '/api/v1/auth/register',
      logout: '/api/v1/auth/logout',
      refresh: '/api/v1/auth/refresh'
    },
    users: {
      base: '/api/v1/users',
      profile: '/api/v1/users/profile',
      update: '/api/v1/users/profile'
    },
    travels: {
      base: '/api/v1/travels',
      search: '/api/v1/travels/search/advanced',
      byId: (id: string) => `/api/v1/travels/${id}`,
      byManager: '/api/v1/travels/my-travels',
      managerStats: '/api/v1/travels/manager/stats'
    },
    subscriptions: {
      base: '/api/v1/subscriptions',
      byUser: '/api/v1/subscriptions/my-subscriptions',
      byTravel: (travelId: string) => `/api/v1/subscriptions/travel/${travelId}`
    },
    payments: {
      base: '/api/v1/payments',
      process: '/api/v1/payments/process',
      bySubscription: (subscriptionId: string) => `/api/v1/payments/subscription/${subscriptionId}`
    },
    feedbacks: {
      base: '/api/v1/feedbacks',
      byTravel: (travelId: string) => `/api/v1/feedbacks/travel/${travelId}`,
      myFeedbacks: '/api/v1/feedbacks/my-feedbacks'
    },
    reports: {
      base: '/api/v1/reports',
      dashboard: '/api/v1/reports/dashboard'
    },
    dashboard: {
      admin: '/api/v1/dashboard/admin',
      manager: '/api/v1/dashboard/manager',
      traveler: '/api/v1/dashboard/traveler'
    },
    admin: {
      base: '/api/v1/admin'
    }
  },
  features: {
    enableElasticsearch: true,
    enableNeo4jRecommendations: true,
    enableAnalytics: true
  }
};

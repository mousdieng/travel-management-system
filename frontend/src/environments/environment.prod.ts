export const environment = {
  production: true,
  apiUrl: 'https://api.travel-management.com',
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
    }
  },
  features: {
    enableElasticsearch: true,
    enableNeo4jRecommendations: true,
    enableAnalytics: true
  }
};

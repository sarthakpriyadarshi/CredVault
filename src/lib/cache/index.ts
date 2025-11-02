/**
 * Cache Module
 * 
 * Central export for all caching functionality using Next.js 16 Cache Components
 */

export {
  isUserAdmin,
  getUserRole,
  getUserVerificationStatus,
  getUserCacheInfo,
  hasAdminUser,
  type UserCacheInfo,
} from "./user-cache"

export {
  invalidateUserRole,
  invalidateUserVerification,
  invalidateAllUsers,
  invalidateAdminExists,
  refreshAllUserCaches,
} from "./invalidation"

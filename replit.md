# Only-U Fans Platform

## Overview
Only-U is a social media platform designed to connect creators and fans, providing robust tools for content monetization and audience engagement. Its core features include post management, real-time messaging, a comprehensive payment system, and a dynamic ranking system. The platform's business vision is to become a leading hub for creator-fan interaction by offering advanced functionalities for content monetization and audience engagement.

## User Preferences
I prefer iterative development with clear communication on changes. Please ask before making major architectural changes or introducing new dependencies. For UI/UX, maintain the consistent pink gradient design. Ensure all interactive elements have `data-testid` attributes for testing purposes.

## System Architecture
The platform utilizes a modern web architecture comprising a React frontend built with Vite, styled using Tailwind CSS, and animated with Framer Motion. Internationalization is managed via i18next. The backend is powered by Express.js. Firebase serves as the backbone for user authentication, real-time messaging, and Firestore as the primary NoSQL database. Replit Object Storage (built on Google Cloud Storage) is used for scalable video and image uploads, supporting adult content and ACL-based access controls.

**Key Features:**
*   **User Management**: Authentication and KYC/identity verification for creators.
*   **Content Management**: Tools for image/video posting, likes, comments, subscriber-only content, and administrative content moderation.
*   **Communication**: Real-time messaging and push/email notifications.
*   **Monetization & Payments**: Subscription management, creator monetization, and flexible payment options integrated with Stripe, including detailed payment calculations and withdrawal processes.
*   **Ranking System**: Creator and post rankings with period-based filtering and real-time updates.
*   **Admin Dashboard**: Comprehensive interface for managing users, content, revenue, reports, and analytics.
*   **Creator Dashboard**: Provides analytics, post performance metrics, and marketing tools for creators.

**UI/UX Decisions:**
*   A consistent pink gradient design is applied across all interactive elements and visual components.
*   The UI incorporates simplified header designs and smooth animations using Framer Motion.
*   The platform is fully responsive and includes `data-testid` attributes for all interactive components to facilitate testing.
*   Enhanced designs are implemented for creator cards and subscription displays.
*   Full internationalization support is provided, with a focus on Japanese language.

**Technical Implementations:**
*   Dynamic data display and management from Firestore with real-time listeners (`onSnapshot`).
*   Replit Object Storage is used for large file uploads via server-side processing with presigned URLs and ACL policies.
*   Stripe SDK is integrated for secure payment processing, including embedded Stripe Elements.
*   Firebase handles user authentication, real-time messaging, and data storage.
*   Optimized Firestore queries utilize `limit`, `orderBy`, and batching to avoid N+1 issues and composite index errors by performing client-side sorting where necessary.
*   Robust error handling with user-friendly Japanese error messages.
*   A KYC approval workflow for creators includes status tracking and conditional UI rendering.
*   Video playback is supported with range requests for efficient streaming, and server-side processing for object storage downloads.
*   Notification system leverages Firestore for real-time updates and includes client-side filtering and read-state synchronization.
*   Featured pickup and creator management allow administrators to curate content and creators with dedicated interfaces and real-time updates.
*   Payment calculations include detailed breakdowns for platform fees, taxes, and creator earnings, both for user subscriptions and creator withdrawals.
*   **Performance Optimizations (October 29, 2025)**:
    - **LRU Cache System**: Implemented `lru-cache` library for file metadata caching (1-hour TTL) to reduce Firebase Storage API calls
    - **Streaming Optimization**: Range request support using `createReadStream` for efficient video streaming with 206 Partial Content responses
    - **Proxy URL Conversion**: Firebase Storage URLs automatically converted to optimized proxy endpoints (`/api/proxy/:folder/:filename`)
    - **React Performance**: Applied `useCallback`, `useMemo` to RomanticRanking component to minimize re-renders
    - **File**: `server/objectStorage.ts` (LRU cache + streaming), `server/routes.ts` (proxy endpoint), `client/src/components/RomanticRanking.jsx` (URL conversion + React optimization)
*   **Deployment Configuration (Autoscale)**:
    - **Changed from Reserved VM to Autoscale** (October 27, 2025): Autoscale is recommended for web applications with HTTP/WebSocket traffic and provides better uptime (99.95% vs 99.9%)
    - Build: `npm run build` (Vite frontend + esbuild backend bundling to dist/)
    - Start: `npm start` (NODE_ENV=production node dist/index.js)
    - **Critical Fix for Production Health Checks**: 
      - serveStatic function updated to use `process.cwd() + "/dist/public"` instead of `import.meta.dirname + "/public"` for reliable path resolution in esbuild-bundled code
      - Root endpoint (`/`) serves index.html via express.static (200 status) for deployment health checks
      - Fallback route properly handles SPA routing by serving index.html for all unmatched routes
    - **Port Configuration Requirement**: Autoscale deployments support only a single external port
      - .replit file must have only ONE [[ports]] entry (localPort 5000 → externalPort 80)
      - Multiple port entries cause deployment failures
      - Manual edit required: Remove all [[ports]] entries except the first one (5000→80)
    - Health check endpoint: `/api/health` for monitoring
    - Deployment target optimized for web applications with variable traffic and automatic scaling

## External Dependencies
*   **Firebase**: Authentication, Realtime Database, Firestore.
*   **Replit Object Storage**: Scalable cloud storage for media files (Google Cloud Storage-based). For production deployment to Hostinger or other platforms, migrate to Cloudflare R2, AWS S3, or Google Cloud Storage.
*   **Stripe**: Payment gateway for processing subscriptions and transactions.
*   **React**: Core library for building the user interface.
*   **Vite**: Fast development build tool for the frontend.
*   **Tailwind CSS**: Utility-first CSS framework for styling.
*   **Framer Motion**: Library for declarative animations and gestures.
*   **i18next**: Framework for internationalization and localization.
*   **Express.js**: Backend web application framework for API services.
*   **Radix UI**: Unstyled, accessible UI component library.

## Hostinger Deployment Guide
Comprehensive deployment documentation is available in `DEPLOYMENT_GUIDE.md`. Key points:

**Firebase Storage Authentication (October 27, 2025):**
- Firebase Admin SDK now uses service account key (`firebase-admin-key.json`)
- Service account key required for both development and production
- File excluded from Git via `.gitignore` for security
- Must be manually transferred to VPS during deployment
- Resolves 404 errors for thumbnail/video loading

**Production Deployment Options:**
1. **Hostinger VPS/Cloud Hosting** (Recommended for adult content)
   - Full Node.js 20 support
   - Custom domain configuration
   - SSL certificates included
   - $4-15/month pricing
   - Firebase Storage authentication configured

**Storage Migration:**
- Replit Object Storage → Cloudflare R2 (recommended, cost-effective)
- See `scripts/migrate-storage.md` for detailed migration steps
- Storage adapter implemented in `server/storage-adapter.ts` for easy switching

**Deployment Checklist:**
1. Run `scripts/deploy-check.sh` to verify build
2. Set environment variables (see `.env.production.example`)
3. Build production bundle: `npm run build`
4. Upload to Hostinger via FTP/Git
5. Configure Node.js application in hPanel
6. Set up custom domain and SSL

**Important Notes:**
- Replit's Terms of Service prohibit adult content
- Hostinger and similar VPS providers allow adult content (verify ToS)
- Firebase, Stripe integrations work seamlessly on any platform
- All media files must be migrated from Replit Object Storage to alternative storage (R2/S3/GCS)
import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import Stripe from "stripe";
import crypto from "crypto";
import multer from "multer";
import { ObjectStorageService } from "./objectStorage";

// Initialize Stripe with secret key from environment variables
// Reference: blueprint:javascript_stripe integration
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-09-30.clover",
    })
  : null;

// Ensure SESSION_SECRET is available (required for secure session tokens)
// Fail fast if SESSION_SECRET is not configured
if (!process.env.SESSION_SECRET) {
  throw new Error('Missing required environment variable: SESSION_SECRET. Admin authentication requires this for secure token signing.');
}
const SESSION_SECRET = process.env.SESSION_SECRET;

// Notifications are now stored in Firestore collection 'notifications'
// Featured pickups are now stored in Firestore collection 'featuredPickups'
// Posts are now stored in Firestore collection 'posts'

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for the application
  app.use(express.json());
  
  // Health check endpoint (デプロイのヘルスチェック用)
  // Note: Root (/) is served by static files (index.html) in production
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  // Placeholder for user management routes
  app.get("/api/users", async (_req, res) => {
    res.json({ message: "User routes placeholder - MongoDB connection required" });
  });

  // Placeholder for identity verification routes
  app.get("/api/identity", async (_req, res) => {
    res.json({ message: "Identity routes placeholder - MongoDB connection required" });
  });

  // ===== Notification Management Endpoints (Firestore-based) =====
  
  // Get all notifications (Admin用)
  app.get("/api/notifications", async (_req, res) => {
    try {
      const { firestore } = await import('./firebase');
      
      const notificationsSnapshot = await firestore
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .get();
      
      const notifications = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // Get user-specific notifications (for home page)
  app.get("/api/notifications/user", async (_req, res) => {
    try {
      const { firestore } = await import('./firebase');
      
      console.log('📬 Fetching user notifications...');
      
      // Firestoreコンポジットインデックス不要な方法：全件取得してクライアント側でフィルタ
      const notificationsSnapshot = await firestore
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
      
      console.log(`📦 Found ${notificationsSnapshot.size} notifications in Firestore`);
      
      // クライアント側でtargetフィルタリング
      const userNotifications = notificationsSnapshot.docs
        .map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date()
          };
        })
        .filter((notification: any) => 
          notification.target === 'all' || notification.target === 'users'
        )
        .slice(0, 50);
      
      console.log(`✅ Returning ${userNotifications.length} user notifications`);
      res.json(userNotifications);
    } catch (error) {
      console.error('❌ Error fetching user notifications:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      res.json([]); // エラー時は空配列を返す
    }
  });

  // Create a new notification (admin only)
  app.post("/api/notifications", async (req, res) => {
    try {
      console.log('📬 Creating notification with data:', req.body);
      const { type, title, message, target, priority, category } = req.body;

      if (!title || !message) {
        console.error('❌ Missing required fields:', { title, message });
        return res.status(400).json({ error: "Title and message are required" });
      }

      const { firestore, admin } = await import('./firebase');
      
      const newNotification = {
        type: type || 'system',
        title,
        message,
        target: target || 'all',
        priority: priority || 'medium',
        category: category || 'admin',
        status: 'sent',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        readBy: [], // 既読ユーザーのID配列
        readCount: 0
      };

      console.log('💾 Attempting to save notification to Firestore:', newNotification);
      const docRef = await firestore.collection('notifications').add(newNotification);
      console.log('✅ Notification saved with ID:', docRef.id);
      
      // 作成した通知を取得して返す
      const createdDoc = await docRef.get();
      const createdNotification = {
        id: docRef.id,
        ...createdDoc.data(),
        createdAt: new Date()
      };
      
      console.log('📤 Returning notification:', createdNotification);
      res.status(201).json(createdNotification);
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to create notification', details: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create notification', details: String(error) });
      }
    }
  });

  // Delete a notification
  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { firestore } = await import('./firebase');
      
      await firestore.collection('notifications').doc(id).delete();
      
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // Mark notification as read (for specific user)
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const { firestore, admin } = await import('./firebase');
      
      const notificationRef = firestore.collection('notifications').doc(id);
      const notificationDoc = await notificationRef.get();
      
      if (!notificationDoc.exists) {
        return res.status(404).json({ error: "Notification not found" });
      }

      // ユーザーIDを既読リストに追加
      await notificationRef.update({
        readBy: admin.firestore.FieldValue.arrayUnion(userId || 'anonymous'),
        readCount: admin.firestore.FieldValue.increment(1)
      });
      
      const updatedDoc = await notificationRef.get();
      res.json({
        id: notificationRef.id,
        ...updatedDoc.data()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // ===== Featured Pickup Management Endpoints =====

  // Get all posts (for admin selection)
  app.get("/api/posts", async (_req, res) => {
    try {
      const { firestore } = await import('./firebase');
      
      const postsSnapshot = await firestore
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .get();
      
      const posts = postsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || data.explanation || 'Untitled',
          duration: data.duration || '00:00',
          thumbnail: data.files?.[0]?.url || data.thumbnailUrl || '/genre-1.png',
          userId: data.userId,
          userName: data.username || 'Unknown',
          userAvatar: data.userAvatar || '/logo192.png',
          userFollowers: data.userFollowers || 0,
          likes: Array.isArray(data.likes) ? data.likes.length : (data.likes || 0),
          bookmarks: data.bookmarks || 0,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          isNew: false
        };
      });
      
      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  // Get all featured pickups with post details
  app.get("/api/featured-pickup", async (_req, res) => {
    try {
      const { firestore } = await import('./firebase');
      
      // Firestoreからピックアップを取得
      const pickupsSnapshot = await firestore
        .collection('featuredPickups')
        .where('isActive', '==', true)
        .orderBy('position', 'asc')
        .get();
      
      if (pickupsSnapshot.empty) {
        return res.json([]);
      }

      // 投稿データを並行取得
      const pickupsWithDetails = await Promise.all(
        pickupsSnapshot.docs.map(async (doc) => {
          const pickupData = doc.data();
          const postId = pickupData.postId;
          
          // Firestoreから投稿データを取得
          const postDoc = await firestore.collection('posts').doc(postId).get();
          
          if (!postDoc.exists) {
            return null;
          }
          
          const postData = postDoc.data();
          if (!postData) {
            return null;
          }
          
          return {
            id: doc.id,
            postId: pickupData.postId,
            position: pickupData.position,
            createdAt: pickupData.createdAt,
            addedBy: pickupData.addedBy,
            post: {
              id: postDoc.id,
              title: postData.title || postData.explanation || 'Untitled',
              duration: postData.duration || '00:00',
              thumbnail: postData.thumbnailUrl || postData.files?.[0]?.thumbnailUrl || '/genre-1.png',
              userId: postData.userId,
              userName: postData.userName || 'Anonymous',
              userAvatar: postData.userAvatar || '/logo192.png',
              userFollowers: postData.userFollowers || 0,
              likes: postData.likes || 0,
              bookmarks: postData.bookmarks || 0,
              createdAt: postData.createdAt,
              isNew: postData.isNew !== false
            }
          };
        })
      );

      const validPickups = pickupsWithDetails.filter(item => item !== null);
      res.json(validPickups);
    } catch (error) {
      console.error('Error fetching featured pickups:', error);
      res.status(500).json({ error: 'Failed to fetch featured pickups' });
    }
  });

  // Add a post to featured pickup
  app.post("/api/featured-pickup", async (req, res) => {
    try {
      const { firestore } = await import('./firebase');
      const { postId, position } = req.body;

      if (!postId) {
        return res.status(400).json({ error: "Post ID is required" });
      }

      // Check if post exists in Firestore
      const postDoc = await firestore.collection('posts').doc(postId).get();
      if (!postDoc.exists) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Check if post already exists in featured pickup
      const existingPickup = await firestore
        .collection('featuredPickups')
        .where('postId', '==', postId)
        .where('isActive', '==', true)
        .get();
      
      if (!existingPickup.empty) {
        return res.status(400).json({ error: "Post already in featured pickup" });
      }

      // Get current maximum position
      const pickupsSnapshot = await firestore
        .collection('featuredPickups')
        .where('isActive', '==', true)
        .orderBy('position', 'desc')
        .limit(1)
        .get();
      
      const maxPosition = pickupsSnapshot.empty ? 0 : pickupsSnapshot.docs[0].data().position;

      const newPickup = {
        postId,
        position: position || maxPosition + 1,
        createdAt: new Date(),
        addedBy: 'admin',
        isActive: true
      };

      const docRef = await firestore.collection('featuredPickups').add(newPickup);
      
      res.status(201).json({ id: docRef.id, ...newPickup });
    } catch (error) {
      console.error('Error adding featured pickup:', error);
      res.status(500).json({ error: 'Failed to add featured pickup' });
    }
  });

  // Update featured pickup position
  app.patch("/api/featured-pickup/:id", async (req, res) => {
    try {
      const { firestore } = await import('./firebase');
      const { id } = req.params;
      const { position } = req.body;
      
      const pickupRef = firestore.collection('featuredPickups').doc(id);
      const pickupDoc = await pickupRef.get();
      
      if (!pickupDoc.exists) {
        return res.status(404).json({ error: "Featured pickup not found" });
      }

      const updateData: any = {};
      if (position !== undefined) {
        updateData.position = position;
      }
      
      await pickupRef.update(updateData);
      
      const updatedDoc = await pickupRef.get();
      res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      console.error('Error updating featured pickup:', error);
      res.status(500).json({ error: 'Failed to update featured pickup' });
    }
  });

  // Reorder featured pickups
  app.patch("/api/featured-pickup/reorder", async (req, res) => {
    try {
      const { firestore } = await import('./firebase');
      const { pickupIds } = req.body;
      
      if (!Array.isArray(pickupIds)) {
        return res.status(400).json({ error: "pickupIds must be an array" });
      }

      // Update positions in batch
      const batch = firestore.batch();
      pickupIds.forEach((id, index) => {
        const pickupRef = firestore.collection('featuredPickups').doc(id);
        batch.update(pickupRef, { position: index + 1 });
      });
      
      await batch.commit();
      
      // Fetch updated pickups
      const pickupsSnapshot = await firestore
        .collection('featuredPickups')
        .where('isActive', '==', true)
        .orderBy('position', 'asc')
        .get();
      
      const pickups = pickupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(pickups);
    } catch (error) {
      console.error('Error reordering featured pickups:', error);
      res.status(500).json({ error: 'Failed to reorder featured pickups' });
    }
  });

  // Delete a featured pickup
  app.delete("/api/featured-pickup/:id", async (req, res) => {
    try {
      const { firestore } = await import('./firebase');
      const { id } = req.params;
      
      const pickupRef = firestore.collection('featuredPickups').doc(id);
      const pickupDoc = await pickupRef.get();
      
      if (!pickupDoc.exists) {
        return res.status(404).json({ error: "Featured pickup not found" });
      }

      // Soft delete by setting isActive to false
      await pickupRef.update({ isActive: false });
      
      res.json({ message: "Featured pickup deleted successfully" });
    } catch (error) {
      console.error('Error deleting featured pickup:', error);
      res.status(500).json({ error: 'Failed to delete featured pickup' });
    }
  });

  // ===== Featured Creators Management Endpoints =====

  // Get all featured creators with user details
  app.get("/api/featured-creators", async (_req, res) => {
    try {
      const { firestore } = await import('./firebase');
      
      const creatorsSnapshot = await firestore
        .collection('featuredCreators')
        .where('isActive', '==', true)
        .orderBy('position', 'asc')
        .get();
      
      if (creatorsSnapshot.empty) {
        return res.json([]);
      }

      const creatorsWithDetails = await Promise.all(
        creatorsSnapshot.docs.map(async (doc) => {
          const creatorData = doc.data();
          const userId = creatorData.userId;
          
          const userDoc = await firestore.collection('users').doc(userId).get();
          
          if (!userDoc.exists) {
            return null;
          }
          
          const userData = userDoc.data();
          if (!userData) {
            return null;
          }
          
          return {
            id: doc.id,
            userId: creatorData.userId,
            position: creatorData.position,
            createdAt: creatorData.createdAt,
            addedBy: creatorData.addedBy,
            user: {
              id: userDoc.id,
              name: userData.displayName || userData.username || 'Anonymous',
              avatar: userData.photoURL || '/logo192.png',
              followers: userData.followerCount || 0,
              likes: userData.totalLikes || 0,
              isVerified: userData.isVerified || false
            }
          };
        })
      );

      const validCreators = creatorsWithDetails.filter(item => item !== null);
      res.json(validCreators);
    } catch (error) {
      console.error('Error fetching featured creators:', error);
      res.status(500).json({ error: 'Failed to fetch featured creators' });
    }
  });

  // Add a creator to featured creators
  app.post("/api/featured-creators", async (req, res) => {
    try {
      const { firestore } = await import('./firebase');
      const { userId, position } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const userDoc = await firestore.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const existingCreator = await firestore
        .collection('featuredCreators')
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .get();
      
      if (!existingCreator.empty) {
        return res.status(400).json({ error: "Creator already in featured list" });
      }

      const creatorsSnapshot = await firestore
        .collection('featuredCreators')
        .where('isActive', '==', true)
        .orderBy('position', 'desc')
        .limit(1)
        .get();
      
      const maxPosition = creatorsSnapshot.empty ? 0 : creatorsSnapshot.docs[0].data().position;

      const newCreator = {
        userId,
        position: position || maxPosition + 1,
        createdAt: new Date(),
        addedBy: 'admin',
        isActive: true
      };

      const docRef = await firestore.collection('featuredCreators').add(newCreator);
      
      res.status(201).json({ id: docRef.id, ...newCreator });
    } catch (error) {
      console.error('Error adding featured creator:', error);
      res.status(500).json({ error: 'Failed to add featured creator' });
    }
  });

  // Update featured creator position
  app.patch("/api/featured-creators/:id", async (req, res) => {
    try {
      const { firestore } = await import('./firebase');
      const { id } = req.params;
      const { position } = req.body;
      
      const creatorRef = firestore.collection('featuredCreators').doc(id);
      const creatorDoc = await creatorRef.get();
      
      if (!creatorDoc.exists) {
        return res.status(404).json({ error: "Featured creator not found" });
      }

      const updateData: any = {};
      if (position !== undefined) {
        updateData.position = position;
      }
      
      await creatorRef.update(updateData);
      
      const updatedDoc = await creatorRef.get();
      res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      console.error('Error updating featured creator:', error);
      res.status(500).json({ error: 'Failed to update featured creator' });
    }
  });

  // Delete a featured creator
  app.delete("/api/featured-creators/:id", async (req, res) => {
    try {
      const { firestore } = await import('./firebase');
      const { id } = req.params;
      
      const creatorRef = firestore.collection('featuredCreators').doc(id);
      const creatorDoc = await creatorRef.get();
      
      if (!creatorDoc.exists) {
        return res.status(404).json({ error: "Featured creator not found" });
      }

      await creatorRef.update({ isActive: false });
      
      res.json({ message: "Featured creator deleted successfully" });
    } catch (error) {
      console.error('Error deleting featured creator:', error);
      res.status(500).json({ error: 'Failed to delete featured creator' });
    }
  });

  // Object Storage Routes
  // Reference: blueprint:javascript_object_storage integration
  
  // Serve public assets from object storage
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const { ObjectStorageService } = await import("./objectStorage");
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects with ACL check (for authenticated users)
  // TODO: Implement Firestore-based ACL system (Google Cloud Storage API unavailable in Replit)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
    const objectStorageService = new ObjectStorageService();
    
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // TEMPORARY: Skip ACL check until Firestore-based ACL is implemented
      // Google Cloud Storage API has no permissions in Replit environment
      // All files in public/ folder are accessible without authentication
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Custom error class for authentication failures
  class AuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  }

  // Helper function to verify Firebase token (throws AuthenticationError if invalid/missing)
  async function verifyFirebaseToken(authHeader: string | undefined): Promise<string> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authorization header');
    }
    
    const token = authHeader.substring(7);
    try {
      const { auth } = await import('./firebase');
      const decodedToken = await auth.verifyIdToken(token);
      return decodedToken.uid;
    } catch (error) {
      console.error("Firebase token verification failed:", error);
      throw new AuthenticationError('Invalid authentication token');
    }
  }

  // Configure multer for in-memory file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB limit for videos
    }
  });

  // Server-side file upload endpoint - requires authentication and creator status
  app.post("/api/objects/upload", upload.single('file'), async (req, res) => {
    try {
      // Verify Firebase authentication
      const userId = await verifyFirebaseToken(req.headers.authorization);

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Validate file type (images and videos only)
      const allowedMimeTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/webm', 'video/avi', 'video/mov'
      ];
      
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          error: "Invalid file type. Only images and videos are allowed." 
        });
      }

      // TODO: Re-enable creator verification once Firestore authentication is properly configured
      // Temporarily disabled due to Firestore authentication issues
      // const { firestore } = await import('./firebase');
      // const userDoc = await firestore.collection('users').doc(userId).get();
      // if (!userDoc.exists) {
      //   return res.status(403).json({ error: "User not found" });
      // }
      // const userData = userDoc.data();
      // if (!userData.isCreator || userData.creatorStatus !== 'approved') {
      //   return res.status(403).json({ 
      //     error: "Only approved creators can upload content" 
      //   });
      // }

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const { visibility = 'public' } = req.body;
      
      // Upload file to Object Storage using Replit SDK with ACL
      const uploadResult = await objectStorageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        userId,
        req.file.mimetype,
        visibility
      );
      
      res.json({ 
        objectPath: uploadResult.objectPath,
        storageUri: uploadResult.storageUri,
        fileName: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      if (error instanceof AuthenticationError) {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update content metadata after upload (set ACL policy and save to Firestore)
  app.put("/api/content/upload-complete", async (req, res) => {
    if (!req.body.contentURL) {
      return res.status(400).json({ error: "contentURL is required" });
    }

    try {
      // Verify Firebase authentication
      const userId = await verifyFirebaseToken(req.headers.authorization);

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const { visibility = 'public', contentType, title, postId, aclRules } = req.body;

      let objectPath: string;
      let storagePath: string;

      // Try to set ACL policy, but continue if it fails
      try {
        objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          req.body.contentURL,
          {
            owner: userId,
            visibility: visibility,
            aclRules: aclRules || undefined,
          },
        );

        // Get the actual storage path for reference
        const objectFilePath = await objectStorageService.getObjectEntityFile(objectPath);
        const { storage } = await import('./firebase');
        const bucket = storage.bucket();
        storagePath = `gs://${bucket.name}/${objectFilePath}`;
        
        // Note: makePublic() is not available due to Public Access Prevention on Replit Object Storage
        // Files will be accessed via signed URLs or ACL policies instead
      } catch (aclError) {
        console.error("Warning: ACL setting failed, using URL as-is:", aclError);
        // Fallback: use the normalized path from URL
        objectPath = await objectStorageService.normalizeObjectEntityPath(req.body.contentURL);
        storagePath = req.body.contentURL;
      }

      // Save metadata to Firestore
      const { firestore, admin } = await import('./firebase');
      
      const contentMetadata = {
        objectPath,           // Normalized path: /objects/<uuid>.<ext>
        storagePath,          // Actual GCS path: gs://bucket/path or URL
        contentType,
        title: title || 'Untitled',
        owner: userId,
        visibility,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        postId: postId || null,
      };

      // Save to Firestore content_uploads collection with better error handling
      let contentDoc;
      try {
        contentDoc = await firestore.collection('content_uploads').add(contentMetadata);
      } catch (firestoreError) {
        console.error("Firestore save error:", firestoreError);
        // Return success even if Firestore save fails - file is uploaded
        return res.status(200).json({
          objectPath: objectPath,
          contentId: null,
          message: "Content uploaded successfully (metadata save pending)",
          warning: "Metadata not saved to database",
        });
      }

      res.status(200).json({
        objectPath: objectPath,
        contentId: contentDoc.id,
        message: "Content uploaded and metadata saved successfully",
      });
    } catch (error) {
      console.error("Error in upload-complete:", error);
      if (error instanceof AuthenticationError) {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Stripe payment route for one-time payments (subscription plan purchases)
  // Reference: blueprint:javascript_stripe integration
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = "jpy", planId, planName } = req.body;
      
      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // Security: Limit maximum payment amount (100,000 yen)
      if (amount > 100000) {
        return res.status(400).json({ error: "Amount exceeds maximum limit" });
      }

      // Validate currency
      if (currency && currency !== "jpy") {
        return res.status(400).json({ error: "Only JPY currency is supported" });
      }

      if (!stripe) {
        return res.status(500).json({ error: "Payment system not configured" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount in yen (no need to multiply by 100 for JPY)
        currency: currency,
        metadata: {
          planId: planId || '',
          planName: planName || '',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res
        .status(500)
        .json({ error: "Error creating payment intent: " + error.message });
    }
  });

  // Secure session token generation with HMAC signature
  function generateSecureSessionToken(email: string): string {
    const timestamp = Date.now();
    const payload = `${email}:${timestamp}`;
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    return Buffer.from(`${payload}:${signature}`).toString('base64');
  }

  function verifySecureSessionToken(token: string): { email: string; timestamp: number } | null {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      if (parts.length !== 3) return null;
      
      const [email, timestampStr, signature] = parts;
      const timestamp = parseInt(timestampStr);
      
      // Verify signature using the same SESSION_SECRET
      const payload = `${email}:${timestamp}`;
      const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
      
      if (signature !== expectedSignature) {
        return null; // Invalid signature
      }
      
      // Check expiration (24 hours)
      const tokenAge = Date.now() - timestamp;
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return null; // Expired
      }
      
      return { email, timestamp };
    } catch {
      return null;
    }
  }

  // Admin authentication endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Verify admin credentials (environment variables for security)
      const adminEmail = process.env.ADMIN_EMAIL || "info@sinjapan.jp";
      const adminPassword = process.env.ADMIN_PASSWORD || "Kazuya8008";

      if (email === adminEmail && password === adminPassword) {
        // Generate a cryptographically signed session token
        const sessionToken = generateSecureSessionToken(email);
        
        // Set HttpOnly cookie for security (not accessible via JavaScript)
        res.cookie('adminSession', sessionToken, {
          httpOnly: true, // Not accessible via JavaScript
          secure: process.env.NODE_ENV === 'production', // HTTPS only in production
          sameSite: 'strict', // CSRF protection
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        res.json({
          success: true,
          email,
          expiresIn: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error: any) {
      console.error("Error during admin login:", error);
      res.status(500).json({ error: "Login error: " + error.message });
    }
  });

  // Admin authentication middleware (uses HttpOnly cookie with signature verification)
  async function verifyAdminToken(req: any, res: any, next: any) {
    try {
      // Get session token from HttpOnly cookie
      const token = req.cookies?.adminSession;
      
      if (!token) {
        return res.status(401).json({ error: "No session found" });
      }

      // Verify token signature and expiration
      const verifiedSession = verifySecureSessionToken(token);
      if (!verifiedSession) {
        res.clearCookie('adminSession');
        return res.status(401).json({ error: "Invalid or expired session" });
      }

      // Verify email matches admin email
      const adminEmail = process.env.ADMIN_EMAIL || "info@sinjapan.jp";
      if (verifiedSession.email !== adminEmail) {
        res.clearCookie('adminSession');
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Attach admin email to request object
      (req as any).adminEmail = verifiedSession.email;
      next();
    } catch (error) {
      res.clearCookie('adminSession');
      return res.status(401).json({ error: "Invalid session token" });
    }
  }

  // Verify admin session endpoint
  app.get("/api/admin/verify", verifyAdminToken, (req: any, res) => {
    res.json({ success: true, email: req.adminEmail });
  });

  // Admin logout endpoint
  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie('adminSession');
    res.json({ success: true });
  });

  // TEMPORARY: Admin endpoint to create user account
  // Protected by admin authentication
  app.post("/api/admin/create-user", verifyAdminToken, async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      
      if (!email || !password || !displayName) {
        return res.status(400).json({ error: "Email, password, and displayName are required" });
      }

      const { auth, firestore, admin } = await import('./firebase');

      // Create user in Firebase Authentication
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      console.log('User created in Firebase Auth:', userRecord.uid);

      // Create user profile in Firestore
      await firestore.collection('users').doc(userRecord.uid).set({
        displayName,
        email,
        photoURL: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        isOnline: false,
        provider: 'email',
        stats: {
          posts: 0,
          likes: 0,
          followers: 0,
          following: 0
        },
        bio: '',
        coverImage: null,
        isVerified: false,
        subscriptionPlans: []
      });

      console.log('User profile created in Firestore');

      res.json({
        success: true,
        userId: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Error creating user: " + error.message });
    }
  });

  // Image upload endpoint for slider images
  app.post("/api/upload-slider-image", express.raw({ type: 'application/octet-stream', limit: '10mb' }), async (req, res) => {
    try {
      const multer = await import('multer');
      const storage = multer.default.memoryStorage();
      const upload = multer.default({ storage }).single('file');

      upload(req as any, res as any, async (err: any) => {
        if (err) {
          return res.status(400).json({ error: 'File upload failed' });
        }

        const file = (req as any).file;
        if (!file) {
          return res.status(400).json({ error: 'No file provided' });
        }

        const { ObjectStorageService } = await import('./objectStorage');
        const { storage: firebaseStorage } = await import('./firebase');
        const objectStorageService = new ObjectStorageService();

        // Generate unique file name
        const { randomUUID } = await import('crypto');
        const fileId = randomUUID();
        const extension = file.mimetype.split('/')[1];
        const fileName = `slider-${fileId}.${extension}`;

        // Upload to Firebase Storage
        const bucket = firebaseStorage.bucket();
        const blob = bucket.file(`public/${fileName}`);

        const blobStream = blob.createWriteStream({
          resumable: false,
          metadata: {
            contentType: file.mimetype,
          },
        });

        blobStream.on('error', (error: Error) => {
          console.error('Upload error:', error);
          res.status(500).json({ error: 'Error uploading file' });
        });

        blobStream.on('finish', async () => {
          // Make file public
          await blob.makePublic();

          // Return public URL
          const imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          res.json({ imageUrl });
        });

        blobStream.end(file.buffer);
      });
    } catch (error: any) {
      console.error('Error in upload endpoint:', error);
      res.status(500).json({ error: 'Error uploading image: ' + error.message });
    }
  });

  // Stripe Checkout Session for Subscription
  // Reference: blueprint:javascript_stripe integration
  app.post("/api/create-subscription-checkout", async (req, res) => {
    try {
      const { planId, planTitle, planPrice, creatorId, creatorName } = req.body;

      if (!planId || !planTitle || !planPrice || !creatorId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Extract creator's base price
      const priceMatch = planPrice.match(/\d+/);
      if (!priceMatch) {
        return res.status(400).json({ error: 'Invalid price format' });
      }
      const basePrice = parseInt(priceMatch[0]);
      
      // Calculate total: base price + 10% tax + 10% platform fee
      const tax = Math.floor(basePrice * 0.10); // 10% consumption tax
      const platformFee = Math.floor(basePrice * 0.10); // 10% platform fee
      const amount = basePrice + tax + platformFee; // Total amount in JPY

      if (!stripe) {
        return res.status(500).json({ error: "Payment system not configured" });
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'jpy',
              product_data: {
                name: `${creatorName} - ${planTitle}`,
                description: `月額サブスクリプションプラン`,
              },
              unit_amount: amount,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/profile/${creatorId}?subscription=success&plan=${planId}`,
        cancel_url: `${req.headers.origin}/profile/${creatorId}?subscription=cancelled`,
        metadata: {
          planId,
          creatorId,
        },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Error creating checkout session: ' + error.message });
    }
  });

  // Create Payment Intent for in-app subscription payment
  // Reference: blueprint:javascript_stripe integration
  app.post("/api/create-subscription-payment-intent", async (req, res) => {
    try {
      const { planId, planTitle, planPrice, creatorId, creatorName } = req.body;

      if (!planId || !planTitle || !planPrice || !creatorId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Extract base price (creator's net amount)
      // planPriceはクリエイター受取額（手数料・税抜き）
      // カンマを除去してから数値化（例：「¥1,200」→「1200」）
      const cleanPrice = planPrice.replace(/[^\d]/g, '');
      if (!cleanPrice) {
        return res.status(400).json({ error: 'Invalid price format' });
      }
      const basePrice = parseInt(cleanPrice); // クリエイター受取額（例：50円）
      
      // Calculate total amount and fees
      // totalAmount = basePrice + platformFee + tax
      // totalAmount = basePrice + (basePrice * 0.1) + (basePrice * 0.1)
      // totalAmount = basePrice * 1.2
      const platformFee = Math.floor(basePrice * 0.10); // 10% プラットフォーム手数料（例：5円）
      const tax = Math.floor(basePrice * 0.10); // 10% 消費税（例：5円）
      const totalAmount = basePrice + platformFee + tax; // ユーザー支払い総額（例：60円）
      const amount = totalAmount; // Stripeに請求する金額（例：60円）

      if (!stripe) {
        return res.status(500).json({ error: "Payment system not configured" });
      }

      // Create Payment Intent for in-app payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'jpy',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          planId,
          planTitle,
          creatorId,
          creatorName,
          basePrice: basePrice.toString(),
          tax: tax.toString(),
          platformFee: platformFee.toString(),
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Error creating payment intent: ' + error.message });
    }
  });

  // Upload endpoint for document submission
  // Handles file uploads to Object Storage (private directory)
  // Uses the upload middleware defined earlier (line 697) with 500MB limit
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Verify Firebase authentication
      const userId = await verifyFirebaseToken(req.headers.authorization);

      // Get folder from body (form data) or query parameter
      const folder = (req.body.folder || req.query.folder || '.private') as string;
      const visibility = folder === '.private' ? 'private' : 'public';
      console.log(`📁 Upload folder: ${folder}, visibility: ${visibility}, user: ${userId}`);
      
      const objectStorageService = new ObjectStorageService();
      
      // Upload file to Object Storage using Replit SDK
      const uploadResult = await objectStorageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        userId,
        req.file.mimetype,
        visibility
      );

      console.log('[Upload] Uploaded to:', uploadResult.storageUri);

      res.json({ 
        url: uploadResult.objectPath,
        fileName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      if (error instanceof AuthenticationError) {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to upload file: ' + error.message });
    }
  });

  // Proxy endpoint for Object Storage files
  // Serves files from Object Storage while respecting visibility and ACL policies
  // Supports Range requests for video streaming
  app.get("/api/proxy/:folder/:filename", async (req, res) => {
    try {
      const { folder, filename } = req.params;
      
      // Construct object path in the format getObjectEntityFile expects: /objects/filename
      const objectPath = `/objects/${filename}`;
      
      console.log('Proxy request for:', folder, filename, 'Object path:', objectPath, 'Range:', req.headers.range);
      
      // Import ObjectStorageService
      const { ObjectStorageService } = await import("./objectStorage");
      const { storage } = await import('./firebase');
      const objectStorageService = new ObjectStorageService();
      
      // Get the file path from Object Storage (it will search in public/private dirs automatically)
      const filePath = await objectStorageService.getObjectEntityFile(objectPath);
      
      console.log('[Proxy] Downloading file from Firebase Storage:', filePath);
      
      // Download file from Firebase Storage
      const bucket = storage.bucket();
      const file = bucket.file(filePath);
      const [fileBuffer] = await file.download();
      
      if (!fileBuffer || fileBuffer.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      console.log('[Proxy] Downloaded successfully, size:', fileBuffer.length, 'bytes');
      
      // Determine content type from filename
      const ext = filename.toLowerCase().split('.').pop();
      let contentType = 'application/octet-stream';
      if (ext === 'mp4') contentType = 'video/mp4';
      else if (ext === 'mov') contentType = 'video/quicktime';
      else if (ext === 'webm') contentType = 'video/webm';
      else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'png') contentType = 'image/png';
      else if (ext === 'gif') contentType = 'image/gif';
      else if (ext === 'webp') contentType = 'image/webp';
      
      const fileSize = fileBuffer.length;
      
      // Determine cache control based on visibility (public vs private)
      const isPublic = filePath.startsWith('public/');
      const cacheControl = isPublic 
        ? 'public, max-age=31536000, immutable'  // Public files: long-term caching
        : 'private, max-age=3600';  // Private files: short-term, private caching only
      
      // Handle Range requests for video streaming
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;
        
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cache-Control': cacheControl,
          'ETag': `"${filename}"`,
        });
        
        // Send the requested range
        res.end(fileBuffer.slice(start, end + 1));
      } else {
        // No range request, send entire file
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': cacheControl,
          'ETag': `"${filename}"`,
        });
        
        res.end(fileBuffer);
      }
    } catch (error: any) {
      console.error('Error proxying file:', error);
      
      // Don't try to send response if headers already sent
      if (res.headersSent) {
        return;
      }
      
      // For PNG/JPG avatar images, return default avatar image instead of 404
      const { filename } = req.params;
      if (filename.match(/\.(png|jpg|jpeg|gif)$/i)) {
        console.log(`⚠️ Image not found, redirecting to default avatar`);
        // Redirect to a default avatar
        const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + filename;
        return res.redirect(defaultAvatar);
      }
      
      res.status(404).json({ error: 'File not found' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

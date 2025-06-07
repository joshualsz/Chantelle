// src/services/firestoreService.js
import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit 
  } from 'firebase/firestore';
  import { db } from '../firebase/config';
  
  // Resume optimization functions
  export const resumeOptimizationService = {
    // Save a new resume optimization
    async saveOptimization(userId, optimizationData) {
      try {
        const docRef = await addDoc(collection(db, 'optimizations'), {
          userId,
          originalResume: optimizationData.originalResume,
          jobDescription: optimizationData.jobDescription,
          optimizedResume: optimizationData.optimizedResume,
          keywords: optimizationData.keywords || [],
          improvements: optimizationData.improvements || [],
          createdAt: new Date().toISOString(),
          jobTitle: optimizationData.jobTitle || 'Untitled Position'
        });
        
        // Update user's total optimizations count
        await this.updateUserStats(userId);
        
        return docRef.id;
      } catch (error) {
        console.error('Error saving optimization:', error);
        throw error;
      }
    },
  
    // Get all optimizations for a user
    async getUserOptimizations(userId) {
      try {
        const q = query(
          collection(db, 'optimizations'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error getting optimizations:', error);
        throw error;
      }
    },
  
    // Get a specific optimization
    async getOptimization(optimizationId) {
      try {
        const docRef = doc(db, 'optimizations', optimizationId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        } else {
          throw new Error('Optimization not found');
        }
      } catch (error) {
        console.error('Error getting optimization:', error);
        throw error;
      }
    },
  
    // Delete an optimization
    async deleteOptimization(optimizationId, userId) {
      try {
        await deleteDoc(doc(db, 'optimizations', optimizationId));
        await this.updateUserStats(userId);
      } catch (error) {
        console.error('Error deleting optimization:', error);
        throw error;
      }
    },
  
    // Update user statistics
    async updateUserStats(userId) {
      try {
        const userOptimizations = await this.getUserOptimizations(userId);
        const userRef = doc(db, 'users', userId);
        
        await updateDoc(userRef, {
          totalOptimizations: userOptimizations.length,
          lastOptimization: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating user stats:', error);
        throw error;
      }
    }
  };
  
  // User profile functions
  export const userService = {
    // Get user profile
    async getUserProfile(userId) {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          return userSnap.data();
        } else {
          throw new Error('User not found');
        }
      } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
      }
    },
  
    // Update user profile
    async updateUserProfile(userId, profileData) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          ...profileData,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
    }
  };
  
  // Analytics functions
  export const analyticsService = {
    // Track user activity
    async trackActivity(userId, activityType, data = {}) {
      try {
        await addDoc(collection(db, 'analytics'), {
          userId,
          activityType, // 'optimization_created', 'resume_downloaded', etc.
          data,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error tracking activity:', error);
        // Don't throw error for analytics to avoid disrupting user experience
      }
    },
  
    // Get user analytics
    async getUserAnalytics(userId, limitCount = 50) {
      try {
        const q = query(
          collection(db, 'analytics'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error getting user analytics:', error);
        throw error;
      }
    }
  };
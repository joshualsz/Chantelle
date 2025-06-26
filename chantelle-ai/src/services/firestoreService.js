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
        atsScore: optimizationData.atsScore || 0,
        suggestions: optimizationData.suggestions || [],
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

  // Update an existing optimization
  async updateOptimization(optimizationId, updateData) {
    try {
      const docRef = doc(db, 'optimizations', optimizationId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating optimization:', error);
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

  // Get optimizations by job title
  async getOptimizationsByJobTitle(userId, jobTitle) {
    try {
      const q = query(
        collection(db, 'optimizations'),
        where('userId', '==', userId),
        where('jobTitle', '==', jobTitle),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting optimizations by job title:', error);
      throw error;
    }
  },

  // Get recent optimizations across all users (for admin/analytics)
  async getRecentOptimizations(limitCount = 20) {
    try {
      const q = query(
        collection(db, 'optimizations'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting recent optimizations:', error);
      throw error;
    }
  },

  // Update user statistics
  async updateUserStats(userId) {
    try {
      const userOptimizations = await this.getUserOptimizations(userId);
      const userRef = doc(db, 'users', userId);
      
      // Calculate average ATS score
      const totalScore = userOptimizations.reduce((sum, opt) => {
        return sum + (parseInt(opt.atsScore) || 0);
      }, 0);
      const averageAtsScore = userOptimizations.length > 0 
        ? Math.round(totalScore / userOptimizations.length) 
        : 0;
      
      // Find highest ATS score
      const highestAtsScore = userOptimizations.reduce((max, opt) => {
        const score = parseInt(opt.atsScore) || 0;
        return score > max ? score : max;
      }, 0);
      
      await updateDoc(userRef, {
        totalOptimizations: userOptimizations.length,
        averageAtsScore: averageAtsScore,
        highestAtsScore: highestAtsScore,
        lastOptimization: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
      // Don't throw error to prevent optimization save failure
    }
  },

  // Get user optimization statistics
  async getUserStats(userId) {
    try {
      const userOptimizations = await this.getUserOptimizations(userId);
      
      if (userOptimizations.length === 0) {
        return {
          totalOptimizations: 0,
          averageAtsScore: 0,
          highestAtsScore: 0,
          mostRecentOptimization: null,
          totalKeywordsAdded: 0
        };
      }
      
      const totalScore = userOptimizations.reduce((sum, opt) => {
        return sum + (parseInt(opt.atsScore) || 0);
      }, 0);
      
      const averageAtsScore = Math.round(totalScore / userOptimizations.length);
      
      const highestAtsScore = userOptimizations.reduce((max, opt) => {
        const score = parseInt(opt.atsScore) || 0;
        return score > max ? score : max;
      }, 0);
      
      const totalKeywordsAdded = userOptimizations.reduce((sum, opt) => {
        return sum + (opt.keywords?.length || 0);
      }, 0);
      
      return {
        totalOptimizations: userOptimizations.length,
        averageAtsScore,
        highestAtsScore,
        mostRecentOptimization: userOptimizations[0],
        totalKeywordsAdded
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
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
  },

  // Create or update user preferences
  async updateUserPreferences(userId, preferences) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        preferences: {
          ...preferences,
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  },

  // Get all users (admin function)
  async getAllUsers(limitCount = 50) {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
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
        activityType, // 'optimization_started', 'optimization_completed', 'resume_downloaded', 'user_login', etc.
        data,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0] // For daily aggregations
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
  },

  // Get analytics by activity type
  async getAnalyticsByType(activityType, limitCount = 100) {
    try {
      const q = query(
        collection(db, 'analytics'),
        where('activityType', '==', activityType),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting analytics by type:', error);
      throw error;
    }
  },

  // Get daily analytics summary
  async getDailyAnalytics(date = new Date().toISOString().split('T')[0]) {
    try {
      const q = query(
        collection(db, 'analytics'),
        where('date', '==', date),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => doc.data());
      
      // Aggregate by activity type
      const summary = activities.reduce((acc, activity) => {
        if (!acc[activity.activityType]) {
          acc[activity.activityType] = 0;
        }
        acc[activity.activityType]++;
        return acc;
      }, {});
      
      return {
        date,
        totalActivities: activities.length,
        uniqueUsers: new Set(activities.map(a => a.userId)).size,
        activityBreakdown: summary
      };
    } catch (error) {
      console.error('Error getting daily analytics:', error);
      throw error;
    }
  }
};

// Cover letter functions (for future expansion)
export const coverLetterService = {
  // Save a generated cover letter
  async saveCoverLetter(userId, coverLetterData) {
    try {
      const docRef = await addDoc(collection(db, 'coverLetters'), {
        userId,
        content: coverLetterData.content,
        jobTitle: coverLetterData.jobTitle,
        companyName: coverLetterData.companyName,
        jobDescription: coverLetterData.jobDescription,
        resumeId: coverLetterData.resumeId, // Link to optimization if available
        createdAt: new Date().toISOString()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving cover letter:', error);
      throw error;
    }
  },

  // Get user's cover letters
  async getUserCoverLetters(userId) {
    try {
      const q = query(
        collection(db, 'coverLetters'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting cover letters:', error);
      throw error;
    }
  },

  // Delete a cover letter
  async deleteCoverLetter(coverLetterId) {
    try {
      await deleteDoc(doc(db, 'coverLetters', coverLetterId));
    } catch (error) {
      console.error('Error deleting cover letter:', error);
      throw error;
    }
  }
};

// Feedback and support functions
export const feedbackService = {
  // Submit user feedback
  async submitFeedback(userId, feedbackData) {
    try {
      const docRef = await addDoc(collection(db, 'feedback'), {
        userId,
        type: feedbackData.type, // 'bug', 'feature', 'general'
        message: feedbackData.message,
        rating: feedbackData.rating,
        email: feedbackData.email,
        status: 'new',
        createdAt: new Date().toISOString()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  // Get user's feedback history
  async getUserFeedback(userId) {
    try {
      const q = query(
        collection(db, 'feedback'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user feedback:', error);
      throw error;
    }
  }
};
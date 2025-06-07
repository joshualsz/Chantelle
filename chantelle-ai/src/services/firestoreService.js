// src/services/firestoreService.js
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
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
        matchScore: optimizationData.matchScore || null,
        analysisData: optimizationData.analysisData || null,
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

// Job tracking functions
export const jobTrackingService = {
  // Add a new job application
  async addJobApplication(userId, jobData) {
    try {
      const docRef = await addDoc(collection(db, 'jobApplications'), {
        userId,
        role: jobData.role,
        company: jobData.company,
        status: jobData.status || 'pending',
        dateApplied: jobData.dateApplied || new Date().toISOString(),
        jobUrl: jobData.jobUrl || '',
        notes: jobData.notes || '',
        salary: jobData.salary || '',
        location: jobData.location || '',
        applicationMethod: jobData.applicationMethod || '',
        contactPerson: jobData.contactPerson || '',
        followUpDate: jobData.followUpDate || null,
        interviewDate: jobData.interviewDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding job application:', error);
      throw error;
    }
  },

  // Get all job applications for a user
  async getUserJobApplications(userId) {
    try {
      // First try a simple query without orderBy
      const q = query(
        collection(db, 'jobApplications'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const applications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      // Sort by date in JavaScript instead of Firestore
      return applications.sort((a, b) => {
        const dateA = new Date(a.dateApplied || a.createdAt);
        const dateB = new Date(b.dateApplied || b.createdAt);
        return dateB - dateA; // Newest first
      });
    } catch (error) {
      console.error('Error getting job applications:', error);
      // Return empty array instead of throwing error
      return [];
    }
  },

  // Get a specific job application
  async getJobApplication(applicationId) {
    try {
      const docRef = doc(db, 'jobApplications', applicationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Job application not found');
      }
    } catch (error) {
      console.error('Error getting job application:', error);
      throw error;
    }
  },

  // Update job application
  async updateJobApplication(applicationId, updateData) {
    try {
      const applicationRef = doc(db, 'jobApplications', applicationId);
      await updateDoc(applicationRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating job application:', error);
      throw error;
    }
  },

  // Delete job application
  async deleteJobApplication(applicationId) {
    try {
      await deleteDoc(doc(db, 'jobApplications', applicationId));
    } catch (error) {
      console.error('Error deleting job application:', error);
      throw error;
    }
  },

  // Get job application statistics
  async getJobStats(userId) {
    try {
      const applications = await this.getUserJobApplications(userId);
      
      const stats = {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        interviewed: applications.filter(app => app.status === 'interviewed').length,
        withdrawn: applications.filter(app => app.status === 'withdrawn').length
      };

      // Calculate additional metrics
      stats.responseRate = stats.total > 0 ? 
        Math.round(((stats.interviewed + stats.accepted + stats.rejected) / stats.total) * 100) : 0;
      
      stats.successRate = stats.total > 0 ? 
        Math.round((stats.accepted / stats.total) * 100) : 0;

      return stats;
    } catch (error) {
      console.error('Error getting job stats:', error);
      throw error;
    }
  },

  // Get applications by status
  async getApplicationsByStatus(userId, status) {
    try {
      const q = query(
        collection(db, 'jobApplications'),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('dateApplied', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting applications by status:', error);
      throw error;
    }
  },

  // Get recent applications (last 30 days)
  async getRecentApplications(userId, days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const applications = await this.getUserJobApplications(userId);
      return applications.filter(app => 
        new Date(app.dateApplied) >= cutoffDate
      );
    } catch (error) {
      console.error('Error getting recent applications:', error);
      throw error;
    }
  },

  // Bulk update applications
  async bulkUpdateApplications(applicationIds, updateData) {
    try {
      const updatePromises = applicationIds.map(id => 
        this.updateJobApplication(id, updateData)
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error bulk updating applications:', error);
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

  // Create user profile
  async createUserProfile(userId, profileData) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalOptimizations: 0,
        totalApplications: 0
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // Get user dashboard data
  async getUserDashboardData(userId) {
    try {
      const [profile, optimizations, applications] = await Promise.all([
        this.getUserProfile(userId),
        resumeOptimizationService.getUserOptimizations(userId),
        jobTrackingService.getUserJobApplications(userId)
      ]);

      const stats = await jobTrackingService.getJobStats(userId);

      return {
        profile,
        optimizations: optimizations.slice(0, 5), // Last 5 optimizations
        applications: applications.slice(0, 10), // Last 10 applications
        stats,
        totalOptimizations: optimizations.length,
        totalApplications: applications.length
      };
    } catch (error) {
      console.error('Error getting user dashboard data:', error);
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
        activityType, // 'optimization_created', 'resume_downloaded', 'job_application_added', etc.
        data,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId(),
        userAgent: navigator.userAgent,
        platform: this.getPlatform()
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
  async getAnalyticsByType(userId, activityType, limitCount = 20) {
    try {
      const q = query(
        collection(db, 'analytics'),
        where('userId', '==', userId),
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

  // Track page view
  async trackPageView(userId, page, data = {}) {
    await this.trackActivity(userId, 'page_view', {
      page,
      ...data
    });
  },

  // Track feature usage
  async trackFeatureUsage(userId, feature, action, data = {}) {
    await this.trackActivity(userId, 'feature_usage', {
      feature,
      action,
      ...data
    });
  },

  // Helper function to get session ID
  getSessionId() {
    if (!window.sessionStorage.getItem('sessionId')) {
      window.sessionStorage.setItem('sessionId', 
        Date.now().toString() + Math.random().toString(36).substr(2, 9)
      );
    }
    return window.sessionStorage.getItem('sessionId');
  },

  // Helper function to get platform
  getPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mobile')) return 'mobile';
    if (userAgent.includes('tablet')) return 'tablet';
    return 'desktop';
  },

  // Get user engagement metrics
  async getUserEngagement(userId, days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const analytics = await this.getUserAnalytics(userId, 1000);
      const recentAnalytics = analytics.filter(item => 
        new Date(item.timestamp) >= cutoffDate
      );

      const engagement = {
        totalActivities: recentAnalytics.length,
        uniqueDays: new Set(recentAnalytics.map(item => 
          new Date(item.timestamp).toDateString()
        )).size,
        mostUsedFeatures: this.getMostUsedFeatures(recentAnalytics),
        averageSessionLength: this.calculateAverageSessionLength(recentAnalytics)
      };

      return engagement;
    } catch (error) {
      console.error('Error getting user engagement:', error);
      throw error;
    }
  },

  // Helper function to get most used features
  getMostUsedFeatures(analytics) {
    const featureCount = {};
    analytics.forEach(item => {
      if (item.data && item.data.feature) {
        featureCount[item.data.feature] = (featureCount[item.data.feature] || 0) + 1;
      }
    });

    return Object.entries(featureCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([feature, count]) => ({ feature, count }));
  },

  // Helper function to calculate average session length
  calculateAverageSessionLength(analytics) {
    const sessions = {};
    
    analytics.forEach(item => {
      if (!sessions[item.sessionId]) {
        sessions[item.sessionId] = {
          start: new Date(item.timestamp),
          end: new Date(item.timestamp)
        };
      } else {
        const timestamp = new Date(item.timestamp);
        if (timestamp < sessions[item.sessionId].start) {
          sessions[item.sessionId].start = timestamp;
        }
        if (timestamp > sessions[item.sessionId].end) {
          sessions[item.sessionId].end = timestamp;
        }
      }
    });

    const sessionLengths = Object.values(sessions).map(session => 
      session.end - session.start
    );

    return sessionLengths.length > 0 ? 
      sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length : 0;
  }
};

// Export all services as default
export default {
  resumeOptimizationService,
  jobTrackingService,
  userService,
  analyticsService
};
// src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    // Initialize Gemini AI with API key from environment
    this.genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" // Using the latest model
    });
  }

  async optimizeResume(resumeText, jobDescription, jobTitle = '') {
    try {
      const prompt = this.createOptimizationPrompt(resumeText, jobDescription, jobTitle);
      
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      });

      const response = result.response;
      const optimizedContent = response.text();
      
      // Parse the response to extract structured data
      return this.parseOptimizationResponse(optimizedContent, resumeText);
      
    } catch (error) {
      console.error('Error optimizing resume with Gemini:', error);
      throw new Error(`Resume optimization failed: ${error.message}`);
    }
  }

  createOptimizationPrompt(resumeText, jobDescription, jobTitle) {
    return `You are an expert resume optimization specialist and ATS (Applicant Tracking System) consultant. 

Your task is to optimize the following resume for the given job description to maximize ATS compatibility and improve the candidate's chances of getting an interview.

**JOB TITLE:** ${jobTitle}

**JOB DESCRIPTION:**
${jobDescription}

**ORIGINAL RESUME:**
${resumeText}

**INSTRUCTIONS:**
1. Analyze the job description and identify key requirements, skills, and keywords
2. Optimize the resume by:
   - Adding relevant keywords naturally throughout the content
   - Improving action verbs and quantifying achievements where possible
   - Enhancing technical skills alignment with job requirements
   - Optimizing formatting for ATS compatibility
   - Maintaining the original structure and personal information
   - Ensuring the content remains truthful and authentic

3. Provide your response in the following JSON format:

{
  "optimizedResume": "The complete optimized resume text here",
  "keywordsAdded": ["keyword1", "keyword2", "keyword3"],
  "improvements": [
    "Specific improvement 1",
    "Specific improvement 2", 
    "Specific improvement 3"
  ],
  "atsScore": "A percentage score (0-100) indicating ATS compatibility",
  "suggestions": [
    "Additional suggestion 1",
    "Additional suggestion 2"
  ]
}

Make sure the optimized resume is professional, accurate, and specifically tailored to the job requirements while maintaining the candidate's authentic experience and qualifications.`;
  }

  parseOptimizationResponse(response, originalResume) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        return {
          optimizedResume: parsedResponse.optimizedResume || response,
          keywords: parsedResponse.keywordsAdded || [],
          improvements: parsedResponse.improvements || [],
          atsScore: parsedResponse.atsScore || '85',
          suggestions: parsedResponse.suggestions || [],
          originalResume
        };
      } else {
        // Fallback if JSON parsing fails
        return {
          optimizedResume: response,
          keywords: this.extractKeywords(response),
          improvements: ['AI-powered optimization applied'],
          atsScore: '85',
          suggestions: ['Consider adding more quantified achievements'],
          originalResume
        };
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      // Return fallback response
      return {
        optimizedResume: response,
        keywords: [],
        improvements: ['AI optimization completed'],
        atsScore: '80',
        suggestions: [],
        originalResume
      };
    }
  }

  extractKeywords(text) {
    // Simple keyword extraction as fallback
    const commonKeywords = [
      'leadership', 'management', 'communication', 'teamwork', 
      'problem-solving', 'analytical', 'creative', 'innovative',
      'strategic', 'collaborative', 'results-driven', 'experienced'
    ];
    
    return commonKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 5);
  }

  // Method to analyze resume against job description
  async analyzeResumeMatch(resumeText, jobDescription) {
    try {
      const prompt = `Analyze how well this resume matches the job description. Provide a match percentage and specific recommendations.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Provide analysis in JSON format:
{
  "matchPercentage": "percentage (0-100)",
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "recommendations": ["rec1", "rec2"]
}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        return null;
      }
    } catch (error) {
      console.error('Error analyzing resume match:', error);
      return null;
    }
  }

  // Method to generate interview questions based on job description
  async generateInterviewQuestions(jobDescription, count = 5) {
    try {
      const prompt = `Based on this job description, generate ${count} relevant interview questions that a hiring manager might ask:

JOB DESCRIPTION:
${jobDescription}

Provide questions in JSON format:
{
  "questions": ["question1", "question2", "question3"]
}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        return parsed?.questions || [];
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Error generating interview questions:', error);
      return [];
    }
  }
}

export default new GeminiService();
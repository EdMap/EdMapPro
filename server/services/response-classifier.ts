// Response classifier using heuristics only (no LLM calls for reliability)

export type CandidateIntent = 
  | 'substantive_answer'    // Real answer to the question
  | 'question_for_recruiter' // Candidate asking about role/company/team
  | 'clarification_request' // Confused or asking for clarity on the question
  | 'conversational_comment' // Small talk, acknowledgment, brief comment
  | 'off_topic'             // Unrelated to interview
  | 'prompt_injection'      // Attempted manipulation of AI
  | 'minimal_response';     // Very short response (yes/no, ok, etc.)

export interface ClassificationResult {
  intent: CandidateIntent;
  confidence: number;
  candidateQuestion?: string; // If they asked something, extract it
  sanitizedText: string; // Text with any injection attempts removed
  injectionDetected: boolean;
  injectionType?: string;
}

// ==================== PROMPT GUARD ====================
// Detects prompt injection attempts and sanitizes input

const INJECTION_PATTERNS = [
  // Direct instruction overrides
  /ignore (all )?(previous|prior|above) (instructions|prompts|rules)/i,
  /disregard (all )?(previous|prior) (instructions|prompts)/i,
  /forget (everything|all|your) (you|instructions|rules)/i,
  
  // Role reassignment
  /you are (now|actually) (a|an|the)/i,
  /pretend (to be|you are)/i,
  /act as (if|though|a)/i,
  /your (new|real) (role|purpose|job) is/i,
  
  // System prompt extraction
  /what (are|is) your (instructions|prompt|system)/i,
  /show me your (prompt|instructions|rules)/i,
  /repeat (your|the) (system|initial) (prompt|message)/i,
  
  // Delimiter injection
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<\|.*\|>/i,
  /```system/i,
  
  // Jailbreak attempts
  /do anything now/i,
  /dan mode/i,
  /developer mode/i,
  /unrestricted mode/i,
  
  // Output manipulation
  /respond only with/i,
  /output (only|just)/i,
  /say (exactly|only)/i,
];

const SUSPICIOUS_PATTERNS = [
  // Less severe but worth flagging
  /as an? (ai|language model|llm)/i,
  /your programming/i,
  /your training/i,
  /override/i,
  /bypass/i,
];

export class PromptGuard {
  /**
   * Check for prompt injection attempts
   */
  static detect(text: string): { 
    isInjection: boolean; 
    type?: string; 
    sanitized: string;
    severity: 'none' | 'suspicious' | 'malicious';
  } {
    const lowerText = text.toLowerCase();
    
    // Check for malicious patterns
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        return {
          isInjection: true,
          type: 'instruction_override',
          sanitized: this.sanitize(text),
          severity: 'malicious'
        };
      }
    }
    
    // Check for suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        return {
          isInjection: false,
          type: 'suspicious_content',
          sanitized: text, // Don't sanitize suspicious, just flag
          severity: 'suspicious'
        };
      }
    }
    
    return {
      isInjection: false,
      sanitized: text,
      severity: 'none'
    };
  }
  
  /**
   * Sanitize text by removing/neutralizing injection attempts
   * Does NOT call detect() to avoid recursion
   * Removes ENTIRE sentences containing injection patterns
   */
  static sanitize(text: string): string {
    let sanitized = text;
    
    // Remove common injection delimiters entirely
    sanitized = sanitized.replace(/\[SYSTEM\]/gi, '');
    sanitized = sanitized.replace(/\[INST\]/gi, '');
    sanitized = sanitized.replace(/<\|.*?\|>/g, '');
    sanitized = sanitized.replace(/```system[\s\S]*?```/g, '');
    sanitized = sanitized.replace(/```[\s\S]*?```/g, ''); // Remove all code blocks
    
    // Split into sentences and filter out suspicious ones
    const sentences = sanitized.split(/(?<=[.!?])\s+/);
    const cleanSentences = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      
      // Remove sentences with instruction-override patterns
      if (/ignore (all )?(previous|prior|above)/i.test(sentence)) return false;
      if (/disregard (all )?(previous|prior)/i.test(sentence)) return false;
      if (/forget (everything|all|your)/i.test(sentence)) return false;
      if (/you are (now|actually) (a|an|the)/i.test(sentence)) return false;
      if (/pretend (to be|you are)/i.test(sentence)) return false;
      if (/your (new|real) (role|purpose|job) is/i.test(sentence)) return false;
      if (/respond only with/i.test(sentence)) return false;
      if (/output (only|just)/i.test(sentence)) return false;
      if (/do anything now/i.test(sentence)) return false;
      if (/dan mode|developer mode|unrestricted mode/i.test(sentence)) return false;
      if (/as an? (ai|language model|llm)/i.test(sentence)) return false;
      if (/your programming|your training/i.test(sentence)) return false;
      
      return true;
    });
    
    // Rejoin clean sentences
    sanitized = cleanSentences.join(' ').trim();
    
    // If nothing left after sanitization, return a placeholder
    if (!sanitized || sanitized.length < 3) {
      return "[Response removed for security]";
    }
    
    return sanitized;
  }
}

// ==================== RESPONSE CLASSIFIER ====================
// Classifies candidate responses using heuristics for reliability and speed

export class ResponseClassifier {
  // No LLM needed - using heuristics only for reliability and speed
  
  /**
   * Extract any question directed at the recruiter from the message
   * Scans sentence-by-sentence to find questions even in mixed messages
   * Returns the question if found, null otherwise
   */
  private extractRecruiterQuestion(text: string): string | null {
    // Split into sentences (handling ?, !, and .)
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      const lower = trimmed.toLowerCase();
      
      // Check if this sentence is a question directed at the recruiter
      if (!trimmed.endsWith('?')) continue;
      
      // Question word patterns that indicate recruiter-directed questions
      const recruiterQuestionPatterns = [
        /^(what|how|why|when|where|who)/i,
        /^(can you|could you|would you|will you)/i,
        /^(is there|are there|do you|does)/i,
        /^(what's|how's|who's)/i,
        /(the team|the role|the company|the position|the job|onboarding|timeline|next step|salary|benefits|remote|office)/i,
      ];
      
      for (const pattern of recruiterQuestionPatterns) {
        if (pattern.test(lower)) {
          return trimmed;
        }
      }
    }
    
    return null;
  }

  /**
   * Quick heuristic classification for obvious cases
   * Scans sentence-by-sentence to detect questions anywhere in the message
   */
  private quickClassify(text: string, lastQuestion: string): CandidateIntent | null {
    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();
    
    // Count words
    const wordCount = trimmed.split(/\s+/).length;
    
    // === MINIMAL RESPONSES (1-3 words, common acknowledgments) ===
    if (wordCount <= 3 && /^(yes|no|ok|okay|sure|yep|nope|yeah|nah|fine|good|great|thanks|right|correct|exactly)\.?$/i.test(lower)) {
      return 'minimal_response';
    }
    
    // === CONVERSATIONAL COMMENTS (short acknowledgments) ===
    if (wordCount < 6 && /^(that's (interesting|cool|great|nice)|sounds good|i see|makes sense|got it|understood|that works)\.?$/i.test(lower)) {
      return 'conversational_comment';
    }
    
    // === CLARIFICATION REQUESTS (confusion phrases) ===
    if (/^(i('m| am) (not sure|confused)|what do you mean|could you (explain|clarify|rephrase)|i don't (understand|follow))/i.test(lower)) {
      return 'clarification_request';
    }
    
    // === CHECK FOR RECRUITER-DIRECTED QUESTIONS ===
    // Scan sentence-by-sentence to find questions even in mixed messages
    const recruiterQuestion = this.extractRecruiterQuestion(text);
    if (recruiterQuestion) {
      // If the message is MOSTLY a question (>50% of content), treat as question
      // Otherwise treat as answer (the question will be noted but we continue evaluation)
      if (recruiterQuestion.length > trimmed.length * 0.5) {
        return 'question_for_recruiter';
      }
      // Mixed content - treat as answer but we extracted the question for candidateQuestion field
    }
    
    // === EVERYTHING ELSE IS A SUBSTANTIVE ANSWER ===
    return 'substantive_answer';
  }
  
  /**
   * Classify a candidate's response using ONLY heuristics (no LLM call)
   * This is fast, reliable, and doesn't break on API failures
   * Falls back to substantive_answer for anything ambiguous
   */
  classify(
    candidateResponse: string, 
    lastQuestion: string,
    jobTitle: string = "the position"
  ): ClassificationResult {
    // Always sanitize the text first
    const sanitizedText = PromptGuard.sanitize(candidateResponse);
    
    // Check for prompt injection
    const guardResult = PromptGuard.detect(candidateResponse);
    
    if (guardResult.isInjection) {
      console.warn('Prompt injection detected:', guardResult.type);
      return {
        intent: 'prompt_injection',
        confidence: 1.0,
        sanitizedText: sanitizedText,
        injectionDetected: true,
        injectionType: guardResult.type
      };
    }
    
    // Extract any recruiter-directed question (even in mixed content)
    const recruiterQuestion = this.extractRecruiterQuestion(candidateResponse);
    
    // Use heuristic classification
    const intent = this.quickClassify(candidateResponse, lastQuestion) || 'substantive_answer';
    
    return {
      intent: intent,
      confidence: 0.9,
      sanitizedText: sanitizedText,
      injectionDetected: false,
      // Include the extracted question even if we classify as substantive_answer
      // This allows the response handler to answer it while still proceeding with evaluation
      candidateQuestion: recruiterQuestion || undefined
    };
  }
}

export const responseClassifier = new ResponseClassifier();

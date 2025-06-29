import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, Mic, MicOff, HelpCircle, Lightbulb, Bus, User, X } from "lucide-react";

interface Message {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
  score?: number;
  feedback?: string;
}

interface InterviewSessionProps {
  session: any;
  onComplete: () => void;
}

export default function InterviewSession({ session, onComplete }: InterviewSessionProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(session.configuration.duration * 60);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [networkRetries, setNetworkRetries] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isListening, setIsListening] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const generateQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/interview/question", data);
      return response.json();
    },
    onSuccess: (question) => {
      setCurrentQuestion(question);
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'interviewer',
        content: question.question,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    }
  });

  const evaluateAnswerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/interview/evaluate", data);
      return response.json();
    },
    onSuccess: (evaluation) => {
      // Update the last user message with score and feedback
      setMessages(prev => {
        const updated = [...prev];
        const lastUserMessageIndex = updated.map(m => m.role).lastIndexOf('candidate');
        if (lastUserMessageIndex !== -1) {
          updated[lastUserMessageIndex] = {
            ...updated[lastUserMessageIndex],
            score: evaluation.score,
            feedback: evaluation.feedback
          };
        }
        return updated;
      });

      // Generate follow-up question if provided
      if (evaluation.followUp) {
        setTimeout(() => {
          const followUpMessage: Message = {
            id: Date.now().toString(),
            role: 'interviewer',
            content: evaluation.followUp,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 1000);
      }
    }
  });

  const generateFeedbackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/sessions/${session.id}/feedback`);
      return response.json();
    },
    onSuccess: (feedback) => {
      toast({
        title: "Interview Complete!",
        description: `Your final score: ${feedback.score}/100`,
      });
      onComplete();
    }
  });

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleEndInterview();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Generate initial question
  useEffect(() => {
    if (messages.length === 0) {
      generateQuestionMutation.mutate({
        profession: session.configuration.profession,
        interviewType: session.configuration.interviewType,
        difficulty: session.configuration.difficulty,
        jobPosting: session.configuration.jobPosting,
        previousQuestions: []
      });
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const initializeSpeechRecognition = async () => {
      // Check if browser supports speech recognition
      const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      
      if (!hasSpeechRecognition) {
        console.log('Speech recognition not supported');
        return;
      }

      try {
        // Request microphone permission first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true; // Enable interim results for better UX
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setCurrentResponse(prev => {
              const newText = prev ? prev + ' ' + finalTranscript : finalTranscript;
              return newText;
            });
            toast({
              title: "Speech Recognized",
              description: "Voice input added to your response.",
            });
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          
          if (event.error === 'network') {
            setNetworkRetries(prev => prev + 1);
            console.log('Network error, will retry automatically');
            
            // After 3 network failures, disable speech recognition
            if (networkRetries >= 2) {
              setSpeechSupported(false);
              toast({
                title: "Voice Input Temporarily Unavailable",
                description: "Unable to connect to speech recognition service. Please continue with typing - your responses work just as well!",
                variant: "destructive"
              });
            }
            return;
          }
          
          let errorMessage = "Speech recognition failed. Please try typing instead.";
          let title = "Voice Input Failed";
          
          switch (event.error) {
            case 'not-allowed':
              title = "Microphone Access Denied";
              errorMessage = "Please allow microphone access in your browser settings and refresh the page.";
              break;
            case 'no-speech':
              // Don't show error for no speech, it's normal
              return;
            case 'audio-capture':
              title = "Audio Capture Failed";
              errorMessage = "Unable to capture audio. Please check your microphone and try again.";
              break;
            case 'service-not-allowed':
              title = "Service Not Available";
              errorMessage = "Speech recognition service is not available in your browser. Please use typing instead.";
              break;
          }
          
          toast({
            title,
            description: errorMessage,
            variant: "destructive"
          });
        };

        recognitionRef.current.onstart = () => {
          setIsRecording(true);
          setNetworkRetries(0); // Reset retry count on successful start
          console.log('Speech recognition started');
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          console.log('Speech recognition ended');
        };

        recognitionRef.current.onspeechstart = () => {
          console.log('Speech detected');
        };

        recognitionRef.current.onspeechend = () => {
          console.log('Speech ended');
        };

        setSpeechSupported(true);

      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        setSpeechSupported(false);
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          toast({
            title: "Microphone Permission Required",
            description: "Please allow microphone access to use voice input, or continue with typing.",
            variant: "destructive"
          });
        }
      }
    };

    initializeSpeechRecognition();

    // Monitor network connectivity
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleRecording = async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Input Not Available",
        description: "Speech recognition requires Chrome, Edge, or Safari with internet access. Please type your response instead.",
        variant: "destructive"
      });
      return;
    }

    // Check network connectivity first
    if (!isOnline) {
      toast({
        title: "No Internet Connection",
        description: "Voice recognition requires an internet connection. Please check your connection and try again.",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      return;
    }

    try {
      // Check microphone permission before starting
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permission.state === 'denied') {
        toast({
          title: "Microphone Access Denied",
          description: "Please enable microphone access in your browser settings and refresh the page.",
          variant: "destructive"
        });
        return;
      }

      // Test microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream

      recognitionRef.current.start();
      toast({
        title: "Listening...",
        description: "Speak clearly. The microphone will automatically stop when you finish speaking.",
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          toast({
            title: "Microphone Permission Denied",
            description: "Please allow microphone access in your browser and try again.",
            variant: "destructive"
          });
        } else if (error.name === 'NotFoundError') {
          toast({
            title: "No Microphone Found",
            description: "Please connect a microphone and try again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Microphone Error",
            description: "Unable to access microphone. Please check your device settings.",
            variant: "destructive"
          });
        }
      }
    }
  };

  const handleSendResponse = async () => {
    if (!currentResponse.trim() || !currentQuestion || isLoading) return;

    setIsLoading(true);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'candidate',
      content: currentResponse,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    const response = currentResponse;
    setCurrentResponse("");

    try {
      // Evaluate the answer
      await evaluateAnswerMutation.mutateAsync({
        question: currentQuestion.question,
        answer: response,
        profession: session.configuration.profession,
        difficulty: session.configuration.difficulty
      });

      // Generate next question after a delay
      setTimeout(() => {
        const previousQuestions = messages
          .filter(m => m.role === 'interviewer')
          .map(m => m.content);
        
        generateQuestionMutation.mutate({
          profession: session.configuration.profession,
          interviewType: session.configuration.interviewType,
          difficulty: session.configuration.difficulty,
          jobPosting: session.configuration.jobPosting,
          previousQuestions
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your response",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleEndInterview = async () => {
    // Update session with messages
    await apiRequest("PATCH", `/api/sessions/${session.id}`, {
      messages: messages,
      status: 'completed',
      completedAt: new Date()
    });

    // Generate final feedback
    generateFeedbackMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getInterviewerName = () => {
    const names = {
      friendly: "Sarah Chen",
      strict: "Michael Rodriguez", 
      casual: "Alex Thompson",
      challenging: "Dr. Jennifer Wu"
    };
    return names[session.configuration.personality as keyof typeof names] || "Sarah Chen";
  };

  const getInterviewerRole = () => {
    const roles = {
      "Technical Interview": "Senior Software Engineer",
      "Behavioral Interview": "Engineering Manager",
      "System Design": "Principal Architect", 
      "HR/Culture Fit": "HR Business Partner"
    };
    return roles[session.configuration.interviewType as keyof typeof roles] || "Senior Engineer";
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          {/* Session Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback className="bg-blue-600 text-white">
                    <Bus className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">{getInterviewerName()}</h3>
                  <p className="text-sm text-gray-600">{getInterviewerRole()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Time Remaining</p>
                  <p className={`font-semibold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatTime(timeRemaining)}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEndInterview}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  End Interview
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <CardContent className="p-6">
            <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 space-y-4">
              {messages.length === 0 && generateQuestionMutation.isPending && (
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-600 text-white">
                      <Bus className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{getInterviewerName()}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="animate-pulse flex space-x-1">
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                      </div>
                      <span className="text-xs text-gray-500">Preparing question...</span>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={
                      message.role === 'interviewer' 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-600 text-white"
                    }>
                      {message.role === 'interviewer' ? (
                        <Bus className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {message.role === 'interviewer' ? getInterviewerName() : 'You'}
                      </p>
                      {message.score && (
                        <Badge variant={message.score >= 70 ? "default" : "secondary"}>
                          {message.score}/100
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700 mt-1">{message.content}</p>
                    {message.feedback && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-800">{message.feedback}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-600 text-white">
                      <Bus className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{getInterviewerName()}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="animate-pulse flex space-x-1">
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                        <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                      </div>
                      <span className="text-xs text-gray-500">Evaluating your response...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse bg-red-500 rounded-full h-3 w-3"></div>
                  <span className="text-red-800 font-medium">Recording... Speak clearly</span>
                  <button 
                    onClick={toggleRecording}
                    className="ml-auto text-red-600 hover:text-red-800 underline text-sm"
                  >
                    Stop Recording
                  </button>
                </div>
              </div>
            )}

            {/* Network Status Warning */}
            {!isOnline && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <X className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium">No Internet Connection</p>
                    <p className="text-red-700 text-sm mt-1">
                      Voice recognition requires a stable internet connection. Please check your connection and refresh the page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Speech Recognition Help */}
            {isOnline && !speechSupported && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-blue-800 font-medium">Voice Input Alternative</p>
                    <p className="text-blue-700 text-sm mt-1">
                      Voice recognition is temporarily unavailable due to network connectivity. 
                      <strong>Tip:</strong> Use your device's built-in voice-to-text feature (like iPhone's dictation or Android's voice typing) 
                      in the text area below for a similar experience!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Voice Input Instructions */}
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium">Voice Input Solution</p>
                  <p className="text-blue-700 text-sm mt-1">
                    For the best voice input experience, use your device's built-in dictation:
                    <br />
                    <strong>• iPhone/iPad:</strong> Tap the microphone icon on your keyboard
                    <br />
                    <strong>• Android:</strong> Tap the microphone icon on your keyboard
                    <br />
                    <strong>• Mac:</strong> Press Fn key twice or use Edit → Start Dictation
                    <br />
                    <strong>• Windows:</strong> Press Windows + H for voice typing
                  </p>
                </div>
              </div>
            </div>

            {/* Response Input */}
            <div className="flex space-x-3">
              <Textarea
                className="flex-1 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Type your response here... (For voice input: use your device's built-in voice typing - tap the microphone on your keyboard or use voice commands)"
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendResponse();
                  }
                }}
                disabled={isLoading || generateQuestionMutation.isPending}
                aria-label="Interview response input"
                autoComplete="off"
                spellCheck="true"
              />
              <div className="flex flex-col space-y-2">
                <Button 
                  size="lg"
                  onClick={handleSendResponse}
                  disabled={!currentResponse.trim() || isLoading || generateQuestionMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => {
                    toast({
                      title: "Voice Input Tip",
                      description: "Use your device's built-in voice typing feature in the text box below for reliable voice input.",
                    });
                  }}
                  disabled={isLoading || generateQuestionMutation.isPending}
                  className="hover:bg-blue-50"
                  title="Voice Input Help"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                disabled
                className="text-sm"
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                Ask for clarification
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled
                className="text-sm"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Request a hint
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, Mic, MicOff, HelpCircle, Lightbulb, Bus, User, X, Check } from "lucide-react";

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
  const [audioSupported, setAudioSupported] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  const transcribeAudioMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      if (result.text && result.text.trim()) {
        setCurrentResponse(prev => {
          const newText = prev ? prev + ' ' + result.text.trim() : result.text.trim();
          return newText;
        });
      }
    },
    onError: (error) => {
      console.error('Transcription error:', error);
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

  // Initialize audio recording capabilities
  useEffect(() => {
    const initializeAudioRecording = async () => {
      try {
        if (!navigator.mediaDevices || !window.MediaRecorder) {
          console.log('Audio recording not supported');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        setAudioSupported(true);
        console.log('Audio recording initialized successfully');
      } catch (error) {
        console.error('Failed to initialize audio recording:', error);
        setAudioSupported(false);
      }
    };

    initializeAudioRecording();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context for wave visualization
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Start audio level monitoring
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average volume level
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average / 255); // Normalize to 0-1
          
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      setAudioChunks(chunks);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      updateAudioLevel();
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check permissions and try again.",
        variant: "destructive"
      });
    }
  };

  const submitRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          transcribeAudioMutation.mutate(audioBlob);
        }
        cleanupRecording();
      };
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        cleanupRecording();
      };
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioChunks([]);
    }
  };

  const cleanupRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setAudioLevel(0);
  };

  const handleSendResponse = async () => {
    if (!currentResponse.trim() || !currentQuestion || isLoading) return;

    setIsLoading(true);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'candidate',
      content: currentResponse,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    const response = currentResponse;
    setCurrentResponse("");

    try {
      await evaluateAnswerMutation.mutateAsync({
        question: currentQuestion.question,
        answer: response,
        profession: session.configuration.profession,
        difficulty: session.configuration.difficulty
      });

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
    await apiRequest("PATCH", `/api/sessions/${session.id}`, {
      messages: messages,
      status: 'completed',
      completedAt: new Date()
    });

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



            {/* Voice Input Status */}
            {audioSupported ? (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Mic className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-medium">Voice Input Ready</p>
                    <p className="text-green-700 text-sm mt-1">
                      Click the microphone button to record your voice, or type your response below.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <HelpCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 font-medium">Voice Input Unavailable</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Microphone access required for voice input. Please allow permissions when prompted.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Response Input */}
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Textarea
                  className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-3 pb-16"
                  rows={4}
                  placeholder={isRecording ? "Recording in progress..." : "Type your response here..."}
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendResponse();
                    }
                  }}
                  disabled={isLoading || generateQuestionMutation.isPending || isRecording}
                  aria-label="Interview response input"
                  autoComplete="off"
                  spellCheck="true"
                />
                
                {/* Integrated Recording Interface */}
                {isRecording && (
                  <div className="absolute bottom-2 left-2 right-2 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="animate-pulse bg-red-500 rounded-full h-2 w-2"></div>
                        <span className="text-red-800 text-xs font-medium">Recording...</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelRecording}
                          className="text-red-600 border-red-300 hover:bg-red-100 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={submitRecording}
                          className="text-green-600 border-green-300 hover:bg-green-100 h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Voice Wave Visualization */}
                    <div className="flex items-center justify-center space-x-0.5 h-6">
                      {Array.from({ length: 25 }, (_, i) => (
                        <div
                          key={i}
                          className="bg-red-400 rounded-full transition-all duration-150"
                          style={{
                            width: '2px',
                            height: `${Math.max(3, audioLevel * 20 + Math.random() * 8)}px`,
                            opacity: audioLevel > 0.05 ? 0.8 : 0.3,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Processing Status */}
                {transcribeAudioMutation.isPending && (
                  <div className="absolute bottom-2 left-2 right-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span className="text-blue-800 text-xs font-medium">Converting speech to text...</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button 
                  size="lg"
                  onClick={handleSendResponse}
                  disabled={!currentResponse.trim() || isLoading || generateQuestionMutation.isPending || isRecording}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
                {audioSupported && !isRecording && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={startRecording}
                    disabled={isLoading || generateQuestionMutation.isPending || transcribeAudioMutation.isPending}
                    className="hover:bg-blue-50"
                    title="Start Voice Recording"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
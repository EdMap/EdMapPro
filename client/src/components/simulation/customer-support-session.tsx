import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { formatDuration } from "@/lib/utils";
import { Send, Mic, Phone, MessageCircle, Clock, User, X, Check } from "lucide-react";

interface Message {
  id: string;
  role: 'customer' | 'agent';
  content: string;
  timestamp: Date;
  sentiment?: string;
  empathyScore?: number;
  clarityScore?: number;
  feedback?: string;
  suggestedResponse?: string;
}

interface CustomerSupportSessionProps {
  session: any;
  onComplete: () => void;
}

const supportStages = [
  "Greeting",
  "Problem Diagnosis", 
  "Resolution",
  "Escalation",
  "Closing"
];

const customerPersonas = [
  { id: "angry", name: "Angry Customer", description: "Frustrated and impatient, wants immediate resolution" },
  { id: "polite", name: "Polite Customer", description: "Courteous and understanding, follows instructions well" },
  { id: "confused", name: "Confused Customer", description: "Unclear about their problem, needs guidance" },
  { id: "elderly", name: "Elderly Customer", description: "Not tech-savvy, needs patient explanation" },
  { id: "urgent", name: "Urgent Customer", description: "Has a time-sensitive issue, stressed about deadline" },
  { id: "skeptical", name: "Skeptical Customer", description: "Doubtful about solutions, needs convincing" }
];

export default function CustomerSupportSession({ session, onComplete }: CustomerSupportSessionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(session.configuration.duration * 60);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(session.configuration.stage || "Greeting");
  const [sessionActive, setSessionActive] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [audioSupported, setAudioSupported] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize customer conversation
  const generateCustomerMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/customer-support/message", data);
      return response.json();
    },
    onSuccess: (result) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'customer',
        content: result.message,
        timestamp: new Date(),
        sentiment: result.sentiment
      };
      setMessages(prev => [...prev, newMessage]);
    }
  });

  // Evaluate agent response
  const evaluateResponseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/customer-support/evaluate", data);
      return response.json();
    },
    onSuccess: (evaluation) => {
      setMessages(prev => {
        const updated = [...prev];
        const lastAgentMessageIndex = updated.map(m => m.role).lastIndexOf('agent');
        if (lastAgentMessageIndex !== -1) {
          updated[lastAgentMessageIndex] = {
            ...updated[lastAgentMessageIndex],
            empathyScore: evaluation.empathyScore,
            clarityScore: evaluation.clarityScore,
            feedback: evaluation.feedback,
            suggestedResponse: evaluation.suggestedResponse
          };
        }
        return updated;
      });

      // Generate customer response based on agent's message
      setTimeout(() => {
        generateCustomerMessageMutation.mutate({
          stage: currentStage,
          persona: session.configuration.persona,
          problem: session.configuration.problem,
          agentMessage: currentResponse,
          conversationHistory: messages.slice(-4).map(m => ({
            role: m.role,
            content: m.content
          }))
        });
      }, 1500);
    }
  });

  // Audio transcription
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
      handleEndSession();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Initialize audio support
  useEffect(() => {
    const checkAudioSupport = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          setAudioSupported(true);
          console.log('Audio recording initialized successfully');
        }
      } catch (error) {
        console.error('Audio not supported:', error);
        setAudioSupported(false);
      }
    };

    checkAudioSupport();
  }, []);

  // Generate initial customer message
  useEffect(() => {
    if (messages.length === 0 && sessionActive) {
      generateCustomerMessageMutation.mutate({
        stage: currentStage,
        persona: session.configuration.persona,
        problem: session.configuration.problem,
        isInitial: true
      });
    }
  }, [sessionActive]);

  const handleSendResponse = async () => {
    if (!currentResponse.trim() || isLoading) return;

    setIsLoading(true);
    
    const agentMessage: Message = {
      id: Date.now().toString(),
      role: 'agent',
      content: currentResponse,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, agentMessage]);
    
    const response = currentResponse;
    setCurrentResponse("");

    try {
      await evaluateResponseMutation.mutateAsync({
        stage: currentStage,
        agentMessage: response,
        customerPersona: session.configuration.persona,
        problem: session.configuration.problem,
        conversationHistory: messages.slice(-3)
      });
    } catch (error) {
      console.error('Failed to process response:', error);
    }
    
    setIsLoading(false);
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    await apiRequest("PATCH", `/api/sessions/${session.id}`, {
      status: 'completed',
      endTime: new Date().toISOString()
    });
    onComplete();
  };

  const handleStageChange = (newStage: string) => {
    setCurrentStage(newStage);
    // Generate a message appropriate for the new stage
    generateCustomerMessageMutation.mutate({
      stage: newStage,
      persona: session.configuration.persona,
      problem: session.configuration.problem,
      stageTransition: true
    });
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        
        if (isRecording) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      setAudioChunks([]);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      updateAudioLevel();
    } catch (error) {
      console.error('Failed to start recording:', error);
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setAudioLevel(0);
  };

  const getPersonaInfo = () => {
    return customerPersonas.find(p => p.id === session.configuration.persona) || customerPersonas[0];
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'angry': case 'frustrated': return 'text-red-600 bg-red-50';
      case 'happy': case 'satisfied': return 'text-green-600 bg-green-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      case 'confused': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const persona = getPersonaInfo();

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Customer Support Simulation</h2>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="secondary">{session.configuration.channel}</Badge>
              <Badge variant="outline">{currentStage}</Badge>
              <span className="text-sm text-gray-600">
                Time: {formatDuration(timeRemaining)}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Select value={currentStage} onValueChange={handleStageChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportStages.map((stage) => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleEndSession}>
              End Session
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Customer Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{persona.name}</h4>
                  <p className="text-sm text-gray-600">{persona.description}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Issue:</h5>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {session.configuration.problem}
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Channel:</h5>
                  <div className="flex items-center space-x-2">
                    {session.configuration.channel === 'Chat' ? 
                      <MessageCircle className="h-4 w-4" /> : 
                      <Phone className="h-4 w-4" />
                    }
                    <span className="text-sm">{session.configuration.channel}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversation */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Support Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-sm ${
                      message.role === 'agent' 
                        ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg' 
                        : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg'
                    } p-3`}>
                      <div className="flex items-start space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className={
                            message.role === 'agent' 
                              ? 'bg-blue-100 text-blue-700 text-xs' 
                              : 'bg-gray-200 text-gray-700 text-xs'
                          }>
                            {message.role === 'agent' ? 'A' : 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-75">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            {message.sentiment && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getSentimentColor(message.sentiment)}`}
                              >
                                {message.sentiment}
                              </Badge>
                            )}
                          </div>
                          {message.role === 'agent' && (message.empathyScore || message.clarityScore) && (
                            <div className="mt-2 space-y-2">
                              <div className="flex space-x-2">
                                {message.empathyScore && (
                                  <span className={`text-xs ${getScoreColor(message.empathyScore)}`}>
                                    Empathy: {message.empathyScore}/10
                                  </span>
                                )}
                                {message.clarityScore && (
                                  <span className={`text-xs ${getScoreColor(message.clarityScore)}`}>
                                    Clarity: {message.clarityScore}/10
                                  </span>
                                )}
                              </div>
                              
                              {/* Show feedback and suggestions for poor responses */}
                              {((message.empathyScore && message.empathyScore < 6) || (message.clarityScore && message.clarityScore < 6)) && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
                                  <div className="font-medium text-yellow-800 mb-1">💡 Improvement Suggestion:</div>
                                  {message.feedback && (
                                    <div className="text-yellow-700 mb-2">
                                      {message.feedback}
                                    </div>
                                  )}
                                  {message.suggestedResponse && (
                                    <div className="bg-white border border-yellow-300 rounded p-2">
                                      <div className="font-medium text-yellow-800 mb-1">Better response example:</div>
                                      <div className="text-gray-700 text-xs italic">
                                        "{message.suggestedResponse}"
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(isLoading || generateCustomerMessageMutation.isPending) && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-r-lg rounded-tl-lg p-3 max-w-sm">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span className="text-sm text-gray-600">Customer is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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
                    disabled={isLoading || generateCustomerMessageMutation.isPending || isRecording}
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
                    disabled={!currentResponse.trim() || isLoading || generateCustomerMessageMutation.isPending || isRecording}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  {audioSupported && !isRecording && session.configuration.channel === 'Call' && (
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={startRecording}
                      disabled={isLoading || generateCustomerMessageMutation.isPending || transcribeAudioMutation.isPending}
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
    </div>
  );
}
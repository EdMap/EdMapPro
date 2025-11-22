import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Users, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  FileCode,
  FileText
} from "lucide-react";

export default function DocumentViewer() {
  const [, params] = useRoute("/workspace/:sessionId/document/:docType");
  const sessionId = params?.sessionId;
  const docType = params?.docType;

  const { data: session } = useQuery<any>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  const { data: project } = useQuery<any>({
    queryKey: [`/api/workspace/projects/${(session?.configuration as any)?.projectId}`],
    enabled: !!session && !!(session?.configuration as any)?.projectId,
  });

  const requirements = (project?.requirements as any) || {};
  const productDocumentation = requirements.productDocumentation || {};
  const featureRequest = requirements.featureRequest || {};

  if (!session || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading document...</div>
      </div>
    );
  }

  const renderDocument = () => {
    switch (docType) {
      case 'executive-summary':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                Executive Summary
              </CardTitle>
              <CardDescription>Strategic overview and business context</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed text-base">
                {productDocumentation.executiveSummary}
              </p>
            </CardContent>
          </Card>
        );

      case 'feature-requirements':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Feature Requirements</CardTitle>
              <CardDescription>{featureRequest.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Business Context</h4>
                <p className="text-gray-700 leading-relaxed">{featureRequest.businessContext}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Technical Requirements</h4>
                <ul className="space-y-3">
                  {featureRequest.requirements?.map((req: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Acceptance Criteria</h4>
                <ul className="space-y-3">
                  {featureRequest.acceptanceCriteria?.map((criteria: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded border-2 border-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      case 'stakeholder-analysis':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-600" />
                Stakeholder Analysis
              </CardTitle>
              <CardDescription>Key stakeholders, priorities, and success criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {productDocumentation.stakeholders?.map((stakeholder: any, idx: number) => (
                <div key={idx} className="border-l-4 border-purple-300 pl-6 py-3">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-gray-900 text-lg">{stakeholder.name}</h5>
                      <p className="text-gray-600">{stakeholder.title}</p>
                    </div>
                    <Badge variant="outline">{stakeholder.priority}</Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Concerns:</span>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        {stakeholder.concerns.map((concern: string, i: number) => (
                          <li key={i} className="text-gray-600">{concern}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Success Metrics:</span>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        {stakeholder.successMetrics.map((metric: string, i: number) => (
                          <li key={i} className="text-gray-600">{metric}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 'user-stories':
        return (
          <Card>
            <CardHeader>
              <CardTitle>User Stories & Personas</CardTitle>
              <CardDescription>Target users, their goals, and pain points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {productDocumentation.userStories?.map((story: any, idx: number) => (
                <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-2xl">{story.persona.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 text-lg">{story.persona}</h5>
                      <p className="text-blue-700 font-medium">{story.goal}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic mb-3 text-base">{story.story}</p>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-700">Pain Point:</span>
                      <span className="text-gray-600">{story.painPoint}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-700">Key Jobs:</span>
                      <span className="text-gray-600">{story.jobs.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 'success-metrics':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-green-600" />
                Success Metrics & KPIs
              </CardTitle>
              <CardDescription>Measurable outcomes and performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {productDocumentation.successMetrics?.primary && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <Badge className="bg-green-600">Primary Metrics</Badge>
                  </h4>
                  <ul className="space-y-2">
                    {productDocumentation.successMetrics.primary.map((metric: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {productDocumentation.successMetrics?.secondary && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <Badge variant="outline">Secondary Metrics</Badge>
                  </h4>
                  <ul className="space-y-2">
                    {productDocumentation.successMetrics.secondary.map((metric: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <ChevronRight className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {productDocumentation.successMetrics?.technical && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <Badge variant="outline" className="bg-gray-100">Technical Metrics</Badge>
                  </h4>
                  <ul className="space-y-2">
                    {productDocumentation.successMetrics.technical.map((metric: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <FileCode className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'roadmap-context':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-orange-600" />
                Roadmap Context
              </CardTitle>
              <CardDescription>Strategic positioning and timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                  {productDocumentation.roadmapContext?.quarterlyTheme}
                </h4>
                <p className="text-gray-700">{productDocumentation.roadmapContext?.positioning}</p>
              </div>
              
              {productDocumentation.roadmapContext?.dependencies && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-lg">Dependencies</h4>
                  <ul className="space-y-2">
                    {productDocumentation.roadmapContext.dependencies.map((dep: string, idx: number) => (
                      <li key={idx} className="text-gray-700 flex items-start gap-3">
                        <ChevronRight className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        {dep}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {productDocumentation.roadmapContext?.futureEnhancements && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-lg">Future Enhancements</h4>
                  <ul className="space-y-2">
                    {productDocumentation.roadmapContext.futureEnhancements.map((enhancement: string, idx: number) => (
                      <li key={idx} className="text-gray-600 flex items-start gap-3">
                        <ChevronRight className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        {enhancement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'competitive-analysis':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Competitive Analysis</CardTitle>
              <CardDescription>Market positioning and differentiation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {productDocumentation.competitiveAnalysis?.map((comp: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <h5 className="font-semibold text-gray-900 text-lg">{comp.competitor}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded p-3">
                      <span className="font-medium text-gray-700">Their Capability:</span>
                      <p className="text-gray-600 mt-2">{comp.theirCapability}</p>
                    </div>
                    <div className="bg-green-50 rounded p-3">
                      <span className="font-medium text-green-800">Our Differentiator:</span>
                      <p className="text-green-700 mt-2">{comp.ourDifferentiator}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                    <span className="font-medium text-blue-800">Gap: </span>
                    <span className="text-blue-700">{comp.gap}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 'gtm-strategy':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Go-to-Market Strategy</CardTitle>
              <CardDescription>Launch plan and market approach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Launch Date</h5>
                  <p className="text-gray-700">{productDocumentation.goToMarketStrategy?.launchDate}</p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Pricing</h5>
                  <p className="text-gray-700">{productDocumentation.goToMarketStrategy?.pricing}</p>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-3 text-lg">Target Segment</h5>
                <p className="text-gray-700">{productDocumentation.goToMarketStrategy?.targetSegment}</p>
              </div>

              {productDocumentation.goToMarketStrategy?.messagingPillars && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3 text-lg">Messaging Pillars</h5>
                  <ul className="space-y-2">
                    {productDocumentation.goToMarketStrategy.messagingPillars.map((pillar: string, idx: number) => (
                      <li key={idx} className="text-gray-700 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        {pillar}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {productDocumentation.goToMarketStrategy?.salesEnablement && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3 text-lg">Sales Enablement</h5>
                  <ul className="space-y-2">
                    {productDocumentation.goToMarketStrategy.salesEnablement.map((item: string, idx: number) => (
                      <li key={idx} className="text-gray-600 flex items-start gap-3">
                        <ChevronRight className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {productDocumentation.goToMarketStrategy?.launchActivities && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3 text-lg">Launch Activities</h5>
                  <ul className="space-y-2">
                    {productDocumentation.goToMarketStrategy.launchActivities.map((activity: string, idx: number) => (
                      <li key={idx} className="text-gray-600 flex items-start gap-3">
                        <ChevronRight className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'risk-assessment':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>Identified risks and mitigation strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {productDocumentation.riskAssessment?.map((risk: any, idx: number) => (
                <div key={idx} className="border-l-4 border-red-300 pl-6 py-3">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="font-semibold text-gray-900 text-lg">{risk.risk}</h5>
                    <div className="flex gap-2">
                      <Badge variant="outline">Probability: {risk.probability}</Badge>
                      <Badge variant="outline">Impact: {risk.impact}</Badge>
                    </div>
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">Mitigation:</span> {risk.mitigation}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 'resource-planning':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Resource Planning</CardTitle>
              <CardDescription>Team allocation, timeline, and budget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {productDocumentation.resourcePlanning?.teamAllocation && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3 text-lg">Team Allocation</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(productDocumentation.resourcePlanning.teamAllocation).map(([role, allocation]: [string, any]) => (
                      <div key={role} className="bg-gray-50 rounded p-3">
                        <span className="font-medium text-gray-700 capitalize">{role}:</span>
                        <span className="text-gray-600 ml-2">{allocation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {productDocumentation.resourcePlanning?.timeline && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <h5 className="font-semibold text-gray-900 mb-2 text-lg">Timeline</h5>
                  <p className="text-gray-700">{productDocumentation.resourcePlanning.timeline}</p>
                </div>
              )}

              {productDocumentation.resourcePlanning?.budget && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3 text-lg">Budget</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(productDocumentation.resourcePlanning.budget).map(([item, cost]: [string, any]) => (
                      <div key={item} className="flex justify-between bg-gray-50 rounded p-3">
                        <span className="font-medium text-gray-700 capitalize">{item}:</span>
                        <span className="text-gray-900 font-semibold">{cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {productDocumentation.resourcePlanning?.dependencies && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3 text-lg">Dependencies</h5>
                  <ul className="space-y-2">
                    {productDocumentation.resourcePlanning.dependencies.map((dep: string, idx: number) => (
                      <li key={idx} className="text-gray-700 flex items-start gap-3">
                        <ChevronRight className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        {dep}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-gray-500">Document not found</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <FileText className="h-4 w-4" />
            <span>{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Product Documentation</h1>
        </div>
        
        {renderDocument()}
      </div>
    </div>
  );
}

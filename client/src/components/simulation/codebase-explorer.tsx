import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Folder, 
  FileCode, 
  FileText,
  ChevronRight, 
  ChevronDown,
  Book,
  Code2,
  FileJson
} from "lucide-react";

interface CodebaseExplorerProps {
  codebaseData: {
    structure: Record<string, string[]>;
    keyFiles: Array<{
      path: string;
      description: string;
      snippet: string;
    }>;
  };
  productInfo: {
    name: string;
    description: string;
    existingFeatures: string[];
    techStack: string[];
    codebaseSize: string;
    architecture: string;
  };
}

export default function CodebaseExplorer({ codebaseData, productInfo }: CodebaseExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return FileCode;
    if (filename.endsWith('.json')) return FileJson;
    if (filename.endsWith('.md')) return FileText;
    return FileCode;
  };

  const selectedFileData = codebaseData.keyFiles.find(f => f.path === selectedFile);

  return (
    <div className="space-y-4">
      <Card data-testid="card-product-overview">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            {productInfo.name}
          </CardTitle>
          <CardDescription>{productInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Existing Features</h4>
            <div className="flex flex-wrap gap-2">
              {productInfo.existingFeatures.map((feature, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Tech Stack</h4>
              <div className="flex flex-wrap gap-1">
                {productInfo.techStack.map((tech, idx) => (
                  <Badge key={idx} className="text-xs bg-blue-100 text-blue-800">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Codebase Info</h4>
              <p className="text-sm text-gray-600">{productInfo.codebaseSize}</p>
              <p className="text-sm text-gray-600">{productInfo.architecture}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="structure" data-testid="tab-structure">File Structure</TabsTrigger>
          <TabsTrigger value="keyfiles" data-testid="tab-keyfiles">Key Files</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Structure</CardTitle>
              <CardDescription>Explore the codebase organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1" data-testid="file-tree">
                {Object.entries(codebaseData.structure).map(([folder, files]) => (
                  <div key={folder}>
                    <button
                      onClick={() => toggleFolder(folder)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-gray-100 rounded text-left"
                      data-testid={`folder-${folder.replace(/\//g, '-')}`}
                    >
                      {expandedFolders.has(folder) ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <Folder className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">{folder}/</span>
                      <span className="text-xs text-gray-500">({files.length} files)</span>
                    </button>
                    
                    {expandedFolders.has(folder) && (
                      <div className="ml-6 space-y-0.5">
                        {files.map((file) => {
                          const Icon = getFileIcon(file);
                          return (
                            <div
                              key={file}
                              className="flex items-center gap-2 px-2 py-1 text-sm text-gray-600"
                              data-testid={`file-${file}`}
                            >
                              <Icon className="h-3.5 w-3.5 text-gray-400" />
                              <span>{file}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keyfiles" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Important Files</CardTitle>
                <CardDescription>Files relevant to your feature</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {codebaseData.keyFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file.path)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        selectedFile === file.path
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      data-testid={`keyfile-${file.path.replace(/\//g, '-')}`}
                    >
                      <div className="flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {file.path.split('/').pop()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {file.description}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">File Preview</CardTitle>
                {selectedFileData && (
                  <CardDescription>{selectedFileData.path}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {selectedFileData ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900">{selectedFileData.description}</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-100 font-mono">
                        <code>{selectedFileData.snippet}</code>
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500" data-testid="no-file-selected">
                    <Code2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Select a file to view its details and code snippet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

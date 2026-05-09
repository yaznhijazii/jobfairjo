import { useState } from "react";
import { Upload, Zap, Briefcase, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CVUploadResponse, MatchResponse, MatchResult, ProcessingStep } from "@shared/schema";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ProcessingStatus } from "@/components/processing-status";
import { JobMatchCard } from "@/components/job-match-card";
import { Navbar } from "@/components/navbar";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState<string>("");
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [selectedJob, setSelectedJob] = useState<MatchResult | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setProcessingStep("uploading");
      const formData = new FormData();
      formData.append("cv", file);
      
      const response = await fetch("/api/upload-cv", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload CV");
      }
      
      return response.json() as Promise<CVUploadResponse>;
    },
    onSuccess: (data) => {
      console.log("[Client] CV Upload Success:", data);
      if (data.success && data.text) {
        console.log(`[Client] Extracted CV text length: ${data.text.length} characters`);
        setCvText(data.text);
        setProcessingStep("extracting");
        toast({
          title: "CV Processed Successfully",
          description: "Now analyzing job matches...",
        });
        matchMutation.mutate(data.text);
      } else {
        setProcessingStep("error");
        toast({
          title: "Upload Failed",
          description: data.error || "Could not extract text from PDF",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("[Client] CV Upload Error:", error);
      setProcessingStep("error");
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const matchMutation = useMutation({
    mutationFn: async (text: string) => {
      setProcessingStep("fetching");
      await new Promise(resolve => setTimeout(resolve, 800));
      setProcessingStep("analyzing");
      return apiRequest<MatchResponse>("POST", "/api/match-jobs", { cvText: text });
    },
    onSuccess: (data) => {
      console.log("[Client] Matching Success:", data);
      if (data && data.matches && Array.isArray(data.matches)) {
        console.log(`[Client] Found ${data.matches.length} job matches`);
        setMatches(data.matches);
        setProcessingStep("complete");
        toast({
          title: "Matches Found!",
          description: `Found ${data.matches.length} top opportunities for you.`,
        });
      } else {
        setProcessingStep("error");
        toast({
          title: "Matching Failed",
          description: "Received invalid response from server",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      setProcessingStep("error");
      toast({
        title: "Matching Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setMatches([]);
    uploadMutation.mutate(file);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setCvText("");
    setMatches([]);
    setProcessingStep("idle");
  };

  const isProcessing = ["uploading", "extracting", "fetching", "analyzing"].includes(processingStep);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight leading-tight mb-4">
            Find Your Perfect Role at JoAcademy
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Your personalized career path starts here. Upload your resume and let our advanced AI 
            match you with the most relevant opportunities based on your skills and experience.
          </p>
        </div>
      </section>

      {/* Upload Section */}
      {processingStep === "idle" || processingStep === "error" ? (
        <section className="px-6 pb-12">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Submit Your Resume</h2>
                <p className="text-sm text-muted-foreground">
                  Upload your CV in PDF format to start the matching process
                </p>
              </div>
              <FileUploadZone 
                onFileSelect={handleFileSelect}
                isUploading={uploadMutation.isPending}
              />
              {processingStep === "error" && (
                <div className="mt-4 flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">Something went wrong. Please try again.</p>
                </div>
              )}
            </Card>

          </div>
        </section>
      ) : null}

      {/* Processing Status */}
      {isProcessing && (
        <section className="px-6 pb-12">
          <div className="max-w-4xl mx-auto">
            <ProcessingStatus step={processingStep} fileName={uploadedFile?.name} />
          </div>
        </section>
      )}

      {/* Results Section */}
      {processingStep === "complete" && matches.length > 0 && (
        <section className="px-6 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle2 className="w-6 h-6" />
                <h2 className="text-2xl font-semibold">Your Top Matches</h2>
              </div>
              <p className="text-muted-foreground">
                Based on deep AI analysis of your resume and {matches[0]?.job ? 'live' : ''} job descriptions
              </p>
            </div>

            {/* Low Match Score State: Show ONLY interest form, no matches */}
            {matches.length > 0 && matches[0].score < 0.4 ? (
              <div className="max-w-3xl mx-auto mb-10">
                <Card className="p-8 border-amber-200 bg-amber-50 text-amber-900 shadow-lg text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                      <AlertCircle className="w-10 h-10 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-2xl mb-2">Build Your Future at JoAcademy</h3>
                    <p className="text-lg mb-6 max-w-xl">
                      We didn't find a direct match for your current profile among our open roles. 
                      However, we're always looking for talented individuals! Please share your details 
                      via our interest form, and we'll reach out when a suitable position opens up.
                    </p>
                    <Button asChild variant="default" size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8 h-14 text-lg">
                      <a href="https://joacademy123.bitrix24.site/crm_form_o2o4v/" target="_blank" rel="noreferrer">
                        Fill General Interest Form
                      </a>
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              /* High Match Score State: Show matches */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {matches.map((match, index) => (
                  <JobMatchCard
                    key={index}
                    match={match}
                    onViewDetails={() => setSelectedJob(match)}
                    animationDelay={index * 100}
                  />
                ))}
              </div>
            )}

            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={handleReset}
                data-testid="button-upload-another"
              >
                Upload Another Resume
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          match={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t py-8 px-6 mt-auto">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 Jo Academy</p>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
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
import { JobDetailModal } from "@/components/job-detail-modal";
import { Navbar } from "@/components/navbar";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState<string>("");
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [selectedJob, setSelectedJob] = useState<MatchResult | null>(null);
  const { toast } = useToast();
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (processingStep === "complete" && matches.length > 0) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [processingStep, matches.length]);

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
        const highMatches = data.matches.filter(m => m.score >= 0.4);
        setMatches(data.matches);
        setProcessingStep("complete");
        
        if (highMatches.length > 0) {
          toast({
            title: "Matches Found!",
            description: `Found ${highMatches.length} top ${highMatches.length === 1 ? 'opportunity' : 'opportunities'} for you.`,
          });
        } else {
          toast({
            title: "Analysis Complete",
            description: "We couldn't find a direct match, but check our general interest form below.",
          });
        }
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
            Find Your Role at JO Academy
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Upload your resume and let our AI match you with the perfect role in seconds.
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
                  Upload your CV in PDF or Word format to start the matching process
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
        <section ref={resultsRef} className="px-6 pb-16">
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
              <div className="max-w-2xl mx-auto mb-10">
                <Card className="p-10 border-none bg-gradient-to-br from-amber-50 to-orange-50 shadow-xl text-center overflow-hidden relative">
                  {/* Decorative background element */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl" />
                  
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-2 rotate-3 hover:rotate-0 transition-transform duration-300">
                      <AlertCircle className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="font-bold text-3xl text-amber-900 tracking-tight">Let's Stay Connected</h3>
                    <p className="text-lg text-amber-800/80 mb-6 max-w-md leading-relaxed">
                      We didn't find an exact match today, but we'd love to keep you in our talent pool for future roles.
                    </p>
                    <Button asChild variant="default" size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-10 h-14 text-lg rounded-xl shadow-lg shadow-amber-200 transition-all hover:scale-105 active:scale-95">
                      <a href="https://joacademy123.bitrix24.site/crm_form_o2o4v/" target="_blank" rel="noreferrer">
                        Join Talent Pool
                      </a>
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              /* High Match Score State: Show matches */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {matches.filter(m => m.score >= 0.4).map((match, index) => (
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
          <p>© 2026 JO Academy</p>
        </div>
      </footer>
    </div>
  );
}

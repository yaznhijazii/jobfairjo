import { X, ExternalLink, Building2, MapPin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@shared/schema";

interface JobDetailModalProps {
  match: MatchResult;
  onClose: () => void;
}

export function JobDetailModal({ match, onClose }: JobDetailModalProps) {
  const { job, score, rank } = match;
  const percentageScore = Math.round(score * 100);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    if (rank === 2) return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
    return "bg-amber-700/10 text-amber-800 dark:text-amber-500 border-amber-700/20";
  };

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      data-testid="modal-job-detail"
    >
      <div className="bg-card border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge 
                className={cn("rounded-full px-3 py-1 text-xs font-bold border", getRankBadgeColor(rank))}
              >
                #{rank} Match
              </Badge>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">{percentageScore}% Match</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold leading-tight" data-testid="text-modal-title">
              {job.title}
            </h2>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>{job.department}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full flex-shrink-0"
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Match Confidence */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Match Confidence</span>
              <span className="text-2xl font-bold text-primary">{percentageScore}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-blue-600 transition-all duration-1000"
                style={{ width: `${percentageScore}%` }}
              />
            </div>
            <p className="text-sm font-medium mt-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              AI Matching Rationale:
            </p>
            <p className="text-sm text-muted-foreground mt-1 italic bg-primary/5 p-3 rounded-md border border-primary/10" data-testid="text-modal-rationale">
              "{match.rationale}"
            </p>
          </div>

          {/* Job Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Job Description</h3>
            <div 
              className="prose prose-sm max-w-none text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: job.description }}
              data-testid="text-modal-description"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button asChild className="flex-1" data-testid="button-apply-now">
              <a href={job.link} target="_blank" rel="noopener noreferrer">
                Apply on JoAcademy
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button variant="outline" onClick={onClose} data-testid="button-close">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

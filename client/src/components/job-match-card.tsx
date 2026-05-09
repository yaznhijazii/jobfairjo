import { Building2, MapPin, ExternalLink, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@shared/schema";

interface JobMatchCardProps {
  match: MatchResult;
  onViewDetails: () => void;
  animationDelay?: number;
}

export function JobMatchCard({ match, onViewDetails, animationDelay = 0 }: JobMatchCardProps) {
  const { job, score, rank } = match;
  const percentageScore = Math.round(score * 100);
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    if (rank === 2) return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
    return "bg-amber-700/10 text-amber-800 dark:text-amber-500 border-amber-700/20";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 0.8) return "from-green-500 to-emerald-600";
    if (score >= 0.6) return "from-blue-500 to-cyan-600";
    if (score >= 0.4) return "from-yellow-500 to-orange-600";
    return "from-orange-500 to-red-600";
  };

  return (
    <Card
      className={cn(
        "p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden",
        "animate-in fade-in slide-in-from-bottom-4"
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
      data-testid={`card-job-${rank}`}
    >
      {/* Rank Badge */}
      <div className="absolute top-4 right-4">
        <Badge 
          className={cn("rounded-full px-3 py-1 text-xs font-bold border", getRankColor(rank))}
          data-testid={`badge-rank-${rank}`}
        >
          #{rank}
        </Badge>
      </div>

      {/* Job Title */}
      <h3 className="text-xl font-semibold mb-4 pr-12 leading-snug" data-testid={`text-job-title-${rank}`}>
        {job.title}
      </h3>

      {/* Match Score */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold" data-testid={`text-score-${rank}`}>
            {percentageScore}%
          </span>
          <span className="text-sm text-muted-foreground">match</span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full bg-gradient-to-r transition-all duration-1000", getScoreGradient(score))}
            style={{ width: `${percentageScore}%`, animationDelay: `${animationDelay + 200}ms` }}
          />
        </div>
        
        <div className="flex items-center gap-1 mt-2">
          <Award className="w-3 h-3 text-primary" />
          <span className="text-xs text-muted-foreground font-semibold">AI Insight:</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2" data-testid={`text-rationale-${rank}`}>
          "{match.rationale}"
        </p>
      </div>

      {/* Divider */}
      <div className="border-t my-4" />

      {/* Job Details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-start gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Department</p>
            <p className="text-sm font-medium" data-testid={`text-department-${rank}`}>
              {job.department}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="text-sm font-medium" data-testid={`text-location-${rank}`}>
              {job.location}
            </p>
          </div>
        </div>
      </div>

      {/* Description Preview */}
      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
        {job.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
      </p>

      {/* Action Button */}
      <Button 
        className="w-full" 
        onClick={onViewDetails}
        data-testid={`button-view-details-${rank}`}
      >
        View Full Details
        <ExternalLink className="w-4 h-4 ml-2" />
      </Button>
    </Card>
  );
}

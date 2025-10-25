import { useCallback, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export function FileUploadZone({ onFileSelect, isUploading }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please select a PDF file only");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please select a PDF file only");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative min-h-[240px] border-2 border-dashed rounded-xl transition-all duration-200",
        "flex flex-col items-center justify-center p-8 cursor-pointer",
        isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-muted/50",
        isUploading && "pointer-events-none opacity-60"
      )}
      data-testid="upload-zone"
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
        data-testid="input-file"
      />
      
      <div className="flex flex-col items-center gap-4">
        {isUploading ? (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-lg font-medium">Processing your CV...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          </>
        ) : isDragging ? (
          <>
            <FileText className="w-16 h-16 text-primary" />
            <div className="text-center">
              <p className="text-lg font-medium">Drop your PDF here</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium mb-1">
                Drag & drop your resume here
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                PDF format only • Max 10MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

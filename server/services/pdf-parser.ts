// PDF text extraction using pdf-parse
import { PDFParse, VerbosityLevel } from "pdf-parse";

export interface PDFData {
  text: string;
  numpages: number;
  info: any;
  metadata: any;
  version: string;
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Create parser with options
    const pdfParser = new PDFParse({
      verbosity: VerbosityLevel.ERRORS,
    });
    
    const data = await pdfParser.parse(buffer);
    return data.text.trim();
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from PDF. Please ensure the file is a valid PDF with readable text.");
  }
}

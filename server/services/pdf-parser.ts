// PDF text extraction using pdf-parse
import { PDFParse, VerbosityLevel } from "pdf-parse";

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Create parser with options
    const pdfParser = new PDFParse({
      data: buffer,
      verbosity: VerbosityLevel.ERRORS,
    });
    
    // Extract text from all pages
    const result = await pdfParser.getText();
    
    // Clean up
    await pdfParser.destroy();
    
    return result.text.trim();
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from PDF. Please ensure the file is a valid PDF with readable text.");
  }
}

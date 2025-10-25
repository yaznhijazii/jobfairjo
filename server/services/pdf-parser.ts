// Wrapper for pdf-parse to handle CommonJS/ESM compatibility
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

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
    const data: PDFData = await pdfParse(buffer);
    return data.text.trim();
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from PDF. Please ensure the file is a valid PDF with readable text.");
  }
}

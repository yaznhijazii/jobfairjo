/**
 * PDF Parser using LlamaParse Cloud API v2
 * Uses Node.js 22 built-in globals: fetch, FormData, File
 */

const LLAMA_API_KEY = process.env.LLAMA_CLOUD_API_KEY;
const BASE = "https://api.cloud.llamaindex.ai";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function extractTextFromDocument(buffer: Buffer, mimetype: string, originalName: string): Promise<string> {
  try {
    // ── Step 1: Upload ──────────────────────────────────────────────────────────
    console.log("--- LlamaParse Start ---");
    if (!LLAMA_API_KEY) {
      throw new Error("LLAMA_CLOUD_API_KEY is missing!");
    }
    
    // Ensure we have a valid mimetype for the blob, fallback to common ones if needed
    const blobMime = mimetype === "application/octet-stream" ? "application/pdf" : mimetype;
    const blob = new Blob([buffer], { type: blobMime });
    const form = new FormData();
    form.append("upload_file", blob, originalName || "cv.pdf");

    console.log(`[1/3] Uploading document: ${originalName} (${buffer.length} bytes, ${blobMime})...`);

  const upRes = await fetch(`${BASE}/api/v1/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${LLAMA_API_KEY}` },
    body: form,
  });

  const upText = await upRes.text();
  console.log(`[1/3] Upload status: ${upRes.status} → ${upText.slice(0, 200)}`);

  if (!upRes.ok) {
    throw new Error(`Upload failed (${upRes.status}): ${upText}`);
  }

  const { id: fileId } = JSON.parse(upText) as { id: string };
  console.log(`[1/3] file_id: ${fileId}`);

  // ── Step 2: Create parse job ────────────────────────────────────────────────
  console.log("[2/3] Creating parse job...");

  const jobRes = await fetch(`${BASE}/api/v2/parse`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LLAMA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file_id: fileId, tier: "fast", version: "latest" }),
  });

  const jobText = await jobRes.text();
  console.log(`[2/3] Job status: ${jobRes.status} → ${jobText.slice(0, 200)}`);

  if (!jobRes.ok) {
    throw new Error(`Job creation failed (${jobRes.status}): ${jobText}`);
  }

  const jobJson = JSON.parse(jobText) as { job?: { id: string }; id?: string };
  const jobId = jobJson.job?.id || jobJson.id;
  if (!jobId) throw new Error(`No job_id in: ${jobText}`);
  console.log(`[2/3] job_id: ${jobId}`);

  // ── Step 3: Poll until COMPLETED ───────────────────────────────────────────
  console.log("[3/3] Polling for result...");

    for (let i = 1; i <= 25; i++) { // Slightly reduced iterations to ensure we finish within 60s
      console.log(`[3/3] Poll ${i}/25: Waiting 2s...`);
      await sleep(2000);

      const pollRes = await fetch(
        `${BASE}/api/v2/parse/${jobId}?expand=markdown_full`,
        { headers: { Authorization: `Bearer ${LLAMA_API_KEY}` } }
      );

      if (!pollRes.ok) {
        console.warn(`[3/3] Poll ${i} failed (${pollRes.status})`);
        continue;
      }

      const pollText = await pollRes.text();
      let pollJson;
      try {
        pollJson = JSON.parse(pollText);
      } catch (e) {
        console.error(`[3/3] Failed to parse poll response: ${pollText.slice(0, 100)}`);
        continue;
      }

      const status = pollJson.job?.status || "UNKNOWN";
      console.log(`[3/3] Poll ${i}: ${status}`);

      if (status === "COMPLETED") {
        const text = (pollJson.markdown_full || "").trim();
        if (!text) throw new Error("COMPLETED but no markdown_full in response.");
        console.log(`--- SUCCESS: ${text.length} characters extracted ---`);
        return text;
      }

      if (status === "FAILED" || status === "CANCELLED") {
        throw new Error(`Job ended with status: ${status}. Response: ${pollText}`);
      }
    }

    throw new Error("PDF parsing timed out. Please try again with a smaller file or a different CV.");
  } catch (error) {
    console.error("CRITICAL ERROR in extractTextFromPDF:", error);
    throw error;
  }
}

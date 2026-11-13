const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load from .env.local if not already in environment
const envLocalPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment or .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const exePath = path.join(__dirname, "..", "public", "downloads", "NseiSukulHubSetup.exe");
  if (!fs.existsSync(exePath)) {
    console.error("Installer file does not exist at:", exePath);
    process.exit(1);
  }

  const BUCKET_NAME = "hub-releases";

  // 1. Ensure bucket exists and is public
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Error listing buckets:", listError);
  }

  const bucketExists = buckets && buckets.some((b) => b.name === BUCKET_NAME);
  if (!bucketExists) {
    console.log(`Creating public bucket '${BUCKET_NAME}'...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
    if (createError) {
      console.error("Error creating bucket:", createError);
      process.exit(1);
    }
  }

  // 2. Upload NseiSukulHubSetup.exe
  console.log("Uploading NseiSukulHubSetup.exe to Supabase Storage...");
  const fileBuffer = fs.readFileSync(exePath);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload("NseiSukulHubSetup.exe", fileBuffer, {
      contentType: "application/vnd.microsoft.portable-executable",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload failed:", uploadError);
    process.exit(1);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl("NseiSukulHubSetup.exe");

  console.log("\nInstaller uploaded successfully!");
  console.log("Direct Public CDN URL:", publicUrlData.publicUrl);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

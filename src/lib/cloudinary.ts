/**
 * Cloudinary unsigned upload (free tier, no Firebase Storage needed).
 * Setup:
 *  1. Create free account at https://cloudinary.com
 *  2. Dashboard → note your Cloud name
 *  3. Settings → Upload → Upload presets → Add (Signing Mode: Unsigned, Folder: gucair-evidence)
 *  4. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local
 */
export async function uploadToCloudinary(file: File, folder = "gucair/evidence"): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) {
    throw new Error("Cloudinary not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
  }
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);
  form.append("folder", folder); // e.g. 'gucair/logos' or 'gucair/evidence'
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);
  const data = await res.json();
  return data.secure_url as string;
}

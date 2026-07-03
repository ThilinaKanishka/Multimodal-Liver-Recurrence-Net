export async function getGravatarUrl(email: string, size: number = 200, fallbackName: string = 'U'): Promise<string> {
  const fallback = `https://ui-avatars.com/api/?name=${fallbackName}&background=0D8B93&color=fff&size=${size}`;
  if (!email) return fallback;
  // unavatar fetches from Google, Gravatar, etc. We must encode the fallback URL!
  return `https://unavatar.io/${email.trim().toLowerCase()}?fallback=${encodeURIComponent(fallback)}`;
}

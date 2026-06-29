/**
 * sessionStorage-backed handoff for the AI generate -> create flow.
 *
 * Redux holds the generated draft for the immediate client navigation, but it
 * is in-memory only, so a refresh on /post/create would lose everything. We
 * also persist the draft here so the create page can recover it after a
 * refresh. It's scoped to the tab (sessionStorage) and cleared once the post
 * is published or the user cancels.
 */
export interface GeneratedDraft {
  title: string;
  content: string;
  slug: string;
  image: string | ArrayBuffer | null;
  tags: string[];
}

const DRAFT_KEY = "bloggpt:generatedDraft";

export function saveGeneratedDraft(draft: GeneratedDraft): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // sessionStorage unavailable or over quota — non-fatal; Redux still carries
    // the draft for the immediate navigation.
  }
}

export function loadGeneratedDraft(): GeneratedDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as GeneratedDraft) : null;
  } catch {
    return null;
  }
}

export function clearGeneratedDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

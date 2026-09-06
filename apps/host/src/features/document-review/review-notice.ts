export interface ReviewNotice {
  title: string;
  description: string;
}

export function readReviewNotice(state: unknown): ReviewNotice | undefined {
  if (typeof state !== 'object' || state === null || !('reviewNotice' in state)) return;
  const notice = state.reviewNotice;
  if (
    typeof notice !== 'object' ||
    notice === null ||
    !('title' in notice) ||
    !('description' in notice)
  )
    return;
  if (typeof notice.title === 'string' && typeof notice.description === 'string')
    return { title: notice.title, description: notice.description };
}

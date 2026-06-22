import type { ReviewState } from '@teacher-exam/types';

export const REVIEW_INTERVAL_DAYS = [1, 2, 4, 7, 15, 30] as const;

export function nextReviewDate(from: Date, intervalIndex: number): Date {
    const days = REVIEW_INTERVAL_DAYS[Math.min(Math.max(intervalIndex, 0), REVIEW_INTERVAL_DAYS.length - 1)];
    const next = new Date(from);
    next.setDate(next.getDate() + days);
    return next;
}

export function advanceReview(previous: ReviewState | null, reviewedAt: Date): ReviewState['priority'] {
    if (!previous) {
        return 'P1';
    }

    return previous.priority === 'P0' ? 'P1' : previous.priority;
}

export function isReviewDue(review: ReviewState, now: Date): boolean {
    return new Date(review.nextReviewAt).getTime() <= now.getTime();
}

export function markDueReviews(reviews: ReviewState[], now: Date): ReviewState[] {
    return reviews.map((review) => ({
        ...review,
        priority: isReviewDue(review, now) ? 'P0' : review.priority
    }));
}

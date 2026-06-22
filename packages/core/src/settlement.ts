import type {
    ActionType,
    ComprehensivePayload,
    ObjectivePayload,
    RecitePayload,
    SettlementPayload
} from '@teacher-exam/types';

export interface SettlementResult {
    actionType: ActionType;
    durationMinutes: number;
    score: number;
    mastery: number;
    payload: SettlementPayload;
}

export function settleObjective(payload: ObjectivePayload, durationMinutes = 30): SettlementResult {
    if (payload.totalCount <= 0) {
        throw new Error('totalCount must be greater than 0');
    }

    if (payload.wrongCount < 0 || payload.wrongCount > payload.totalCount) {
        throw new Error('wrongCount must be between 0 and totalCount');
    }

    const score = (payload.totalCount - payload.wrongCount) / payload.totalCount;

    return {
        actionType: 'objective',
        durationMinutes,
        score,
        mastery: score,
        payload
    };
}

export function settleRecite(payload: RecitePayload, durationMinutes = 20): SettlementResult {
    const mastery = payload.mastery / 100;

    return {
        actionType: 'recite',
        durationMinutes,
        score: mastery,
        mastery,
        payload
    };
}

export function settleComprehensive(payload: ComprehensivePayload): SettlementResult {
    const durationMinutes = Math.max(payload.durationMinutes, 0);
    const score = payload.scorePoints == null ? 0 : Math.max(payload.scorePoints, 0);

    return {
        actionType: 'comprehensive',
        durationMinutes,
        score,
        mastery: score > 0 ? Math.min(score / 100, 1) : 0,
        payload
    };
}

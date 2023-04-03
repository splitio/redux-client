export declare function splitReady(): {
    type: string;
    payload: {
        timestamp: number;
    };
};
export declare function splitReadyWithEvaluations(key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig): {
    type: string;
    payload: {
        timestamp: number;
        key: string;
        treatments: import("@splitsoftware/splitio/types/splitio").TreatmentsWithConfig;
    };
};
export declare function splitReadyFromCache(): {
    type: string;
    payload: {
        timestamp: number;
    };
};
export declare function splitReadyFromCacheWithEvaluations(key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig): {
    type: string;
    payload: {
        timestamp: number;
        key: string;
        treatments: import("@splitsoftware/splitio/types/splitio").TreatmentsWithConfig;
    };
};
export declare function splitUpdate(): {
    type: string;
    payload: {
        timestamp: number;
    };
};
export declare function splitUpdateWithEvaluations(key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig): {
    type: string;
    payload: {
        timestamp: number;
        key: string;
        treatments: import("@splitsoftware/splitio/types/splitio").TreatmentsWithConfig;
    };
};
export declare function splitTimedout(): {
    type: string;
    payload: {
        timestamp: number;
    };
};
export declare function splitDestroy(): {
    type: string;
    payload: {
        timestamp: number;
    };
};
export declare function addTreatments(key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig): {
    type: string;
    payload: {
        key: string;
        treatments: import("@splitsoftware/splitio/types/splitio").TreatmentsWithConfig;
    };
};

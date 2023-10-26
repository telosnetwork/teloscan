/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Mocking FeedbackStore -----------------------------------
// auxiliary tracing functions
export const createTraceFunction = (store_name: string) => function(action: string, ...args: unknown[]) {
    if (trace) {
        const titlecase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
        const eventName = `${titlecase(store_name)}.${action}()`;
        console.debug(eventName, [...args]);
    }
};


// only if we are NOT in production mode search in the url for the trace flag
// to turn on the Antelope trace mode
let trace = false;
if (process.env.NODE_ENV !== 'production') {
    const urlParams = new URLSearchParams(window.location.search);
    trace = urlParams.get('trace') === 'true';
}
export const isTracingAll = () => trace;
export const createInitFunction = () => function() {
    // dummie function
};

const FeedBackStoreMock = {
    loading: [] as string[],
    unsetLoading(key: string) {
        this.loading = this.loading.filter((k: string) => k !== key);
    },
    setLoading(key: string) {
        this.loading.push(key);
    },
    setDebug(name: string, value: boolean) {
        // dummie function
    },
};

export const useFeedbackStore = () => FeedBackStoreMock;

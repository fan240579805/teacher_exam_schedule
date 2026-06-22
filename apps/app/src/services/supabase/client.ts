const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isMockMode = !supabaseUrl || !supabaseAnonKey || import.meta.env.VITE_USE_MOCK === 'true';

export interface SupabaseRequestOptions {
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: string | Record<string, unknown> | ArrayBuffer;
    accessToken?: string;
}

export function requestSupabase<T>(options: SupabaseRequestOptions): Promise<T> {
    if (isMockMode) {
        return Promise.reject(new Error('Supabase mock mode is enabled. Use local mock services.'));
    }

    return new Promise((resolve, reject) => {
        uni.request({
            url: `${supabaseUrl}${options.path}`,
            method: options.method ?? 'GET',
            data: options.data,
            header: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${options.accessToken ?? supabaseAnonKey}`,
                'Content-Type': 'application/json'
            },
            success: (response) => {
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    resolve(response.data as T);
                    return;
                }

                reject(response.data);
            },
            fail: reject
        });
    });
}

export function uploadSupabaseFile(options: {
    bucket: string;
    path: string;
    filePath: string;
    accessToken?: string;
}): Promise<unknown> {
    if (isMockMode) {
        return Promise.resolve({ path: `mock://${options.bucket}/${options.path}` });
    }

    return new Promise((resolve, reject) => {
        uni.uploadFile({
            url: `${supabaseUrl}/storage/v1/object/${options.bucket}/${options.path}`,
            filePath: options.filePath,
            name: 'file',
            header: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${options.accessToken ?? supabaseAnonKey}`
            },
            success: resolve,
            fail: reject
        });
    });
}

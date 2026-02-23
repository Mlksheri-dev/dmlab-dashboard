export async function apiFetch(path: string, options: RequestInit = {}) {
    const defaultOptions: RequestInit = {
        headers: {
            "Content-Type": "application/json",
        },
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        // PRODUCTION SERVER: lab-systems-monitoring-server-kt3b.onrender.com
        const baseUrl = "https://lab-systems-monitoring-server-kt3b.onrender.com/api";
        const res = await fetch(
            `${baseUrl}${path}`,
            finalOptions
        );

        if (!res.ok) {
            console.error(`API Error: ${res.status} ${res.statusText} for ${path}`);
            throw new Error(`API error ${res.status}`);
        }

        return await res.json();
    } catch (error) {
        console.error("API Fetch Failure", error);
        throw error;
    }
}

import Constants from 'expo-constants';

const cleanUrl = (value: string) => value.replace(/\/$/, '');

const extractHostFromCandidate = (candidate?: string | null): string | null => {
	if (!candidate) return null;
	const sanitized = candidate
		.replace(/^exp:\/\//, '')
		.replace(/^https?:\/\//, '')
		.replace(/^ws:\/\//, '')
		.replace(/^wss:\/\//, '');
	const hostSegment = sanitized.split(':')[0];
	if (!hostSegment) return null;
	const trimmed = hostSegment.trim();
	if (!trimmed) return null;
	return trimmed;
};

const deriveLanUrl = (): string | null => {
	const candidates = [
		Constants?.expoConfig?.hostUri,
		Constants?.manifest?.hostUri,
		Constants?.manifest?.debuggerHost,
		(Constants as any)?.manifest2?.debuggerHost,
		Constants?.expoConfig?.extra?.expoGo?.hostUri
	];
	for (const candidate of candidates) {
		const host = extractHostFromCandidate(candidate);
		if (host) {
			return `http://${host}:8000`;
		}
	}
	return null;
};

const deriveBrowserUrl = (): string | null => {
	try {
		const hostname = globalThis?.location?.hostname;
		if (!hostname) return null;
		return `http://${hostname}:8000`;
	} catch (error) {
		return null;
	}
};

const resolveEnvUrl = (): string | null => {
	const candidates = [
		process.env.EXPO_PUBLIC_API_BASE_URL,
		process.env.EXPO_PUBLIC_API_URL,
		Constants?.expoConfig?.extra?.apiBaseUrl,
		Constants?.expoConfig?.extra?.api?.baseUrl,
		Constants?.expoConfig?.extra?.API_BASE_URL
	];
	for (const candidate of candidates) {
		if (typeof candidate === 'string' && candidate.trim().length > 0) {
			return candidate;
		}
	}
	return null;
};

const resolvedBase = resolveEnvUrl() ?? deriveLanUrl() ?? deriveBrowserUrl() ?? 'http://localhost:8000';

export const API_BASE_URL = cleanUrl(resolvedBase);

if (__DEV__) {
	console.info('[Planner] API_BASE_URL resolved to', API_BASE_URL);
}

export const AUTH_STORAGE_KEY = 'planner.auth@v1';

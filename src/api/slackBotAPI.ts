export const get = async <T>(baseUrl: string, endpoint: string) => {
	const res = await fetch(`${baseUrl}/${endpoint}`);
	return (await res.json()) as T;
};

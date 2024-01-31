export type JokeResponse = {
	error: boolean;
	category: string;
	type: string;
	setup?: string;
	delivery?: string;
	joke?: string;
	flags: {
		nsfw: boolean;
		religious: boolean;
		political: boolean;
		racist: boolean;
		sexist: boolean;
		explicit: boolean;
	};
	id: number;
	safe: string;
	lang: string;
};

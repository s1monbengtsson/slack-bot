import { User } from "../types/person.types";

export const get = async <T>(baseUrl: string, endpoint: string) => {
	const res = await fetch(`${baseUrl}/${endpoint}`);
	return (await res.json()) as T;
};

export const getUsers = async (): Promise<User[]> => {
	const res = await fetch("http:localhost:3000/users");
	return await res.json();
};

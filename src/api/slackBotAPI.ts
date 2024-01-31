import path from "path";
import { User } from "../types/person.types";
import * as fs from "fs";

export const get = async <T>(baseUrl: string, endpoint: string) => {
	const res = await fetch(`${baseUrl}/${endpoint}`);
	return (await res.json()) as T;
};

export const getUsers = async (): Promise<User[]> => {
	return new Promise((resolve, reject) => {
		const filePath = path.join(__dirname, "../../users.json");
		fs.readFile(filePath, "utf8", (err, data) => {
			if (err) {
				reject(err);
			} else {
				try {
					const jsonData = JSON.parse(data);
					resolve(jsonData.users);
				} catch (parseError) {
					reject(parseError);
				}
			}
		});
	});
};

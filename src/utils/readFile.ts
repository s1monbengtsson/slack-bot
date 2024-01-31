import * as fs from "fs";
import path from "path";
import { User } from "../types/person.types";

export const readFile = async (filePath: string): Promise<User[]> => {
	const filePathModified = path.join(__dirname, filePath);
	return new Promise((resolve, reject) => {
		fs.readFile(filePathModified, "utf8", (err, data) => {
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

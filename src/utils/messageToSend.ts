import { MessageType } from "../enums/enums";
import { User } from "../types/person.types";

export function messageToSend(
	messageType: MessageType,
	user?: User,
	joke: string = ""
) {
	switch (messageType) {
		case "happyBirthday":
			return `Happy birthday ${user?.name} 😎 \n${joke}`;

		case "beer":
			return "It's time for beer! 🍻";

		case "errorHappyBirthday":
			return `Could not send birthday greeting to ${user?.name}`;

		case "errorBeer":
			return "Could not send beer time message";

		default:
			return "Could not send message. Error unknown";
	}
}

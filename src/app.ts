import {
	DAY_OF_BEER,
	HOUR_OF_BEER_NOTIFICATION,
	HOUR_OF_BIRTHDAY_NOTIFICATION,
	TIMER_DURATION,
} from "./constants";
import { App } from "@slack/bolt";
import { config } from "dotenv";
import { User } from "./types/person.types";
import { get } from "./api/slackBotAPI";
import { MessageType, SlackChannel } from "./enums/enums";
import { messageToSend } from "./utils/messageToSend";
import { Joke } from "./types/joke.types";
import { Fact } from "./types/fact.types";
config();

const {
	SLACK_BOT_TOKEN,
	SLACK_SIGNING_SECRET,
	SLACK_APP_TOKEN,
	BASE_URL,
	JOKE_BASE_URL,
	JOKE_ENDPOINT,
	FACT_BASE_URL,
	FACT_ENDPOINT,
} = process.env;

//initilize app
const app = new App({
	token: SLACK_BOT_TOKEN,
	signingSecret: SLACK_SIGNING_SECRET,
	socketMode: true,
	appToken: SLACK_APP_TOKEN,
});

const todayFormatted = new Intl.DateTimeFormat("se-SE").format(
	new Date(Date.now())
);

let users: User[] = [];
let usersWithBirthdayToday: User[] = [];
let birthdayToday = false;
let previousDay = Number(
	new Intl.DateTimeFormat("se-SE", { day: "numeric" }).format(
		new Date(Date.now())
	)
);
let birthdayMessageIsSentToday = false;
let beerTimeMessageSent = false;

(async () => {
	await app.start();
	loop();
})();

// keeps the app up and running
function loop() {
	const hour = Number(
		new Intl.DateTimeFormat("se-SE", { hour: "numeric" }).format(
			new Date(Date.now())
		)
	);
	const today = Number(
		new Intl.DateTimeFormat("se-SE", { day: "numeric" }).format(
			new Date(Date.now())
		)
	);

	const weekdayNumber = new Date(Date.now()).getDay(); // monday = 1, tuesday = 2 etc..

	// executes every TIMER_DURATION minutes
	setTimeout(async () => {
		try {
			if (!BASE_URL) return;
			users = await get<User[]>(BASE_URL, "users");
			usersWithBirthdayToday = users?.filter(
				user => user.birthdate === todayFormatted
			);

			birthdayToday = !!usersWithBirthdayToday.length;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.log("error instance:", error.message);
			}
			console.error("error:", error);
		}

		if (previousDay !== today) {
			previousDay = today;
			birthdayMessageIsSentToday = false;
			beerTimeMessageSent = false;
		}

		if (
			!beerTimeMessageSent &&
			weekdayNumber === DAY_OF_BEER &&
			hour === HOUR_OF_BEER_NOTIFICATION
		) {
			sendTimeForBeerMessage();
			beerTimeMessageSent = true;
		}
		if (
			!birthdayMessageIsSentToday &&
			hour === HOUR_OF_BIRTHDAY_NOTIFICATION &&
			birthdayToday
		) {
			sendBirthdayGreeting();
			birthdayMessageIsSentToday = true;
		}

		console.log("still running");

		// keep the function running
		loop();
	}, TIMER_DURATION);
}

// listens and responds to slash commands
app.command("/fact-me", async ({ ack, respond }) => {
	try {
		if (!FACT_BASE_URL || !FACT_ENDPOINT) return;

		const randomFact = await get<Fact>(FACT_BASE_URL, FACT_ENDPOINT);
		await ack();
		await respond(
			randomFact ? randomFact.text : "Could not find a random fact.."
		);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error("errorInstance:", error.message);
		}
		console.error("error:", error);
	}
});

app.command("/joke", async ({ ack, respond }) => {
	try {
		if (!JOKE_BASE_URL || !JOKE_ENDPOINT) return;

		const joke = await get<Joke>(JOKE_BASE_URL, JOKE_ENDPOINT);
		await ack();

		const jokeFormatted =
			joke.type === "twopart"
				? `${joke.setup}.. ${joke.delivery}`
				: `${joke.joke}`;

		await respond(
			joke ? jokeFormatted : "I'm currenly out of jokes. Try me again!"
		);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error("errorInstance:", error.message);
		}
		console.error("error:", error);
	}
});

async function sendBirthdayGreeting() {
	if (!birthdayToday) {
		return;
	}

	usersWithBirthdayToday.map(async user => {
		try {
			if (!JOKE_BASE_URL || !JOKE_ENDPOINT) return;

			let joke = await get<Joke>(JOKE_BASE_URL, JOKE_ENDPOINT);

			if (!joke) return;

			const jokeFormatted =
				joke.type === "twopart"
					? `${joke.setup}.. ${joke.delivery}`
					: `${joke.joke}`;

			return await app.client.chat.postMessage({
				token: SLACK_BOT_TOKEN,
				channel: SlackChannel.general,
				text: messageToSend(MessageType.happyBirthday, user, jokeFormatted),
			});
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error("error:", error.message);
				return await app.client.chat.postMessage({
					token: SLACK_BOT_TOKEN,
					channel: SlackChannel.slackbotBugs,
					text: messageToSend(
						MessageType.errorHappyBirthday,
						user,
						error.message
					),
				});
			}
			console.error("error:", error);
			return await app.client.chat.postMessage({
				token: SLACK_BOT_TOKEN,
				channel: SlackChannel.slackbotBugs,
				text: messageToSend(MessageType.errorHappyBirthday, user),
			});
		}
	});
}

async function sendTimeForBeerMessage() {
	try {
		return await app.client.chat.postMessage({
			token: SLACK_BOT_TOKEN,
			channel: SlackChannel.general,
			text: messageToSend(MessageType.beer),
		});
	} catch (error: unknown) {
		console.error("error:", error);
		return await app.client.chat.postMessage({
			token: SLACK_BOT_TOKEN,
			channel: SlackChannel.slackbotBugs,
			text: messageToSend(MessageType.errorBeer),
		});
	}
}

// kolla efter best practices för node app
// Implementera SRP i repot

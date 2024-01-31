import {
	DAY_OF_BEER,
	FILE_PATH,
	HOUR_OF_BEER_NOTIFICATION,
	HOUR_OF_BIRTHDAY_NOTIFICATION,
	TIMER_DURATION,
} from "./constants/constants";
import { App } from "@slack/bolt";
import { config } from "dotenv";
import { User } from "./types/person.types";
import { get } from "./api/slackBotAPI";
import { messageToSend } from "./utils/messageToSend";
import { JokeResponse } from "./types/joke.types";
import { Fact } from "./types/fact.types";
config();
import express, { Request, Response } from "express";
import { readFile } from "./utils/readFile";
import { SlackChannel } from "./enums/SlackChannel";
import { MessageType } from "./enums/MessageType";

const {
	PORT,
	SLACK_BOT_TOKEN,
	SLACK_SIGNING_SECRET,
	SLACK_APP_TOKEN,
	JOKE_BASE_URL,
	JOKE_ENDPOINT,
	FACT_BASE_URL,
	FACT_ENDPOINT,
} = process.env;

// set up and start express server (solely for deployment purposes)
const app = express();
const port = PORT || 10000;

app.get("/", (req: Request, res: Response) => {
	res.send({
		success: "true",
		usage: [
			{
				slackCommand: "/fact-me",
				description: "Replies with a random fact",
			},
			{
				slackCommand: "/joke",
				description: "Replies with a joke",
			},
		],
	});
});

app.listen(port, () => {
	console.log(`App started listening on port: ${port}`);
});

//initilize app
const slackApp = new App({
	token: SLACK_BOT_TOKEN,
	signingSecret: SLACK_SIGNING_SECRET,
	socketMode: true,
	appToken: SLACK_APP_TOKEN,
});

const todayFormatted = new Intl.DateTimeFormat("se-SE").format(
	new Date(Date.now())
);

// declare global variables
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

// start the slack app and get the loop running
(async () => {
	await slackApp.start();
	loop();
})();

// keeps the app up and running
function loop() {
	const currentHour = Number(
		new Intl.DateTimeFormat("se-SE", {
			hour: "numeric",
			timeZone: "Europe/Stockholm",
		}).format(new Date(Date.now()))
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
			// extract the users from the json file
			users = await readFile(FILE_PATH);
			console.log("users:", users);
			usersWithBirthdayToday = users?.filter(
				user => user.birthdate === todayFormatted
			);

			// check if some one has their birthday today
			birthdayToday = !!usersWithBirthdayToday.length;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.log("error instance:", error.message);
			}
		}

		// conditionals to decide on which actions will be taken
		if (previousDay !== today) {
			previousDay = today;
			birthdayMessageIsSentToday = false;
			beerTimeMessageSent = false;
		}

		if (
			!beerTimeMessageSent &&
			weekdayNumber === DAY_OF_BEER &&
			currentHour === HOUR_OF_BEER_NOTIFICATION
		) {
			sendTimeForBeerMessage();
			beerTimeMessageSent = true;
		}
		if (
			!birthdayMessageIsSentToday &&
			currentHour === HOUR_OF_BIRTHDAY_NOTIFICATION &&
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

// listens and responds to slash commands in slack
slackApp.command("/fact-me", async ({ ack, respond }) => {
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

slackApp.command("/joke", async ({ ack, respond }) => {
	try {
		if (!JOKE_BASE_URL || !JOKE_ENDPOINT) return;

		const jokeResponse = await get<JokeResponse>(JOKE_BASE_URL, JOKE_ENDPOINT);
		await ack();

		const jokeFormatted =
			jokeResponse.type === "twopart"
				? `${jokeResponse.setup}.. ${jokeResponse.delivery}`
				: `${jokeResponse.joke}`;

		await respond(
			jokeResponse ? jokeFormatted : "I'm currenly out of jokes. Try me again!"
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

			let joke = await get<JokeResponse>(JOKE_BASE_URL, JOKE_ENDPOINT);

			if (!joke) return;

			const jokeFormatted =
				joke.type === "twopart"
					? `${joke.setup}.. ${joke.delivery}`
					: `${joke.joke}`;

			return await slackApp.client.chat.postMessage({
				token: SLACK_BOT_TOKEN,
				channel: SlackChannel.general,
				text: messageToSend(MessageType.happyBirthday, user, jokeFormatted),
			});
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error("error:", error.message);
				return await slackApp.client.chat.postMessage({
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
			return await slackApp.client.chat.postMessage({
				token: SLACK_BOT_TOKEN,
				channel: SlackChannel.slackbotBugs,
				text: messageToSend(MessageType.errorHappyBirthday, user),
			});
		}
	});
}

async function sendTimeForBeerMessage() {
	try {
		return await slackApp.client.chat.postMessage({
			token: SLACK_BOT_TOKEN,
			channel: SlackChannel.general,
			text: messageToSend(MessageType.beer),
		});
	} catch (error: unknown) {
		console.error("error:", error);
		return await slackApp.client.chat.postMessage({
			token: SLACK_BOT_TOKEN,
			channel: SlackChannel.slackbotBugs,
			text: messageToSend(MessageType.errorBeer),
		});
	}
}

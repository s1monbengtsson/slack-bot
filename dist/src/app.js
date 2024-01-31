"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const bolt_1 = require("@slack/bolt");
const dotenv_1 = require("dotenv");
const slackBotAPI_1 = require("./api/slackBotAPI");
const enums_1 = require("./enums/enums");
const messageToSend_1 = require("./utils/messageToSend");
(0, dotenv_1.config)();
const express_1 = __importDefault(require("express"));
const { PORT, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN, JOKE_BASE_URL, JOKE_ENDPOINT, FACT_BASE_URL, FACT_ENDPOINT, } = process.env;
const app = (0, express_1.default)();
const port = PORT || 10000;
app.get("/", (req, res) => {
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
const slackApp = new bolt_1.App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: SLACK_APP_TOKEN,
});
const todayFormatted = new Intl.DateTimeFormat("se-SE").format(new Date(Date.now()));
let users = [];
let usersWithBirthdayToday = [];
let birthdayToday = false;
let previousDay = Number(new Intl.DateTimeFormat("se-SE", { day: "numeric" }).format(new Date(Date.now())));
let birthdayMessageIsSentToday = false;
let beerTimeMessageSent = false;
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield slackApp.start();
    loop();
}))();
// keeps the app up and running
function loop() {
    const hour = Number(new Intl.DateTimeFormat("se-SE", { hour: "numeric" }).format(new Date(Date.now())));
    const today = Number(new Intl.DateTimeFormat("se-SE", { day: "numeric" }).format(new Date(Date.now())));
    const weekdayNumber = new Date(Date.now()).getDay(); // monday = 1, tuesday = 2 etc..
    // executes every TIMER_DURATION minutes
    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
        console.log("hbds today:", usersWithBirthdayToday);
        try {
            users = yield (0, slackBotAPI_1.getUsers)();
            console.log("users:", users);
            usersWithBirthdayToday = users === null || users === void 0 ? void 0 : users.filter(user => user.birthdate === todayFormatted);
            birthdayToday = !!usersWithBirthdayToday.length;
        }
        catch (error) {
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
        if (!beerTimeMessageSent &&
            weekdayNumber === constants_1.DAY_OF_BEER &&
            hour === constants_1.HOUR_OF_BEER_NOTIFICATION) {
            sendTimeForBeerMessage();
            beerTimeMessageSent = true;
        }
        if (!birthdayMessageIsSentToday &&
            hour === constants_1.HOUR_OF_BIRTHDAY_NOTIFICATION &&
            birthdayToday) {
            sendBirthdayGreeting();
            birthdayMessageIsSentToday = true;
        }
        console.log("still running");
        // keep the function running
        loop();
    }), constants_1.TIMER_DURATION);
}
// listens and responds to slash commands
slackApp.command("/fact-me", ({ ack, respond }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!FACT_BASE_URL || !FACT_ENDPOINT)
            return;
        const randomFact = yield (0, slackBotAPI_1.get)(FACT_BASE_URL, FACT_ENDPOINT);
        yield ack();
        yield respond(randomFact ? randomFact.text : "Could not find a random fact..");
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("errorInstance:", error.message);
        }
        console.error("error:", error);
    }
}));
slackApp.command("/joke", ({ ack, respond }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!JOKE_BASE_URL || !JOKE_ENDPOINT)
            return;
        const joke = yield (0, slackBotAPI_1.get)(JOKE_BASE_URL, JOKE_ENDPOINT);
        yield ack();
        const jokeFormatted = joke.type === "twopart"
            ? `${joke.setup}.. ${joke.delivery}`
            : `${joke.joke}`;
        yield respond(joke ? jokeFormatted : "I'm currenly out of jokes. Try me again!");
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("errorInstance:", error.message);
        }
        console.error("error:", error);
    }
}));
function sendBirthdayGreeting() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!birthdayToday) {
            return;
        }
        usersWithBirthdayToday.map((user) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!JOKE_BASE_URL || !JOKE_ENDPOINT)
                    return;
                let joke = yield (0, slackBotAPI_1.get)(JOKE_BASE_URL, JOKE_ENDPOINT);
                if (!joke)
                    return;
                const jokeFormatted = joke.type === "twopart"
                    ? `${joke.setup}.. ${joke.delivery}`
                    : `${joke.joke}`;
                return yield slackApp.client.chat.postMessage({
                    token: SLACK_BOT_TOKEN,
                    channel: enums_1.SlackChannel.general,
                    text: (0, messageToSend_1.messageToSend)(enums_1.MessageType.happyBirthday, user, jokeFormatted),
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("error:", error.message);
                    return yield slackApp.client.chat.postMessage({
                        token: SLACK_BOT_TOKEN,
                        channel: enums_1.SlackChannel.slackbotBugs,
                        text: (0, messageToSend_1.messageToSend)(enums_1.MessageType.errorHappyBirthday, user, error.message),
                    });
                }
                console.error("error:", error);
                return yield slackApp.client.chat.postMessage({
                    token: SLACK_BOT_TOKEN,
                    channel: enums_1.SlackChannel.slackbotBugs,
                    text: (0, messageToSend_1.messageToSend)(enums_1.MessageType.errorHappyBirthday, user),
                });
            }
        }));
    });
}
function sendTimeForBeerMessage() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield slackApp.client.chat.postMessage({
                token: SLACK_BOT_TOKEN,
                channel: enums_1.SlackChannel.general,
                text: (0, messageToSend_1.messageToSend)(enums_1.MessageType.beer),
            });
        }
        catch (error) {
            console.error("error:", error);
            return yield slackApp.client.chat.postMessage({
                token: SLACK_BOT_TOKEN,
                channel: enums_1.SlackChannel.slackbotBugs,
                text: (0, messageToSend_1.messageToSend)(enums_1.MessageType.errorBeer),
            });
        }
    });
}
// kolla efter best practices för node app
// Implementera SRP i repot
//# sourceMappingURL=app.js.map
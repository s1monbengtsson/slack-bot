"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageToSend = void 0;
function messageToSend(messageType, user, joke = "") {
    switch (messageType) {
        case "happyBirthday":
            return `Happy birthday ${user === null || user === void 0 ? void 0 : user.name} 😎 \n${joke}`;
        case "beer":
            return "It's time for beer! 🍻";
        case "errorHappyBirthday":
            return `Could not send birthday greeting to ${user === null || user === void 0 ? void 0 : user.name}`;
        case "errorBeer":
            return "Could not send beer time message";
        default:
            return "Could not send message. Error unknown";
    }
}
exports.messageToSend = messageToSend;
//# sourceMappingURL=messageToSend.js.map
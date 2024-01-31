# Slackbot

## Features

1. Keeps track of all colleagues birthdays, and sends a nice greeting on the special day
2. Tells the team when it's beer time on fridays
3. Listens to commands:
   - `/fact-me` - Replies with a random fact
   - `/joke` - Replies with a joke

## Tools

**Required**

- Node.js
- NVM `18.18.2`

## Getting started

1. Ensure requirements listed above are fulfilled
2. Run `npm run dev`

## Structure

```
└── src
    └── api (everything related to communicating with an api)
        └── ...
    └── app.ts (core logic)
    └── constants (non-changing variables. All constants can be stored in a single file)
        └── ...
    └── enums (each enum has its own file)
        └── ...
    └── types (each type has its own file)
        └── ...
    └── utils (general, re-usable functions)
        └── ...
└── users.json (data source)
```

## Deploy

Pushes to main will be automatically deployed to production

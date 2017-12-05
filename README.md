# kaabo

Kaabo is a *work in progress* side-project I'm using to teach myself React and Node. This repo only contains the back-end for the project and is nowhere near usable.

The project consists of 3 pillars: this back-end, a react front-end and a contentful.com space with the data.
The react-front-end is shown on a kiosk-device, which fetches the content from the contentful cms. Contentful will probably be stripped out in a later stage.

## What Kaabo does

When a client enters the building they are presented a list of companies, they can then filter the companies and
find an employee to contact. This contact request is routed via the NodeJs back-end which sends a Facebook Messenger message to the employee and presents them with a set of buttons to indicate how long the client will have to wait. 

## Deploy to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Setup

- Create a Facebook Page
- Create a new app and add the `Messenger platform` at `developer.facebook.com`
    - ### Messenger
      - generate a token and enter this as the `PAGE_ACCESS_TOKEN` env
      - select `messages`, `messaging_postbacks`, `messaging_optins` as your webhook events
    - ### Webhooks
      - press `edit subscription` and enter a `verify token` (random string of your liking), you'll need to enter this token in the `VERIFY_TOKEN` env
      - deploy your app and enter the url of your new heroku app with `/webhook` at the end
- Open `{your-url}/enable-greeting` to enable the 'Get started' button and disable the composer screen for the bot. 
- `POST` to `{your-url}/notify` to send a notification (currently not implemented, unless you manually copy/paste your psid from the heroku logs to the `notify` method in `routes/index.js`)

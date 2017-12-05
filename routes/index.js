const express = require('express');
const router  = express.Router();
const request = require('request');


const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
      title: 'Onthaal',
      app_id: process.env.APP_ID,
      page_id: process.env.PAGE_ID,
      messenger_app_id: process.env.MESSENGER_APP_ID,
      ref: '1234',
  });
});

// router.options('/notify', (req, res, next) => {
//     next();
// });

/*
 * Builds message to send to employee via Facebook Messenger when visitor signs up at front desk
 *  
 */
router.post('/notify', (req, res, next) => {

    console.log('/notify post');
    console.log(req.body);
        
    let response = {
        text: `${req.body.name} staat je op te wachten aan het onthaal. Wanneer kan je er zijn?`,
        quick_replies: [
            {
                content_type: "text",
                title: "1 minuut",
                payload: "1 min"
            },
            {
                content_type: "text",
                title: "5 minuten",
                payload: "5"
            },
            {
                content_type: "text",
                title: "10 minuten",
                payload: "10"
            }, 
            {
                content_type: "text",
                title: "Niet aanwezig",
                payload: "niet"
            },
        ]
    };

    // Temporarily uses fixed PSID
    callSendAPI("1367522643370788", response);


    //
    res.sendStatus(200).send({ description: 'Message sent' });

});

router.post('/webhook', (req, res) => {
    const body = req.body;

    if( body.object == 'page') {
        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
        
        // Iterates over each entry - there may be multiple if batched
        console.log('entries:');

        body.entry.forEach(function(entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            
            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message && !webhook_event.message.quick_reply) {
                
                console.log('Received basic message from Facebook. AFAIK this should not be possible');
                handleMessage(sender_psid, webhook_event.message);        

            } else if (webhook_event.postback) {

                console.log('Received postback from Facebook');
                handlePostback(sender_psid, webhook_event.postback);

            } else if (webhook_event.message.quick_reply ) {
                
                console.log('Received quick reply from Facebook');

                if (!isNaN(webhook_event.message.quick_reply.payload) ) {
                    console.log(`Send message via socketio: Ik kom je ophalen binnen ${webhook_event.message.quick_reply.payload}.`);
                } else {
                    console.log(`Send message via socketio: Ik ben momenteel niet op kantoor, laat je nummer achter om een nieuwe afspraak te maken.`);
                }

                var response = { "text": "Alright, we geven het door aan xxx!" }
                callSendAPI("1367522643370788", response);
            }
        });

    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
});


////

// Adds support for GET requests to our webhook
router.get('/webhook', (req, res) => {
    
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = process.env.VERIFY_TOKEN;
        
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
        
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
      
        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
          
            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);      
        }
    }
    // } else {
    //     // Responds with '403 Forbidden' if verify tokens do not match
    //     res.sendStatus(403);      
    // }

});

/*
 * Adds button to Facebook Messenger that enabled a 'Get Started' button and adds a button for a user to register
 * 
 */
router.get('/enable-greeting', (req, res) => {
    // Send the HTTP request to the Messenger Platform

    let pageId = req.query['pageId'];

    let firstname = 'Fre';
    let lastname  = 'Vandeborne';
    let company   = 'Novation';

    request(
      {
        uri: `https://graph.facebook.com/v2.6/me/thread_settings?access_token=${PAGE_ACCESS_TOKEN}`,
        // "qs": { "access_token": PAGE_ACCESS_TOKEN },
        method: "POST",
        form: {
            "setting_type":"greeting",
            greeting: [
                {
                    locale: "default",
                    text: `Hello {{user_first_name}}, click 'get started' to link your Facebook account. According to our information you are ${firstname} ${lastname} and you work at ${company}.`
                },
                {
                    locale: "nl_BE",
                    text: `Hallo {{user_first_name}}, klik op de knop om je Facebook account te linken. Volgens onze informatie ben je ${firstname} ${lastname} en werk je voor ${company}.`
                }
            ]
        }
      },
      (err, response, body) => {
        console.log('added greeting');
      }
    );

    request({
            "uri": `https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`,
            // "qs": { "access_token": PAGE_ACCESS_TOKEN },
            "method": "POST",
            "form": {
                "get_started": {
                    "payload": "REGISTER_USER",
                },
                "persistent_menu": [{
                    "locale": "default",
                    "composer_input_disabled": true,
                    "call_to_actions": [{
                        "title": "Get account data",
                        "type": "postback",
                        "payload": "GET_ACCOUNT_DATA"
                    }, ]
                }]
            }
        }, (err, response, body) => {
            if (!err) {
                console.log('Added greeting!')
                res.status(200).send(body);
            } else {
                console.error('unable to add greeting', err);
                res.status(403).send('unable to add greeting', err);
            }
        })
        .on('error', function (err) {
            console.log(err);
        });
})


/*
 * Builds responses to basic messages
 */

function handleMessage(sender_psid, received_message) {
    let response;

    console.log('handleMessage', received_message.text);

    // Check if the message contains text
    // if (received_message.text) {    
        // Create the payload for a basic text message
        response = {
            "text": `Silly goose, you can't talk to me. I'm just a bot.`
        }

        
    // } else {
    //     response = {
    //         "text" : "Test"
    //     };
    // }
    
    // Sends the response message
    callSendAPI(sender_psid, response);   
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;
    
    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if(payload === "REGISTER_USER") {
        // Probeer de knop in orde te krijgen en een ref parameter mee te krijgen die uniek is, zodat we de gebruiker kunnen linken aan de contentful entry
        response = {
            "text": "Je gegevens werden opgeslagen. Vanaf nu krijg je een Facebook melding als iemand zich voor je aanmeldt aan de balie!"
        };
    } else {
        response = {
            "text": "Alright, we geven het door aan xxx!"
        };
    }

    // console.log('send feedback via socket');
    // app.socket.emit('feedback', 'Een boodschap voor de front-end');

    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  }


/*
 * Uses the Facebook Send API to send messages via Facebook Messenger
 */
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let message = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": message
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    }).on('response', function(response) {
        console.log(response.statusCode);
    })
    .on('error', function(err) {
        console.log(err);
    });
}


/////

module.exports = router;

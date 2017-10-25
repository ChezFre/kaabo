const express = require('express');
const router  = express.Router();
const request = require('request');


const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/webhook', (req, res) => {
    const body = req.body;

    console.log( body.entry );

    if( body.object == 'page') {
        // Iterates over each entry - there may be multiple if batched
        console.log('entries:');

        body.entry.forEach(function(entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);
            
            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message && !webhook_event.message.quick_reply) {
                handleMessage(sender_psid, webhook_event.message);        
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
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


// Handles messages events
function handleMessage(sender_psid, received_message) {
    let response;

    console.log('handleMessage', received_message.text);

    // Check if the message contains text
    if (received_message.text) {    
        // Create the payload for a basic text message
        // response = {
        //     "text": `You sent the message: "${received_message.text}". Now send me an image!`
        // }

        response = {
            "text": "xxx xxx staat je op te wachten aan het onthaal. Wanneer kan je er zijn?",
            "quick_replies":[
              {
                "content_type":"text",
                "title":"1 min",
                "payload":"1",
              },
              {
                "content_type":"text",
                "title":"5 min",
                "payload":"5",
              },
              {
                "content_type":"text",
                "title":"10 min",
                "payload":"10"
              },
              {
                "content_type":"text",
                "title":"niet aanwezig",
                "payload":"niet"
              }
            ]
          };

    } else {
        response = {
            "text" : "Test"
        };
    }
    
    // Sends the response message
    callSendAPI(sender_psid, response);   
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;
    
    // Get the payload for the postback
    let payload = received_postback.payload;

    if(payload === "REGISTER_USER") {
        response = {
            "text": "Je gegevens werden opgeslagen. Vanaf nu krijg je een Facebook melding als iemand zich aanmeldt aan de balie";
        }
    }
    
    // Set the response based on the postback payload
    if (payload === '10') {
      response = { "text": "Alright, we geven het door aan xxx!" }
    }

    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  }

// Sends response messages via the Send API
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

router.get('/enable-greeting', (req, res) => {
    // Send the HTTP request to the Messenger Platform

    let pageId = req.query['pageId'];

    console.log( pageId );

    request({
        "uri": `https://graph.facebook.com/v2.6/me/messenger_profile`,
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "form": { 
            "get_started": {
              "payload": "REGISTER_USER"
            }
          }
    }, (err, response, body) => {
        if (!err) {
            console.log('Added greeting!')
            res.status(200).send( body );
        } else {
            console.error('unable to add greeting', err);
            res.status(403).send('unable to add greeting', err);
        }
    }).on('response', function(response) {
        console.log(response.statusCode);
    })
    .on('error', function(err) {
        console.log(err);
    });
})

/////

module.exports = router;

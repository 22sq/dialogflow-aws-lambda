'use strict';

const { WebhookClient, Suggestion } = require('dialogflow-fulfillment');
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

var express = require('express');
const app = express();
const router = express.Router();

router.use(compression());
router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(awsServerlessExpressMiddleware.eventContext());

router.post('/', (request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log(
        'Dialogflow Request headers: ' + JSON.stringify(request.headers)
    );
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function welcome(agent) {
        agent.add(
            `Welcome to the athlete survey. Here comes your first question. `
        );
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    function thankyou(agent) {
        agent.add(`Thank you for your time. Have a nice day.`);
    }

    function endSession(agent) {
        agent.add(`Alright, maybe next time. Have a great day!`);
    }

    function questionOne(agent) {
        var contexts = JSON.stringify(
            request.body.queryResult.outputContexts[0].parameters
                .currentQuestion
        );
        console.log('contexts: ' + contexts);
        agent.add(
            `On a scale of 1 to 10 (from worst to best), how are you feeling today?`
        );
    }

    function questionTwo(agent) {
        var contexts = JSON.stringify(
            request.body.queryResult.outputContexts[0].parameters
                .currentQuestion
        );
        var questionOneResponse = JSON.stringify(
            request.body.queryResult.outputContexts[0].parameters
                .question1Response
        );
        console.log('contexts: ' + contexts);
        if (
            Number(questionOneResponse) > 0 &&
            Number(questionOneResponse) < 11
        ) {
            agent.add(`What is your general mood after the game?`);
        } else {
            agent.add(`Please enter a number between 1 and 10.`);
        }
    }

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('Question 1', questionOne);
    intentMap.set('Decline Survey', endSession);
    intentMap.set('Question 2', questionTwo);
    intentMap.set('End Survey', thankyou);
    agent.handleRequest(intentMap);
});

app.use('/', router);

module.exports = app;

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

    // Variable Declerations
    var questionNum = '';
    var myQuestion = '';
    var myResponseType = '';
    let questionObj = {
        question1: {
            question: `How would you rate your current stress level using a 1-5 scale (1 = not stressed at all and 5 = extremely stressed)`,
            expectedResponseType: `ratingResponse`,
        },
        question2: {
            question: `How stressed are you about school? 1 = not stressed at all and 5 = extremely stressed`,
            expectedResponseType: `ratingResponse`,
        },
        question3: {
            question: `How stressed are you about the upcoming game? 1 = not stressed at all and 5 = extremely stressed)`,
            expectedResponseType: `ratingResponse`,
        },
        question4: {
            question: `What is one thing you'd like for your coach to know about your stress level right now?`,
            expectedResponseType: `openendedResponse`,
        },
        question5: {
            question: `Pick any emoji that best represents how you are feeling at this moment.`,
            expectedResponseType: `emojiResponse`,
        },
    };

    // General Notifications
    function welcome(agent) {
        // questionNum =
        //     request.body.queryResult.outputContexts[0].parameters
        //         .currentQuestion;
        // myQuestion = questionObj['question' + questionNum].question;
        // myResponseType = questionObj.question1.expectedResponseType;
        // console.log('question num and txt: ' + questionNum + ': ' + myQuestion);
        // agent.setContext({
        //     name: myResponseType,
        //     lifespan: 1,
        //     parameters: { currentQuestion: questionNum },
        // });
        agent.add(
            `Welcome to the athlete survey. Here comes your first question. ` +
                selectQuestionHandler(agent)
        );
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
        agent.add(`Sorry, I didn't catch that.`);
    }

    // Question Handlers
    function selectQuestionHandler(agent) {
        if (questionNum == '' || questionNum == 1) {
            questionNum =
                request.body.queryResult.outputContexts[0].parameters
                    .currentQuestion;
        } else {
            questionNum++;
        }
        myQuestion = questionObj['question' + questionNum].question;
        myResponseType =
            questionObj['question' + questionNum].expectedResponseType;
        console.log('question num and txt: ' + questionNum + ': ' + myQuestion);
        agent.setContext({
            name: myResponseType,
            lifespan: 1,
            parameters: { currentQuestion: questionNum },
        });
        return questionObj['question' + questionNum].question;
    }

    // Response Handlers

    function emojiHandler(agent) {
        agent.add("I see you're using emoji response");
    }

    function yesnoHandler(agent) {
        agent.add('You answered ' + userChoice + '.');
    }

    function ratingHandler(agent) {
        var myRatingResponse = JSON.stringify(
            request.body.queryResult.outputContexts[0].parameters
                .myRatingResponse
        );
        console.log('my rating: ' + myRatingResponse);
        if (myRatingResponse < 1 && myRatingResponse > 5) {
            agent.add(
                `You entered ` +
                    myRatingResponse +
                    `. Please enter a number between 1 and 5.`
            );
        } else {
            agent.add(selectQuestionHandler(agent));
        }
    }

    function openEndedHandler(agent) {
        agent.add(`You answered with an open ended response.`);
    }

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('Emoji handling - Activity', emojiHandler);
    intentMap.set('Emoji handling - Animals & Nature', emojiHandler);
    intentMap.set('Emoji handling - Food & Drink', emojiHandler);
    intentMap.set('Emoji handling - Objects', emojiHandler);
    intentMap.set('Emoji handling - Smileys & People', emojiHandler);
    intentMap.set('Emoji handling - Symbols', emojiHandler);
    intentMap.set('Emoji handling - Travel & Places', emojiHandler);
    intentMap.set('Response handling - yesno', yesnoHandler);
    intentMap.set('Response handling - rating', ratingHandler);
    intentMap.set('Response handling - open ended', openEndedHandler);
    agent.handleRequest(intentMap);
});

app.use('/', router);

module.exports = app;

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

var http = require('http');
var https = require('https');
var queryString = require('querystring');

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
  try {
    console.log("event.session.application.applicationId=" + event.session.application.applicationId);

    /**
     * Uncomment this if statfement and populate with your skill's application ID to
     * prevent someone else from configuring a skill that sends requests to this function.
     */
    /*
     if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
     context.fail("Invalid Application ID");
     }
     */

    if (event.session.new) {
      onSessionStarted({requestId: event.request.requestId}, event.session);
    }

    if (event.request.type === "LaunchRequest") {
      onLaunch(event.request,
        event.session,
        function callback(sessionAttributes, speechletResponse) {
          context.succeed(buildResponse(sessionAttributes, speechletResponse));
        });
    } else if (event.request.type === "IntentRequest") {
      onIntent(event.request,
        event.session,
        function callback(sessionAttributes, speechletResponse) {
          context.succeed(buildResponse(sessionAttributes, speechletResponse));
        });
    } else if (event.request.type === "SessionEndedRequest") {
      onSessionEnded(event.request, event.session);
      context.succeed();
    }
  } catch (e) {
    context.fail("Exception: " + e);
  }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
  console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
    ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
  console.log("onLaunch requestId=" + launchRequest.requestId +
    ", sessionId=" + session.sessionId);

  // Dispatch to your skill's launch.
  getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
  console.log("onIntent requestId=" + intentRequest.requestId +
    ", sessionId=" + session.sessionId);

  var intent = intentRequest.intent,
    intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("iLatestNewsTitles" === intentName) {
        readLatestNewsTitles(intent, session, callback);
    } else if ('iReadLatestNewsArticle' === intentName) {
        readLatestNewsArticle(intent, session, callback);
    } else if ("iNewsTitlesOrg" === intentName) {
      getOrgNewsTC(intent, session, callback);
    } else if ( 'iOrgSentiment' === intentName ) {
      getOrganizationSentiment(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.StopIntent" === intentName || "AMAZON.CancelIntent" === intentName) {
        handleSessionEndRequest(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
  console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
    ", sessionId=" + session.sessionId);
  // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
  // If we wanted to initialize the session to have some attributes we could add those here.
  var sessionAttributes = {};
  var cardTitle = "Welcome";
  var speechOutput = "Welcome to Incognitech! What can I bring to you?";
  // If the user either does not reply to the welcome message or says something that is not
  // understood, they will be prompted again with this text.
  var repromptText = "You can ask me about anything. For example," +
    "What is latest on TechCrunch";
  var shouldEndSession = false;

  callback(sessionAttributes,
    buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
  var cardTitle = "Session Ended";
  var speechOutput = "Thanks for using Incognitech. Have a good day!";
  // Setting this to true ends the session and exits the skill.
  var shouldEndSession = true;

  callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function readLatestNewsArticle(intent, session, callback) {
  var cardTitle = "Read News Article From TechCrunch";
  var repromptText = "";
  var sessionAttributes = {};
  var shouldEndSession = true;
  var speechOutput = "";
  var articleIndex = intent.slots.index;

  console.log(articleIndex);

  var articles = '';

  if (session.attributes) {
    articles = session.attributes.latestNewsPosts;
  }

  if (articles === '') {
    speechOutput = "Please try again.";
  } else {
    var i = -1;
    switch(articleIndex.value) {
      case '1st':
      case 'first':
        i = 0;
        break;
      case '2nd':
      case 'second':
        i = 1;
        break;
      case '3rd':
      case 'third':
        i = 2;
        break;
      case '4th':
      case 'fourth':
        i = 3;
        break;
      case '5th':
      case 'fifth':
        i = 4;
        break;
    }

    if (i === -1) {
      // speechOutput = "Please try again.";
    } else {
      var post = articles[i];

      if (post.content) {
        speechOutput = post.title + '. ' + post.content;

        callback(sessionAttributes,
          buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      } else {
        https.get('https://techcrunch.com/wp-json/posts/'+(post.id), function(res) {
          console.log('statusCode:', res.statusCode);
          res.setEncoding('utf8');
          var body = '';
          res.on('data', function(data) {
            body += data;
          });

          res.on('end', function() {
            post = JSON.parse(body);

            var newtalk = '';
            for(var j=0; j<post.content.length;j++){
              if(post.content[j].type == 'paragraph') {
                newtalk = newtalk + post.content[j].text;
              }
            }
            speechOutput = post.title + '. ' + newtalk;

            callback(sessionAttributes,
              buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
          });

        }).on('error', function (err) {
          console.log('Error, with: ' + err.message);

          // speechOutput = "Please say that again?";
          // repromptText = "Please try again.";
          // shouldEndSession = false;

        });
      }

    }
  }

}

function readLatestNewsTitles(intent, session, callback) {
  var cardTitle = "Read News Titles From TechCrunch";
  var repromptText = "";
  var sessionAttributes = {};
  var shouldEndSession = false;
  var speechOutput = "";

  var posts = [];

  https.get('https://techcrunch.com/wp-json/posts/latest', function(res) {
    console.log('statusCode:', res.statusCode);
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function(data) {
      body += data;
    });

    res.on('end', function() {
      var apiRes = JSON.parse(body);

      posts = apiRes.posts.slice(0,5);

      var finalPosts = [];

      for(var i=0; i<posts.length;i++){
        finalPosts[i] = {
          title: posts[i].title,
          id: posts[i].id
        };
      }

      sessionAttributes.latestNewsPosts = finalPosts;

      var newtalk = '';

      for(var i=0; i<posts.length;i++){
          newtalk = newtalk + (i+1) + ". " + posts[i].title + ". ";
      }
      speechOutput = "TechCrunch has "+ posts.length + " latest stories. " + newtalk;

      callback(sessionAttributes,
           buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });

  }).on('error', function (err) {
    console.log('Error, with: ' + err.message);

    // speechOutput = "Please say that again?";
    // repromptText = "Please try again.";
    // shouldEndSession = false;

  });

}

function getOrgNewsTC(intent, session, callback) {
  var cardTitle = "Latest News on Company from TechCrunch";

  var companyName = intent.slots.company.value;

  var repromptText = null;
  var sessionAttributes = {};
  var shouldEndSession = false;
  var speechOutput = '';

  var posts = [];

  https.get('https://api.swiftype.com/api/v1/public/engines/search.json?q='+companyName+'&page=1&per_page=5&facets%5Bpage%5D%5B%5D=author&facets%5Bpage%5D%5B%5D=category&facets%5Bpage%5D%5B%5D=tag&facets%5Bpage%5D%5B%5D=object_type&filters%5Bpage%5D%5Btimestamp%5D%5Btype%5D=range&spelling=always&engine_key=zYD5B5-eXtZN9_epXvoo', function(res) {
    console.log('statusCode:', res.statusCode);
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function(data) {
      body += data;
    });

    res.on('end', function() {
      var apiRes = JSON.parse(body);

      posts = apiRes.records.page;

      var finalPosts = [];

      for(var i=0; i<posts.length;i++){
        finalPosts[i] = {
          title: posts[i].title,
          content: posts[i].content
        };
      }

      sessionAttributes.latestNewsPosts = finalPosts;

      var newtalk = '';

      for(var i=0; i<posts.length;i++){
        newtalk = newtalk + (i+1) + ". " + posts[i].title + ". ";
      }
      speechOutput = "TechCrunch has "+ posts.length + " latest news on " + companyName + ". " + newtalk;

      callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });

  }).on('error', function (err) {
    console.log('Error, with: ' + err.message);

    // speechOutput = "Please say that again?";
    // repromptText = "Please try again.";
    // shouldEndSession = false;

  });

}

function getOrganizationSentiment(intent, session, callback) {
  var cardTitle = "Organization Sentiment";

  var companyName = intent.slots.company.value;

  var repromptText = null;
  var sessionAttributes = {};
  var shouldEndSession = true;
  var speechOutput = '';

  https.get('https://api.swiftype.com/api/v1/public/engines/search.json?q='+companyName+'&page=1&per_page=10&facets%5Bpage%5D%5B%5D=author&facets%5Bpage%5D%5B%5D=category&facets%5Bpage%5D%5B%5D=tag&facets%5Bpage%5D%5B%5D=object_type&filters%5Bpage%5D%5Btimestamp%5D%5Btype%5D=range&spelling=always&engine_key=zYD5B5-eXtZN9_epXvoo', function(res) {
    console.log('statusCode:', res.statusCode);
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function(data) {
      body += data;
    });

    res.on('end', function() {
      var apiRes = JSON.parse(body);

      var posts = apiRes.records.page;

      var sentiments = [];

      var completedRequests = 0;

      for(var i=0; i<posts.length;i++){
        https.get("https://gateway-a.watsonplatform.net/calls/url/URLGetTextSentiment?apikey=494010774c19f65b2d7a464521bb8f4e2c847d7f&outputMode=json&url="+encodeURIComponent(posts[i].url), function (res1) {
          console.log('statusCode:', res1.statusCode);
          res1.setEncoding('utf8');
          var body1 = '';
          res1.on('data', function(data) {
            body1 += data;
          });

          res1.on('end', function () {
            var apiRes1 = JSON.parse(body1);

            sentiments.push(apiRes1.docSentiment);

            completedRequests++;
            if (completedRequests == posts.length) {

              console.log(sentiments);

              var totalSentimentScore = 0;
              for(var j=0; j<sentiments.length; j++) {
                console.log(parseFloat(sentiments[j].score));
                totalSentimentScore += parseFloat(sentiments[j].score);
              }

              var avgSentimentScore = totalSentimentScore / sentiments.length;

              console.log(avgSentimentScore);

              var sentimentType = 'neutral';
              if (avgSentimentScore < 0) {
                sentimentType = 'negative';
              } else if (avgSentimentScore > 0) {
                sentimentType = 'positive';
              }

              speechOutput = "TechCrunch holds "+ sentimentType + " sentiment towards " + companyName + ".";
              if ( avgSentimentScore != 0 ) {
                avgSentimentScore = avgSentimentScore * 100;
                speechOutput = speechOutput + " And the sentiment strength is " + avgSentimentScore.toFixed(2) + '%';
              }

              callback(sessionAttributes,
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            }

          });
        }).on('error', function (err1) {
          console.log('Error, with: ' + err1.message);
        });
      }

    });

  }).on('error', function (err) {
    console.log('Error, with: ' + err.message);

    // speechOutput = "Please say that again?";
    // repromptText = "Please try again.";
    // shouldEndSession = false;

  });

}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
  return {
    outputSpeech: {
      type: "PlainText",
      text: output
    },
    card: {
      type: "Simple",
      title: "SessionSpeechlet - " + title,
      content: "SessionSpeechlet - " + output
    },
    reprompt: {
      outputSpeech: {
        type: "PlainText",
        text: repromptText
      }
    },
    shouldEndSession: shouldEndSession
  };
}

function buildResponse(sessionAttributes, speechletResponse) {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  };
}

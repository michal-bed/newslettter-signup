// "type" : "module"
// import mailchimp from "@mailchimp/mailchimp_marketing";
const mailchimp = require("@mailchimp/mailchimp_marketing");

const express = require("express");
const bodyParser = require("body-parser");
// const request = require("request"); // <= deprecated
const https = require("https");
const { formatWithOptions } = require("util");

const { JSDOM } = require( "jsdom" );

const app = express();

var { window } = new JSDOM ( "" );
// var $;
var $ = require( "jquery" )( window );

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));

const listId = "6490073db7";
const apiKey = "967c905bd5715c7e7990bd8a38fdbe1d-us1";
mailchimp.setConfig({
  apiKey: apiKey,
  server: "us1",
});

async function checkMailchimp() {
  const response = await mailchimp.ping.get();
  console.log(response);
}

checkMailchimp();

async function runMailchimp(subscribingUser, res) 
{
  var response = undefined;
  
  try
  {
    response = await mailchimp.lists.addListMember(listId, {
        email_address: subscribingUser.email,
        status: "subscribed",
        merge_fields: {
        FNAME: subscribingUser.firstName,
        LNAME: subscribingUser.lastName
        }
    })
  }
    // .then
    // (
    //     function()
    //     {
    //         console.log(
    //             `Successfully added contact as an audience member. The contact's id is ${
    //             response.id
    //             }. Response's status: ${response.status}.`
    //         );
        
    //     //res.send("Successfully subscribed.");
    //     res.sendFile(__dirname + "/success.html");
        
    //     }
    // )
    // .catch
    // (
    //     function()
    //     {
    //         console.log("Problem with mailChimp request.");
    //         console.log(e);
    //         console.log("Status", e.status);
    //         console.log("Failed to add a contact to the subscribing list. Try again later.");
    //         // res.send("There was an error with signing up, please try again later!");
    //         if (e.status === 400)
    //         {
    //             // const failureFile = new File(__dirname + "/failure.html");
    //             //const failureFile = new Blob()
    //             //const { window } = new JSDOM( failureFile );
    //             const options = 
    //                 { 
    //                     contentType: 'text/html',
    //                     resources: 'usable',
    //                     runScripts: 'dangerously'
    //                 };

    //             var window; 
    //             JSDOM.fromFile(__dirname + "/failure.html", options).
    //                                 then
    //                                 (//(dom) => 
    //                                     function(dom)
    //                                     { 
    //                                         try 
    //                                         { 
    //                                             window = dom.window;
    //                                         }
    //                                         catch (e)
    //                                         {
    //                                             console.log("Error:");
    //                                             console.log(e);
    //                                             console.log("Status:");
    //                                             console.log(e.status);
    //                                             return;
    //                                         }
    //                                     } 
    //                                 )
    //                                 .catch 
    //                                 (
    //                                     function ()
    //                                     {
    //                                         console.log("Promise Rejected");
    //                                     }
    //                                 );

    //             const $ = require( "jquery" )( window );

    //             jsonText = JSON.parse(e.response.text);
    //             var detail = jsonText.detail;
    //             console.log(detail);
    //             const errorInfo = "There was a problem signing you up. " + 
    //                             detail.split(". ")[0] + ".";
    //             console.log(errorInfo);
    //             // $(".lead").textContent = errorInfo;
    //             // res.send(__dirname + "/failure.html");
    //             return;

    //         }
    //         res.sendFile(__dirname + "/failure.html");
    //         return;
    //     }
    // );

  catch (e)
  {
    console.log(e);
    console.log("Status", e.status);
    console.log("Failed to add a contact to the subscribing list. Try again later.");
    // res.send("There was an error with signing up, please try again later!");
    if (e.status === 400)
    {
        // const failureFile = new File(__dirname + "/failure.html");
        //const failureFile = new Blob()
        //const { window } = new JSDOM( failureFile );
        const options = 
            { 
                contentType: 'text/html',
                resources: 'usable',
                runScripts: 'dangerously'
            };

        console.log("I am before local window declaration");
        // var { window } = new JSDOM ( "" ); 

        // var $;
        // var window;
        JSDOM.fromFile(__dirname + "/failure.html", options).
                            then
                            (//(dom) => 
                                function(dom)
                                { 
                                    try 
                                    { 
                                        window = dom.window;
                                        $ = require( "jquery" )( window );
                                        console.log("window");
                                        console.log(window);
                                        console.log("$");
                                        console.log($);

                                        jsonText = JSON.parse(e.response.text);
                                        var detail = jsonText.detail;
                                        console.log(detail);
                                        const errorInfo = "There was a problem signing you up. " + 
                                                        detail.split(". ")[0] + ".";
                                        console.log(errorInfo);
                                        $(".lead").text(function() { return  errorInfo; });
                                        console.log($(".lead").text());
                                        // res.send($("html"));
                                        res.send($("html").html());
                                        return;
                                    }
                                    catch (e)
                                    {
                                        console.log("Error:");
                                        console.log(e);
                                        console.log("Status:");
                                        console.log(e.status);
                                        return;
                                    }
                                } 
                            )
                            .catch 
                            (
                                function ()
                                {
                                    console.log("Promise Rejected");
                                }
                            );
        console.log("I am after JSDOM.fromFile and before $ declaration");
        // const $ = require( "jquery" )( window );

        

    }
    else 
    {
        res.sendFile(__dirname + "/failure.html");
        return;
    }
}

  console.log(
    `Successfully added contact as an audience member. The contact's id is ${
      response.id
    }. Response's status: ${response.status}.`
  );
  
  //res.send("Successfully subscribed.");
  res.sendFile(__dirname + "/success.html");
}

function sendPostRequest(subscribingUser, res)
{
    const member = 
        {
            email_address: subscribingUser.email,
            status: "subscribed",
            merge_fields: {
                FNAME: subscribingUser.firstName,
                LNAME: subscribingUser.lastName
            }
        };

    const data = 
    {
        members: [member]
    };

    jsonData =  JSON.stringify(data);

    const url = "https://us1.api.mailchimp.com/3.0/lists/" + listId;
    const options = 
    {
        method: "POST",
        auth: "michalbed:" + apiKey,
    };

    const request = https.request(url, options, 
        function(response)
        {
            if (response.statusCode === 200)
            {
               console.log("Successfully subscribed.");
               res.send("Successfully subscribed.");
            }
            else
            {
                console.log("There was an error with signing up, please try again later!");
                res.send("There was an error with signing up, please try again later!");
            }

            response.on("data",
                function(data)
                {
                    console.log(JSON.parse(data));
                }
            );
        }
    
    );

    request.write(jsonData);
    request.end();
}

app.get("/",
    function(req, res)
    {
        res.sendFile(__dirname + "/signup.html");
    }
);

app.post("/",
    function(req, res)
    {
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        console.log(firstName, lastName, email);

        const subscribingUser = {
            firstName: firstName,
            lastName: lastName,
            email: email
        };

        // method using mailchimp module is schorter
        // we can avoid much configuring request stuff
        // so I commented out the other way below and use this function
        runMailchimp(subscribingUser, res);

        // sendPostRequest(subscribingUser, res);
    }
);

app.post("/failure",
    function(req, res)
    {
        res.redirect("/");
    }
);

app.listen(process.env.PORT || 3000,
    function()
    {
        console.log("Server is running on Heroku or port 3000.");
    }
);

// API Key
// 967c905bd5715c7e7990bd8a38fdbe1d-us1

// List ID
// 6490073db7
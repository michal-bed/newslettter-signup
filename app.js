// import mailchimp from "@mailchimp/mailchimp_marketing";


const result = require('dotenv').config();
 
// if (result.error) {
//   throw result.error
// }
 
// console.log(result.parsed)

const mailchimp = require("@mailchimp/mailchimp_marketing");

const express = require("express");
const bodyParser = require("body-parser");
// const request = require("request"); // <= deprecated
const https = require("https");
const ejs = require("ejs");
// const { formatWithOptions } = require("util");

const { JSDOM } = require( "jsdom" );

const app = express();

var { window } = new JSDOM ( "" );
var $ = require( "jquery" )( window );

app.use(express.urlencoded({extended : true}));
app.use(express.static("public"));
app.set("view engine", "ejs");


const listId = process.env.LIST_ID;
const apiKey = process.env.API_KEY;
console.log(listId, apiKey);
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
  // var response = undefined;
  
  try
  {
    const response = await mailchimp.lists.addListMember(listId, {
        email_address: subscribingUser.email,
        status: "subscribed",
        merge_fields: {
        FNAME: subscribingUser.firstName,
        LNAME: subscribingUser.lastName
        }
    })

    console.log(
        `Successfully added contact as an audience member. The contact's id is ${
          response.id
        }. Response's status: ${response.status}.`
      );
      
      //res.send("Successfully subscribed.");
      res.sendFile(__dirname + "/success.html");
  }
  catch (e)
  {
    console.log(e);
    console.log("Status", e.status);
    console.log("Failed to add a contact to the subscribing list. Try again later.");
    // res.send("There was an error with signing up, please try again later!");
    if (e.status === 400)
    {
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
                                        // console.log("window");
                                        // console.log(window);
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
        // console.log("I am after JSDOM.fromFile and before $ declaration");
        // const $ = require( "jquery" )( window );

        

    }
    else 
    {
        res.sendFile(__dirname + "/failure.html");
        return;
    }
  }

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
            //console.log("response", response);

            response.on("data",
                function(data)
                {
                    console.log("response data:", JSON.parse(data));
                    const errors = JSON.parse(data).errors;
                    console.log("errors:", errors);

                    if (!errors.length)
                    {
                        console.log("Successfully subscribed.");
                        //res.send("Successfully subscribed.");
                        res.sendFile(__dirname + "/success.html");
                    }
                    else
                    {
                        let errorInfo = "";
                        let count = 1;
                        for (const error of errors)
                        {
                            if (error.error_code === 'ERROR_GENERIC')
                            {
                                errorInfo += error.error;
                                if (errors.length > 1 && count < errors.length)
                                {
                                    errorInfo += " ";
                                }
                            }
                            else if (error.error_code === 'ERROR_CONTACT_EXISTS')
                            {
                                errorInfo += (error.email_address + ' is already a list member.');
                                if (errors.length > 1 && count < errors.length)
                                {
                                    errorInfo += " ";
                                }
                            }
                            ++count;
                        }

                        console.log("There was an error with signing up, please try again later!");
                        //res.send("There was an error with signing up, please try again later!");
                        console.log("errorInfo:", errorInfo);
                        res.render("failure", {addInfo: errorInfo});
                    }

                }
            );
        }
    
    );

    //console.log("request:", request);
    console.log(jsonData);
    request.write(jsonData);
    //console.log("request after udate:", request);
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
        // Also runMailchimp was later updated to handle 'Bad Request' error
        // But the other function wasn't.
        // Moreover, it checks the status of response to POST request which doesn't seem to be 
        // completely right. It seems to pass seemingly 'succesfully' data which contain error info in the 
        // response's data field
        // All in all, it is better to avoid the sendPostRequest function or remodel it to check
        // errors field in the response's data - it is logged in the console to help check the data
        // You can check an invalid email address like for example 'mich@b' another option it to check it
        // adding duplicated email address. It also should return errors object...
        // I've already remodeled the app so that it works like I explained above
        // So now there are two functions that works similarly. 
        // One uses native Node https module, the other uses a module provided by mailchimp
        // One uses jQuery to render pages,
        // the other uses ejs templates
        // runMailchimp(subscribingUser, res);

        sendPostRequest(subscribingUser, res);
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

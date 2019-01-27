// Dependencies
var express = require("express");
var mongojs = require("mongojs");
// Require axios and cheerio. This makes the scraping possible
var axios = require("axios");
var cheerio = require("cheerio");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");

var app = express();
var PORT = process.env.port || 3000;

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scraper";

mongoose.connect(MONGODB_URI);



// Database configuration
var databaseUrl = "scraper";
var collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function (error) {
  console.log("Database Error:", error);
});

// Main route (simple Hello World Message)
app.get("/", function (req, res) {
  res.send("Hello world");
});
//
// app.get("/unique", function (req, res) {
//   db.scrapedData.aggregate([
//     {
//       "$group": 
//       {
//         title: {projectTitle: "$projectTitle"},
//         dups: {$addToSet: "$title"},
//         count: {$sum: 1}
//       }
//     },
//     {
//       "$match":
//     {
//       count: {"$gt": 1}
//     }
//   }

//   ]).forEach(function(doc) {
//     doc.dups.shift();
//     db.usersProject.remove({
//       _id: {$in: doc.dups}
//     })
//   })
// });




// Retrieve data from the db
app.get("/all", function (req, res) {
  // Find all results from the scrapedData collection in the db
  db.scrapedData.find({}, function (error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      var tempData = {
        tempArticle: []
      }
      for (i = 0; i < found.length; i++) {
        var findId = found[i]._id
        var findTitle = found[i].title
        var findLink = found[i].link

        var tempArticleObject = {
          title: findTitle,
          link: findLink
        }
        tempData.tempArticle.push(tempArticleObject);
      }
      //can somehow turn these into functions and call 
      //can I put these in a function and call them?
      
      var titles = tempData.tempArticle.map(function (item) {
        return item.title;
      })

      var titlesUnique = titles.filter(function (item, index) {
        return titles.indexOf(item) >= index;
      })

      var links = tempData.tempArticle.map(function (item) {
        return item.link;
      })

      var linksUnique = links.filter(function (item, index) {
        return links.indexOf(item) >= index;
      })

      var titles = titlesUnique
      var links = linksUnique

      //loop through titles, create titlesObject, push to data.title
      //var uniqueTitle = titles[i]
      // var titlesObject = {
      //    title: uniqueTitle
      //}
      //data.title.push(titlesObject)

      var data = {
        title:[],
        link: []
      }

      for (i = 0; i < titles.length; i++) {
        var uniqueTitle = titles[i]

        var titlesObject = {
          title: uniqueTitle
        }

        data.title.push(titlesObject);
      }

      //loop through links, create linksObject, push to data.title
      //var uniqueLink = links[i]
      // var linksObject = {
      //    link: uniqueLink
      //}
      //data.title.push(linksObject);
      
      for (i = 0; i < links.length; i++) {
        var uniqueLink = links[i]

        var linksObject = {
          link: uniqueLink
        }

        data.link.push(linksObject);
      }



      
      console.log(data);

    }

    
    //this would change to data
    res.render("all-lunches", data);


  });
})


// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function (req, res) {
  // Make a request via axios for the news section of `ycombinator`
  axios.get("https://news.ycombinator.com/").then(function (response) {
    // Load the html body from axios into cheerio
    var $ = cheerio.load(response.data);
    // For each element with a "title" class
    $(".title").each(function (i, element) {
      // Save the text and href of each link enclosed in the current element
      var title = $(element).children("a").text();
      var link = $(element).children("a").attr("href");

      // If this found element had both a title and a link
      if (title && link) {
        // Insert the data in the scrapedData db
        db.scrapedData.insert({
          title: title,
          link: link
        },
          function (err, inserted) {
            if (err) {
              // Log the error if one is encountered during the query
              console.log(err);
            }
            else {
              // Otherwise, log the inserted data
              console.log(inserted);
            }
          });
      }
    });
  });

  // Send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
});





// Listen on port 3000
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});

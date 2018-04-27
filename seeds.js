// This file creates campgrounds with comments


var mongoose = require("mongoose"), // mongoose
    Campground = require("./models/campground"), // Campground schema
    Comment = require("./models/comment");


// Define prepopulated data
var data = [
    {
        name: "Cloud's Rest",
        image: "https://farm4.staticflickr.com/3795/10131087094_c1c0a1c859.jpg",
        description: "Lorem ipsum dolor sit amet, clita argumentum nam ei, omnesque vituperata instructior cu est. Utinam docendi offendit eu eam, mel id veritus tibique epicuri. Nobis exerci viderer mel id, est erat volumus ex. Ridens quaeque aliquid has id, eu dicta vivendo intellegat duo, amet animal oporteat vix ex. Convenire abhorreant his cu. Ei qui eirmod diceret vulputate, vis dolor propriae id. Eu ius quaeque posidonium. Ea mea graecis commune, ne delicata mandamus mea. Eu fugit omnesque quo, an vim lucilius legendos. Te unum audiam indoctum pri, no diam discere deserunt nec."
    },
    {
        name: "Desert Mesa",
        image: "https://farm6.staticflickr.com/5487/11519019346_f66401b6c1.jpg",
        description: "Eum eu audire postulant, viris explicari scriptorem cu vel, est ne ancillae atomorum molestiae. Eam id nisl cetero philosophia. Ad duo recusabo pericula, corrumpit similique his at. Vis debitis indoctum vituperata ut, no veritus expetendis eos. No maluisset reprimique eam, in sale augue mei, eruditi nusquam definiebas et has. Sed te soleat dolorum posidonium, nam ad dico omnium timeam. Qui cu atqui etiam insolens. Eam reque diceret admodum te." 
    },
    {
        name: "Canyon Floor",
        image: "https://farm1.staticflickr.com/189/493046463_841a18169e.jpg",
        description: "Vix quas oblique corrumpit ut, in probo invidunt vim. Eu nonumy verear his, quod prima an sea. Graeco recteque dissentias id mel, duo erat evertitur prodesset no, ei vis alia mutat dolorum. Ullum sonet eripuit an vel. Accommodare philosophia et eos, eum essent singulis delicatissimi ei, ei eos nusquam invidunt. Et eros doming definitionem per, postea impedit blandit sed ad, erant lobortis indoctum ad qui. Cum at homero volutpat, melius expetendis in mel. At nam omnes convenire, id mea dolores petentium. Nec at novum consetetur, cu vis sanctus laoreet maiorum, pro mutat delenit no. Eu semper iriure prompta pri. In dico nibh mucius cum. An quas facilisis constituto sea."
    }
]

// Remove campgrounds from database and then pre-propulate with data
function seedDb() {
    // remove all campgrounds
    Campground.remove({}, function (err, removedCamps) {
        if (err) {
            console.log(err);
        } else {
            // inform developer that campground removal has been succesful
            console.log("Campgrounds have been removed");

            // populating data must be in callback like so or else data will just be deleted again

            // loop through data
            for(var i = 0; i < data.length; i++){
                // create campgrounds to pre-populate the page
                Campground.create(data[i], function(err, preData){
                    if (err) {
                        console.log(err);
                    } else {
                        // inform developer campground has been added
                        console.log("Added a campground");
                        // Create a comment 
                        Comment.create({
                            text: "This place is great! But I wish there was internet.",
                            author: "Homer"
                        }, function(err, comment){
                            if (err) {
                                console.log(err);
                            } else{
                                // push comment into array
                                preData.comments.push(comment);
                                // save Campground
                                preData.save();
                                // Show the comments printed out
                                console.log("Created new comment");
                            }
                        });
                    }
                });
            }
        }
    });
}


// export this function
module.exports = seedDb;

/* Create a program in Node.js where the input defined in input.csv
is parsed and organized into the content shown in output.json.
JSON order is not important, but content is.
Don't hard code the tags shown, meaning tags could be changed to
"email Tio, Reponsável, Financeiro" and it would still parse accordingly.*/

// Author: Ricardo Guiotto Favero

// Import libraries
var _ = require('lodash');
var Converter = require("csvtojson").Converter;
var inspector = require('schema-inspector');

var headers;

// Layout for the first 3 properties
var sanitization = {
    type: 'object',
    properties: {
        fullname: {
            type: 'string',
            rules: ['trim', 'title']
        },
        eid: {
            type: 'integer'
        },
        classes: {
            type: "array",
            items: {
                type: "string",
                rules: ["trim"]
            }
        }
    }
};

// Converter Class
var converter = new Converter({
    headers: ['fullname', 'eid', 'classes']
});

// Merge addresses
function mergeAddresses(people) {
    _.forEach(people, function(person) {
        _.forEach(person, function(value, key) {
            if (key == "addresses")
                person.addresses = _.uniqWith(value, compareAndMergeAddresses);
        });
    });
}

// Comparator function for addresses
function compareAndMergeAddresses(first, second) {
    if (first.address === second.address) {
        first.tags = second.tags = [].concat(first.tags, second.tags);
        return true;
    }
    return false;
}

// Convert the basic array of addresses to the specified layout
function convertAddresses(people) {
    _.forEach(people, function(person) {
        person.addresses = [];
        var keys = Object.keys(person); // get list of keys, "fullname", "field5", "field6" etc

        for (j = 3; j <= 8; j++) { // 3 to 8 because we need field5 to field10. Print out the 'keys' variable to see the location of each field
            _.forEach(person[keys[j]], function(address_value) { // iterate through all items of arrays field5 to field10
                var address_tmp = {type: "", tags: "", address: ""};
                var tags_tmp = [];

                // here we create temporary objects and set their values using data from our 'headers' object. +1 because we had a duplicated 'class' at the beggining
                address_tmp.type = headers[j + 1][0];
                for (i = 1; i < headers[j + 1].length; i++)
                    tags_tmp.push(headers[j + 1][i]);
                address_tmp.tags = tags_tmp;
                address_tmp.address = address_value;

                // we now add the temporary object to our main object
                if (address_tmp.address != '')
                    person.addresses.push(address_tmp);
            });

            // we can now delete the older objects from our main object
            delete person[keys[j]];
        }

    });
}

// Change yes, 1s, 0 and no to boolean
function fixVisibility(people) {
    _.forEach(people, function(person) {
        person.field11 = ((person.field11 == "yes") || (person.field11 == "1") || (person.field11 == 1));
        person.field12 = ((person.field12 == "yes") || (person.field12 == "1") || (person.field12 == 1));
    });
}

// Convert phone numbers to specified format
function fixPhones(people) {
    _.forEach(people, function(person) {
        var keys = ['field6', 'field7', 'field10']; // select our phone fields
        _.forEach(keys, function(k) {
            person[k] = person[k].replace(/[^0-9]/g, ''); // remove everything that is not a number
            if ((person[k].length < 10) || (person[k].length > 11)) person[k] = ''; // validate number
            else person[k] = JSON.parse("[" + '55' + person[k] + "]"); // add country code
        });
    });
}

// Split classes
function fixClasses(people) {
    _.forEach(people, function(person) {
        person.classes = person.classes.split("/");
        person.field4 = person.field4.split(",");
    });
}

// Verify if an email is valid
function isValidEmail(email) {
    if (_.includes(email, ' ') || !(_.includes(email, '@')))
        return false;
    else return true;
}

// Split emails if valid
function fixEmails(people) {
    _.forEach(people, function(person) {
        var keys = ['field5', 'field8', 'field9']; // select our email fields
        _.forEach(keys, function(k) {
            if (!isValidEmail(person[k])) person[k] = '';
            else person[k] = person[k].split('/');
        });
    });
}

// Merge classes
function mergeClasses(people) {
    _.forEach(people, function(person) {
        if (person.field4 != '')
            person.classes = [].concat(person.classes, person.field4);
        delete person.field4;
    });
}

// Merge people
function merge(people) {
    return _.uniqWith(people, compareAndMerge)
}

// Comparator for people
function compareAndMerge(first, second) {
    if (first.eid === second.eid) {
        first.classes = second.classes = [].concat(second.classes, first.classes);

        var keys = Object.keys(first); // get list of keys, "fullname", "field5", "field6" etc
        for (j = 3; j <= 8; j++)
            first[keys[j]] = second[keys[j]] = [].concat(first[keys[j]], second[keys[j]]);

        for (j = 9; j <= 10; j++)
            first[keys[j]] = second[keys[j]] = (first[keys[j]] || second[keys[j]]);

        return true;
    }
    return false;
}

// Rename the last 2 headers to their original names
function renameVisibilityFields(people) {
    _.forEach(people, function(person) {
        _.forEach(person, function(value, key) {
            if (key == "field11")
                person.invisible = value;
            if (key == "field12")
                person.see_all = value;
        });
        delete person.field11;
        delete person.field12;
    });
}

// When we finish reading from csv
converter.on("end_parsed", function(jsonArray) {
    //console.log(headers);
    fixClasses(jsonArray);
    mergeClasses(jsonArray);
    fixPhones(jsonArray);
    fixEmails(jsonArray);
    fixVisibility(jsonArray);

    var mergedArray = merge(jsonArray);

    _.forEach(mergedArray, function(value) {
        inspector.sanitize(sanitization, value);
    });

    convertAddresses(mergedArray);
    renameVisibilityFields(mergedArray);
    mergeAddresses(mergedArray);

    // show json object on screen
    var str = JSON.stringify(mergedArray, null, 2);
    console.log(str);

    // write json object to file
    var fs = require('fs');
    fs.writeFile('output.json', JSON.stringify(mergedArray));

});

// Get first line from csv and convert it to our header object
converter.preProcessLine = function(line, lineNumber) {
    if (lineNumber === 1) {
        headers = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        _.forEach(headers, function(value, key) {
            headers[key] = headers[key].replace(/,/g, '');
            headers[key] = headers[key].replace(/"/g, '');
            headers[key] = headers[key].split(" "); // split headers into separated string objects
        });
    }
    return line;
}

require("fs").createReadStream("./input.csv").pipe(converter);

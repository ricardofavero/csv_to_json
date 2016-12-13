// Load the full build.
var _ = require('lodash');

var headers;

var inspector = require('schema-inspector');
var sanitization = {
    type: 'object',
    properties: {
        fullname: { type: 'string', rules: ['trim', 'title'] },
        eid: { type: 'integer' },
        classes: {
        			type: "array",
        			items: { type: "string", rules: ["trim"] }
        		}
    }
};

//Converter Class
var Converter = require("csvtojson").Converter;
var converter = new Converter({
  headers:['fullname', 'eid', 'classes']
});
var converter2 = new Converter({});

function convertAddresses(array){

  _.forEach(array, function(value, key) {
    value.addresses = [];
    _.forEach(value, function(value2, key2) {

      if(key2 == "field5"){
        _.forEach(value2, function(value3, key3) {
          var address_tmp = {type: "", tags: "", address: ""};
          var tags_tmp = [];
          tags_tmp.push(headers[3][1]);
          tags_tmp.push(headers[3][2]);
          address_tmp.type = headers[3][0];
          address_tmp.tags = tags_tmp;
          address_tmp.address = value3;
          if(address_tmp.address != '')
            value.addresses.push(address_tmp);
        });
      }

      if(key2 == "field6"){
        _.forEach(value2, function(value3, key3) {
          var address_tmp = {type: "", tags: "", address: ""};
          var tags_tmp = [];
          tags_tmp.push(headers[4][1]);
          address_tmp.type = headers[4][0];
          address_tmp.tags = tags_tmp;
          address_tmp.address = value3;
          if(address_tmp.address != '')
            value.addresses.push(address_tmp);
        });
      }

      if(key2 == "field7"){
        _.forEach(value2, function(value3, key3) {
          var address_tmp = {type: "", tags: "", address: ""};
          var tags_tmp = [];
          tags_tmp.push(headers[5][1]);
          tags_tmp.push(headers[5][2]);
          address_tmp.type = headers[5][0];
          address_tmp.tags = tags_tmp;
          address_tmp.address = value3;
          if(address_tmp.address != '')
            value.addresses.push(address_tmp);
        });
      }

      if(key2 == "field8"){
        _.forEach(value2, function(value3, key3) {
          var address_tmp = {type: "", tags: "", address: ""};
          var tags_tmp = [];
          tags_tmp.push(headers[6][1]);
          address_tmp.type = headers[6][0];
          address_tmp.tags = tags_tmp;
          address_tmp.address = value3;
          if(address_tmp.address != '')
            value.addresses.push(address_tmp);
        });
      }

      if(key2 == "field9"){
        _.forEach(value2, function(value3, key3) {
          var address_tmp = {type: "", tags: "", address: ""};
          var tags_tmp = [];
          tags_tmp.push(headers[7][1]);
          address_tmp.type = headers[7][0];
          address_tmp.tags = tags_tmp;
          address_tmp.address = value3;
          if(address_tmp.address != '')
            value.addresses.push(address_tmp);
        });
      }

      if(key2 == "field10"){
        _.forEach(value2, function(value3, key3) {
          var address_tmp = {type: "", tags: "", address: ""};
          var tags_tmp = [];
          tags_tmp.push(headers[8][1]);
          address_tmp.type = headers[8][0];
          address_tmp.tags = tags_tmp;
          address_tmp.address = value3;
          if(address_tmp.address != '')
            value.addresses.push(address_tmp);
        });
      }

    });

    delete value.field5;
    delete value.field6;
    delete value.field7;
    delete value.field8;
    delete value.field9;
    delete value.field10;
  });
}

function fixPhones(array){
  _.forEach(array, function(value, key) {
      value.field6 = (value.field6).replace(/[^0-9]/g, '');
      value.field7 = (value.field7).replace(/[^0-9]/g, '');
      value.field10 = (value.field10).replace(/[^0-9]/g, '');
      if((value.field6.length < 10) || (value.field6.length > 11)) value.field6 = '';
      else value.field6 = JSON.parse("[" + '55' + value.field6 + "]");
      if((value.field7.length < 10) || (value.field7.length > 11)) value.field7 = '';
      else value.field7 = JSON.parse("[" + '55' + value.field7 + "]");
      if((value.field10.length < 10) || (value.field10.length > 11)) value.field10 = '';
      else value.field10 = JSON.parse("[" + '55' + value.field10 + "]");
});
}

function fixClasses(array){
  _.forEach(array, function(value, key) {
    value.classes = value.classes.split("/");
    value.field4 = value.field4.split(",");
  });
}

function isValidEmail(email){
  if(_.includes(email, ' ') || !(_.includes(email, '@')))
    return false;
  else return true;
}

function fixEmails(array){
  _.forEach(array, function(value, key) {
    if(!isValidEmail(value.field5)) value.field5 = '';
    else value.field5 = value.field5.split('/');
    if(!isValidEmail(value.field8)) value.field8 = '';
    else value.field8 = value.field8.split('/');
    if(!isValidEmail(value.field9)) value.field9 = '';
    else value.field9 = value.field9.split('/');
});
}

function mergeClasses(array){
  _.forEach(array, function(value, key) {
      value.classes = [].concat(value.classes, value.field4);
      delete value.field4;
});
}

function merge(people) {
  return _.uniqWith(people, compareAndMerge)
}

function compareAndMerge(first, second) {
    if (first.eid === second.eid) {
        first.classes = second.classes = [].concat(second.classes, first.classes);

        first.field5 = second.field5 = [].concat(first.field5, second.field5);
        first.field6 = second.field6 = [].concat(first.field6, second.field6);
        first.field7 = second.field7 = [].concat(first.field7, second.field7);
        first.field8 = second.field8 = [].concat(first.field8, second.field8);
        first.field9 = second.field9 = [].concat(first.field9, second.field9);
        first.field10 = second.field10 = [].concat(first.field10, second.field10);

        return true;
    }
    return false;
}

converter.on("end_parsed", function (jsonArray) {

   fixClasses(jsonArray);
   mergeClasses(jsonArray);
   fixPhones(jsonArray);
   fixEmails(jsonArray);

   var merged = merge(jsonArray);
   _.forEach(merged, function(value, key) {
     inspector.sanitize(sanitization, value);
   });

   convertAddresses(merged);
   //console.log(merged);

   var str = JSON.stringify(merged, null, 2);
   console.log(str);

   //var fs = require('fs');
   //fs.writeFile('output.json', JSON.stringify(merged, 4, 4));

});

converter2.on("end_parsed", function (jsonArray) {
  headers = _.keys(jsonArray[0]);
  _.forEach(headers, function(value, key) {

    var tmp = value.replace(',','');
    headers[key] = tmp.split(" ");


  });

});

//read from file
require("fs").createReadStream("./input.csv").pipe(converter2);
require("fs").createReadStream("./input.csv").pipe(converter);

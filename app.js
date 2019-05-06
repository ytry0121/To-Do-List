//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _=require("lodash");

const day = date.getDate();

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {
  useNewUrlParser: true
});
mongoose.set('useFindAndModify', false);
const Schema = mongoose.Schema;
const itemSchema = new Schema({
  name: String
});
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your TODO List"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

//Open route list
app.get("/", function(req, res) {
  Item.find(function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) console.log(err);
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: foundItems
      });
    }
  });
});

//Open Custom List.If it is new one, add default items.
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });

      }
    }
  });
});

//Add new item
app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listTitle = req.body.list;
  const newItem = new Item({
    name: itemName
  });
  if (listTitle.includes(day)) {
    newItem.save();
    res.redirect("/");
  }else{
    List.findOne({name:listTitle},function(err,foundList){
      if(!err){
          foundList.items.push(newItem );
          foundList.save();
          res.redirect("/"+listTitle  );
        }
    });
  }
});

//Delete- tick checkbox
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listTitle = req.body.listTitle;
  if (listTitle.includes(day)) {
    Item.findByIdAndRemove({
      _id: checkedItemId
    }, function(err) {
      if (err) console.log(err);
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name:listTitle},{ $pull: { items: { _id: checkedItemId  }}},function(err,foundList){
      if(!err){
        res.redirect("/"+listTitle);
      }else{
          console.log("Delete : "+err);
      }
   });
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

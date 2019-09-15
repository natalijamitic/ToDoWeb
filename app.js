//jshint esvrsion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");
const day = date.getDate();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useFindAndModify: false, useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });

//*************************************ITEMS************************************
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];
//******************************************************************************


//*************************************LISTS************************************
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);
//******************************************************************************


app.get("/", (req, res) => {

  Item.find({}, (err, foundItems) => {
    //if there are no items then add 3 default items
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, err => {
        if (err) {
          console.log(err)
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/")
    } else {
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
  });

});

app.get("/about", (req, res) => res.render("about"));

app.get("/:customListName", (req, res) => {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, foundList) => {
      if (!err) {
        if (!foundList) {
          //Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });

          list.save();
          res.redirect("/" + customListName);
        } else {
          //Show an existing list
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
      } else {
        console.log(err);
      }
  });


});

app.post("/", (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", (req, res) =>{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    Item.findByIdAndRemove(checkedItemId, err => {
      if (err) {
        console.log(err)
      } else {
        console.log("Successfully deleted item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});


app.listen(3000, () => console.log("Server started on port 3000"));

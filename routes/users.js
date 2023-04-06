
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../models/User.js');

router.use(bodyParser.urlencoded({ extended: true }));


// // Create a new User
    // router.post("/", usersController.create);

    // // Retrieve all Users
    //router.get("/", User.getDBdata);

    // // Retrieve all published usersController
    // //router.get("/published", usersController.findAllPublished);

    // // Retrieve a single User with id
    // router.get("/:id", usersController.findOne);

    // // Update a User with id
    // router.put("/:id", usersController.update);

    // // Delete a User with id
    // router.delete("/:id", usersController.delete);

    // // Delete all Users
    // router.delete("/", usersController.deleteAll);

//const { getRaj } = require('../models/User');
// RETURNS ALL THE USERS IN THE DATABASE
// const getAll = ()=>{
//   // const res = await sheets.spreadsheets.get({
//   //   spreadsheetId,
//   //   auth,
//   // });
//   const data = {id:1, name:"Raju"}
//   return data;
// }
router.get('/', function (req, res) {
  const rv = User.getRaj();
  res.send(rv);
  // const dbData = User.getDBdata()
  // User.getData.then(
  //   (value)=> {res.status(200).send(value);},
  //   (error)=>{res.status(500).send(`There was a problem finding the users. ${error}`);}
  // ).err("ERroor:");

});
// CREATES A NEW USER
router.post('/', function (req, res) {
    User.create({
            name : req.body.name,
            email : req.body.email,
            password : req.body.password,
            mobile_number: req.body.mobileNumber || null,
            role: req.body.role || null,
            sub_status: req.body.subStatus || null
        }, 
        function (err, user) {
            if (err) return res.status(500).send("There was a problem adding the information to the database.");
            res.status(200).send(user);
        });
});



// GETS A SINGLE USER FROM THE DATABASE
router.get('/:id', function (req, res) {
    User.findById(req.params.id, function (err, user) {
        if (err) return res.status(500).send("There was a problem finding the user.");
        if (!user) return res.status(404).send("No user found.");
        res.status(200).send(user);
    });
});

// DELETES A USER FROM THE DATABASE
router.delete('/:id', function (req, res) {
    User.findByIdAndRemove(req.params.id, function (err, user) {
        if (err) return res.status(500).send("There was a problem deleting the user.");
        res.status(200).send("User: "+ user.name +" was deleted.");
    });
});

// UPDATES A SINGLE USER IN THE DATABASE
// Added VerifyToken middleware to make sure only an authenticated user can put to this route
router.put('/:id', /* VerifyToken, */ function (req, res) {
    User.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, user) {
        if (err) return res.status(500).send("There was a problem updating the user.");
        res.status(200).send(user);
    });
});


module.exports = router;
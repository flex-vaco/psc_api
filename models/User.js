const sql = require("../lib/db.js");

//Functions to get DB results
//============================
const getRaj = ()=>{
    //dummy function
    const data = {id:11, name:"V Rajender Vanamala"}
    return data;
};

// const getAll = (result) => {
//     let query = "SELECT * FROM users";
  
//     if (title) {
//       query += ` WHERE title LIKE '%${title}%'`;
//     }
  
//     sql.query(query, (err, res) => {
//       if (err) {
//         console.log("error: ", err);
//         result(null, err);
//         return;
//       }
  
//       console.log("tutorials: ", res);
//       result(null, res);
//     });
//   };
// const getData = new Promise((reject, resolve)=> {
//     let x = 0;
  
//   // The producing code (this may take some time)
//   const data = {id:21, name:"This is RAJ"}

//     if (x == 0) {
//       resolve(res.status(200).send(data));
//     } else {
//       reject(res.status(500).send("There was a problem finding the user."));
//     }
// });

// async function getDBdata() {
//     try {
//       const data = await getRaj();
//       return data;
//     } catch(error) {
//       console.log(error.message, error.stack);
//     }
//   }
  
//   findById(req.params.id, function (err, user)=> {
//     if (err) return res.status(500).send("There was a problem finding the user.");
//     if (!user) return res.status(404).send("No user found.");
//     res.status(200).send(user);
// });
module.exports = {
    getRaj,
    //getData,
    //getDBdata,
   //findById,
    //getAll
}

const sql = require("../lib/db.js");
const category = "categories";
const multer = require('multer');
const path = require('path');
const userACL = require('../lib/userACL.js');
const APP_CONSTANTS = require('../lib/appConstants.js');

const findAll = (req, res) => {
    if (!userACL.hasCategoryReadAccess(req.user.role)) {
      const msg = `User role '${req.user.role}' does not have privileges on this action`;
      return res.status(404).send({error: true, message: msg});
    }
    try {
        let query =`SELECT * FROM ${category}`;
        console.log("error: ", query);
        sql.query(query, (err, rows) => {
            if (err) {
            console.log("error: ", err);
            return res.status(500).send(`There was a problem getting categories. ${err}`);
            }
            return res.status(200).send({categories: rows});
        });
    } catch (err) {
        console.log("Categories:: Unkown Err:", err);
    }
}

const create = (req, res) => {
    if (!userACL.hasCategoryCreateAccess(req.user.role)) {
      const msg = `User role '${req.user.role}' does not have privileges on this action`;
      return res.status(404).send({error: true, message: msg});
    }

    const fileNameSuffix = Date.now();
    const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "image_name") {
        cb(null, 'public/uploads/technologies');
        }
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${fileNameSuffix}${path.extname(file.originalname)}`);
    }
    });

    var upload = multer({ storage: storage });

    var singleUpload = upload.single('image_name');
    
    singleUpload(req, res, function(err) {
        if (err) {
          res.status(500).send(`Problem while Uploading file: ${err}`);
        } else {
            console.log(req);
          if (req.file) {
            newCategory = req.body;
            console.log(newCategory);
            newCategory['image_name'] = req.file.filename;
            const insertQuery = `INSERT INTO ${category} set ?`;
            sql.query(insertQuery, [newCategory], (err, success) => {
              if (err) {
                res.status(500).send(`Problem while Adding the category. ${err}`);
              } else {
                newCategory.category_id = success.insertId;
                const response = { newCategory };
                res.status(200).send(response);
              }
            });
          } else {
            res.status(500).send(`No file uploaded.`);
          }
        }
    });

    
};

const update = (req, res) => {
    if (!userACL.hasCategoryUpdateAccess(req.user.role)) {
      const msg = `User role '${req.user.role}' does not have privileges on this action`;
      return res.status(404).send({error: true, message: msg});
    }
    const { category_id } = req.params;
    if(!category_id){
      res.status(500).send('Category ID is Required');
    }
    const fileNameSuffix = Date.now();
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.fieldname === "image_name") {
            cb(null, 'public/uploads/technologies');
            }
        },
        filename: (req, file, cb) => {
            if (file.fieldname === "image_name") {
                if (req.body.technology_file_name && ![null, 'null'].includes(req.body.technology_file_name)) {
                    cb(null, req.body.technology_file_name);
                } else {
                    cb(null, `${file.fieldname}-${fileNameSuffix}${path.extname(file.originalname)}`);
                }
            }
        }
    });

    const upload = multer({ storage: storage });
    const fileUploader = upload.single('image_name');

    fileUploader(req, res, (err) => {
    const updatedCategory = req.body;

    if (req.files?.image_name) updatedCategory['image_name'] = req.file.filename;

    delete(updatedCategory.technology_file_name);

    const updateQuery = `UPDATE ${category} set ? WHERE category_id = ?`;
        sql.query(updateQuery, [updatedCategory, category_id], (err, success) => {
            if (err) {
                console.log("error: ", err);
                res.status(500).send(`Problem while Updating the ${category} with ID: ${category_id}. ${err}`);
            } else {
                if (success.affectedRows == 1) {
                    updatedCategory.category_id = parseInt(category_id);
                    const response = { updatedCategory, user: req.user };
                    res.status(200).send(response);
                } else {
                    res.status(404).send({ error: true, message: `Record not found with Category Details ID: ${category_id}` });
                }
            }
        });
    });

};

const findById = async (req, res) => {
    if (!userACL.hasCategoryReadAccess(req.user.role)) {
      const msg = `User role '${req.user.role}' does not have privileges on this action`;
      return res.status(404).send({error: true, message: msg});
    }
    const categoryId = req.params.category_id;
    let result = [];
    if (categoryId) {
        const query = `SELECT * FROM ${category} WHERE category_id = '${categoryId}'`;
        sql.query(query, async (err, categoryRow) => {
            if (err) {
                console.log("error: ", err);
                return res.status(500).send(`There was a problem finding the Category. ${err}`);
            } else {
                return res.status(200).send({category: categoryRow});
            }
        })
    } else {
        return res.status(500).send("Employee-Project-Utilization ID required");
    }
  };

module.exports = {
    findAll,
    create,
    findById,
    update
}
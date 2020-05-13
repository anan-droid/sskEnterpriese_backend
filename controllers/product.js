const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");
const Product = require("../models/product");
const Reviews = require("../models/reviews");
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.productById = (req, res, next, id) => {
  Product.findById(id).exec((err, product) => {
    if (err || !product) {
      return res.status(400).json({
        err: "Product not found",
      });
    }
    req.product = product;
    next();
  });
};

exports.read = (req, res) => {
  req.product.photo = undefined;
  return res.json(req.product);
};

exports.remove = (req, res) => {
  let product = req.product;
  product.remove((err, deleteProduct) => {
    if (err) {
      return res.status(400).json({
        err: errorHandler(err),
      });
    }
    res.json({
      message: "Product was sucessfully deleted",
    });
  });
};
exports.create = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image couldn't be uploaded",
      });
    }
    // check all the fields
    const { name, description, price, category, quantity, shipping } = fields;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }
    const product = new Product(fields);
    if (files.photo) {
      // console.log("PHOTO FILES", files.photo);
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: "Image should be less than 1mb in size ",
        });
      }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }
    product.save((err, data) => {
      if (err) {
        return res.status(400).json({
          err: errorHandler(err),
        });
      }
      res.json({ data });
    });
  });
};

exports.update = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image couldn't be uploaded",
      });
    }
    // check all the fields
    const { name, description, price, category, quantity, shipping } = fields;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }
    let product = req.product;
    product = _.extend(product, fields);
    if (files.photo) {
      // console.log("PHOTO FILES", files.photo);
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: "Image should be less than 1mb in size ",
        });
      }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }
    product.save((err, data) => {
      if (err) {
        return res.status(400).json({
          err: errorHandler(err),
        });
      }
      res.json({ data });
    });
  });
};

exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : "asc";
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  let limit = req.query.limt ? parseInt(req.query.limit) : 6;
  Product.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          err: "Products Not Found",
        });
      }
      res.json(products);
    });
};


exports.listRelated = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find({ _id: { $ne: req.product }, category: req.product.category })
      .limit(limit)
      .populate('category', '_id, name')
      .exec((err, products) => {
          if (err) {
              return res.status(400).json({
                  error: 'Products not found'
              });
          }
          res.json(products);
      });
};

exports.listCategories = (req, res) => {
  Product.distinct('category', {}, (err, categories) => {
      if (err) {
          return res.status(400).json({
              error: 'Categories not found'
          });
      }
      res.json(categories);
  });
};

exports.listBySearch = (req, res) => {
  console.log(req.body, "kjdkjkfjkd kjfdkj skjdfkjskj fksjdk")
  let order = req.body.order ? req.body.order : "desc";
  let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  // console.log(order, sortBy, limit, skip, req.body.filters);
  // console.log("findArgs", findArgs);

  for (let key in req.body.filters) {
      if (req.body.filters[key].length > 0) {
          if (key === "price") {
              // gte -  greater than price [0-10]
              // lte - less than
              findArgs[key] = {
                  $gte: req.body.filters[key][0],
                  $lte: req.body.filters[key][1]
              };
          } else {
              findArgs[key] = req.body.filters[key];
          }
      }
  }

  Product.find(findArgs)
      .select("-photo")
      .populate("category")
      .sort([[sortBy, order]])
      .skip(skip)
      .limit(limit)
      .exec((err, data) => {
          if (err) {
              return res.status(400).json({
                  error: "Products not found"
              });
          }
          res.json({
              size: data.length,
              data
          });
      });
};

exports.photo=(req,res,next)=>{
  if(req.product.photo.data){
    res.set("Content-Type",req.product.photo.contentType)
    return res.send(req.product.photo.data)
  }
  next()
}

exports.listSearch = (req, res) => {
  console.log(req.body)
  // create query object to hold search value and category value
  const query = {};
  // assign search value to query.name
  if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
      // assigne category value to query.category
      if (req.query.category && req.query.category != 'All') {
          query.category = req.query.category;
      }
      // find the product based on query object with 2 properties
      // search and category
      Product.find(query, (err, products) => {
          if (err) {
              return res.status(400).json({
                  error: errorHandler(err)
              });
          }
          res.json(products);
      }).select('-photo');
  }
};

exports.decreaseQuantity = (req, res, next) => {
  let bulkOps = req.body.order.products.map(item => {
      return {
          updateOne: {
              filter: { _id: item._id },
              update: { $inc: { quantity: -item.count, sold: +item.count } }
          }
      };
  });

  

  Product.bulkWrite(bulkOps, {}, (error, products) => {
      if (error) {
          return res.status(400).json({
              error: 'Could not update product'
          });
      }
      next();
  });
};


//Review
exports.productReview = (req, res) => {
  console.log(req.body)
  req.body.userId=req.profile._id;
  req.body.productId=req.product._id;
  req.body.name=req.profile.name;
  req.body.isreviewed=true;
  const review = new Reviews(req.body);
  review.save((err, data) => {
    if (err) {  
      return res.status(400).json({
        err: errorHandler(err),
      });
    }
    res.json({ data });
  });
 
};
exports.listReview = (req, res) => {
  const query = { productId:req.product._id};
Reviews.find(query)
  .exec((err, reviews) => {
    if (err) {
      return res.status(400).json({
        err: "Products Not Found",
      });
    }
    res.json(reviews);
  });
};

exports.listAllReviews=(req,res)=>{
  console.log("jdhsfjhdjhjs jhdfjsj dfjsj fj j dfs  jf")
  Reviews.find().exec((err,data)=>{
      if(err){
          return res.status(400).json({
              err:errorHandler(err)
          })
      }
      res.json(data);
  })
}

exports.updateRating=(req,res,next)=>{
  console.log(req.product,req.body);
  let aver =[1,2,3,4,5];
  var total=0;
  var multyplyValue =0;
  let increment =req.product.rating.averageRating;
  let b =req.body.rating;
  let averageRating ={...increment,[req.body.rating]:increment[b]+1}
  aver.forEach((element,i) => {
    multyplyValue  = averageRating[element]*parseInt(element) + multyplyValue
    console.log(multyplyValue);
    total = averageRating[element] + total;
  })
  var totalRating =multyplyValue/total;
  totalRating= totalRating.toFixed(1);
  console.log(totalRating) 
   
  Product.findOneAndUpdate({ _id: req.product._id },{$set:{rating:{totalRating,averageRating}}},(error, data) => {
    if (error) {
        return res.status(400).json({
            error: 'Could not update user purchase history' 
        });
    }
    next();
});
}
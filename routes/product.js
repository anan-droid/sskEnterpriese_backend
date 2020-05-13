const express = require("express");
const router = express.Router();
const { requireSignin, isAuth, isAdmin } = require("../controllers/auth");
const {
  create,
  productById,
  read,
  remove,
  update,
  list,
  listRelated,
  listCategories,
  listBySearch,
  photo,
  updateRating,
  listSearch,
  listReview,
  listAllReviews,
  productReview,
} = require("../controllers/product");
const { userById } = require("../controllers/user");

router.get("/products", list);
router.get("/products/search", listSearch);
router.get("/product/:productId", read);
router.get("/products/related/:productId", listRelated);
router.get("/products/categories", listCategories);
router.post("/products/by/search", listBySearch);
router.get("/product/photo/:productId", photo);
router.get("/products/review", listAllReviews);
router.get("/product/review/:productId", listReview);
router.post("/product/review/create/:productId/:userId", requireSignin, isAuth,updateRating, productReview);
router.post("/product/create/:userId", requireSignin, isAuth, isAdmin, create);
router.put(
  "/product/:productId/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  update
);
router.delete(
  "/product/:productId/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  remove
);

router.param("userId", userById);
router.param("productId", productById);

module.exports = router;

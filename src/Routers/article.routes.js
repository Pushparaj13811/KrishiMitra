import {Router} from "express";
import {createArticle, getAllArticles, getArticleById, updateArticle, deleteArticle} from "../Controllers/article.controller.js";
import {verifyJwt} from "../Middlewares/auth.middleware.js";

const router = Router();

router.route("/get-all-articles").get(getAllArticles);
router.route("/get-article/:articleId").get(getArticleById);
router.route("/create-article").post(verifyJwt, createArticle);
router.route("/update-article/:articleId").patch(verifyJwt, updateArticle);
router.route("/delete-article/:articleId").delete(verifyJwt, deleteArticle);

export default router;


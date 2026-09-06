const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const { signup } = require("../controllers/user.js");
const usercController = require("../controllers/user.js");

router
    .route("/signup")
    .get( 
        usercController.renderSignupForm
    )
    .post( 
    wrapAsync(
        usercController.signup
    ));

router
    .route("/login")
    .get( 
        usercController.renderLoginForm
    )
    .post(
    saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: `/login`,
        failureFlash: true,
    }),
    usercController.login
);

router.get("/logout", 
    usercController.logout
);

module.exports = router;
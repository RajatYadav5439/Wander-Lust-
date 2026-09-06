const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/expressError.js");
const session = require("express-session"); 
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// MongoDB connection URL - Update this with your MongoDB connection string
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dburl = MONGO_URL;
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
    await mongoose.connect(dburl);
  }

  app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
  mongoUrl:dburl,
  crypto: {
    secret: "mysupersecretcode"
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("Error in MONGO Session Store", err );
});


const sessionOptions = {
    store,
    secret: "mysupersecretcode", 
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, 
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true 
          }
};




app.use(session(sessionOptions)); 
app.use(flash()); 

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demoUser",async(req, res) =>{
//   let fakeUser = new User({
//     email: "student@gmail.com",
//     username : "delta-student"
//   });
//   let registerUser = await User.register(fakeUser,"helloworld");
//   res.send(registerUser);
// });




app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// Root route - redirect to login if not authenticated, otherwise to listings
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/listings");
  } else {
    res.redirect("/login");
  }
});

app.all("*",(req,res,next) =>{
  next(new ExpressError(404,"page not found !"));
});

app.use((err,req,res,next) => {
  let {statuscode = 500 ,message = "Something went wrong!"} = err;
  res.status(statuscode).render("error.ejs",{message});
  //res.status(statuscode).send(message);
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
  });
// Import necessary libraries and modules
const mongoose = require('mongoose'); // Mongoose for interacting with MongoDB
const Models = require('./models.js'); // Import your custom data models
const bodyParser = require('body-parser'); // For parsing request bodies
const express = require('express'); // Express.js for creating the web application
const uuid = require('uuid'); // UUID for generating unique identifiers
const fs = require('fs'); // File System for file operations
const path = require('path'); // Path for working with file paths
const app = express(); // Create an instance of the Express application

// Import Express Validator for request validation
const { check, validationResult } = require('express-validator');

// Import and use the CORS module to enable Cross-Origin Resource Sharing
const cors = require('cors');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Import authentication modules and configure authentication
require('./auth')(app);
const passport = require('passport');
require('./passport'); // Import and configure Passport.js
require('dotenv').config(); // Configure environment variables using Dotenv

// Import the Morgan logging module
const morgan = require('morgan');

// Configure Morgan to log to a file
const logDirectory = path.join(__dirname, 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
const logFilePath = path.join(logDirectory, 'access.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

app.use(morgan('combined', { stream: logStream }));

// Get data models from your models.js file
const Movies = Models.Movie; // Movie model
const Users = Models.User; // User model

//mongoose.connect('mongodb://127.0.0.1/MyFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });


// Creating GET route at endpoint "/movies" returning JSON object (Returns all movies)
/**
 * Get all the Movies
 * @name getMovies
 * @kind function
 */
  app.get('/movies', passport.authenticate('jwt', {session: false}), (req, res) => {  //Applying JWT authentication to endpoint
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


// Creating GET route at endpoint "/users" returning JSON object (Returns all users)
/**
 * Get all the Users
 * @name getUsers
 * @kind function
 */
  app.get('/users', passport.authenticate('jwt', {session: false}), (req, res) => {
    Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


// Creating GET that returns movies by title (READ)
/**
 * Gets a movie by title
 * @name getMovie
 * @param {string} Title title
 * @kind function
 */
  app.get('/movies/:Title', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.findOne({ Title: req.params.Title })
      .then((movie) => {
        res.json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


// Creating GET that returns the Genre by name(READ)
/**
 * Gets a genre
 * @name getGenre
 * @param {string} genreName genreName
 * @kind function
 */
  app.get('/movies/genres/:genreName', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.genreName })
      .then((movie) => {
        res.status(200).json(movie.Genre);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


// Creating GET that returns data from Director by name(READ)
  /**
 * Gets a director by Name
 * @name getDirector
 * @param {string} directorName directorName
 * @kind function
 */
  app.get('/movies/directors/:directorName', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.directorName })
      .then((movie) => {
        res.json(movie.Director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


// Allow new users to Register (CREATE)
/**
 * Allow new users to register
 * @name registerUser
 * @param {string} Username username
 * @param {string} Password password
 * @param {string} Email email
 * @kind function
 */
  app.post('/users',
  [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {

    
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
      .then((user) => {

        if (user) {
          return res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) =>{res.status(201).json(user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          })
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });

// Allow users to update user info(username) (UPDATE)
/**
 * Updates an existing user
 * @name updateUser
 * @param {string} Username username
 * @param {string} Password password
 * @param {string} Email email
 * @kind function
 */
app.put('/users/:Username', passport.authenticate('jwt', {session: false}),
[
  check('Username', 'Username is required').isLength({min: 5}),
  check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], (req, res) => {

  let hashedPassword = Users.hashPassword(req.body.Password);
  let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

  Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
    {
      Username: req.body.Username,
      Password: hashedPassword,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
  { new: true }) // This line makes sure that the updated document is returned
    .then(updatedUser => {
      res.json(updatedUser);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


// Allow users to add movies to ther favorites list and sent text of confirmations as added (CREATE)
/**
 * Adds a favorite movie to a user
 * @name addFavoriteMovie
 * @param {string} Username Username
 * @param {string} MovieID MovieID
 * @kind function
 */
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $push: { FavoriteMovies: req.params.MovieID } },
    { new: true }
  )
    .then(updatedUser => {
      res.json(updatedUser);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


// Allow users to remove a movie from the favorites list (DELETE)
/**
 * Removes a favorite movie for a user
 * @name removeFavoriteMovie
 * @param {string} Username username
 * @param {string} MovieID movieid
 * @kind function
 */
  app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      { $pull: { FavoriteMovies: req.params.MovieID } },
      { new: true }
    )
      .then(updatedUser => {
        res.json(updatedUser);
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });
  
//Allow users to delete the registration
//Delete a user by Username
/**
 * Deletes a user
 * @name deleteUser
 * @param {string} Username Username
 * @kind function
 */
app.delete('/users/:Username', passport.authenticate('jwt', {session: false}), (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
  


// Creating GET route at endpoint "/" returning text
app.get('/', (req, res) => {
  res.send('ENJOY WATCHING!!!');
});

// This Serves the statics files in the "public" folder
app.use(express.static('public'));

// Creating a write stream (in append mode) to the log file
const accessLogStream = fs.createWriteStream(path.join(__dirname,'log.txt'), {flags: 'a'})

// Log all requests using Morgan
app.use(morgan('combined', {stream: accessLogStream}));

// Creating error-handling that log all errors to terminal
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Ups, something went wrong!');
  });
  
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0',() => {
console.log('Your app is listening on port 3000.');

});



  
  
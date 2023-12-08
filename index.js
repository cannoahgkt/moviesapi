const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('./passport');
const authRouter = require('./auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb://localhost:27017/myDatabase', { useNewUrlParser: true, useUnifiedTopology: true });

// Import Mongoose models
const { Movie, User } = require('./models');

// Passport Configuration
require('./passport');

// Initialize Passport
app.use(passport.initialize());

// Define routes
app.use('/auth', authRouter);

// Handle POST request to create a new user
app.post('/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Existing /movies and /users routes
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json({ movies });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

const topMovies = [
  {
    title: 'Treasure Planet',
    director: 'John Musker, Ron Clements',
    year: 2002,
  },
  {
    title: 'Star Wars: Episode III - Revenge of the Sith',
    director: 'George Lucas',
    year: 2005,
  },
  {
    title: 'Spider-Man: No Way Home',
    director: 'Jon Watts',
    year: 2021,
  },
];

app.get('/topmovies', (req, res) => {
  res.json({ movies: topMovies });
});

app.get('/', (req, res) => {
  res.send('Welcome to my movie app!');
});

// Define the login route
app.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: 'Invalid username or password',
      });
    }

    // If authentication is successful, generate and return a JWT token
    const token = generateJWTToken(user);
    return res.json({ token });
  })(req, res, next);
});

// Error handling middleware and starting the server
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

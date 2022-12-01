const express = require('express');
const authRoutes = require('./auth.routes');
const auth = require('../middlewares/auth');

const router = express.Router();

// Routes
router.use('/auth', authRoutes);

router.get('/', async (req, res) => {
  const user = req.user;
  console.log(user);
  if (user) {
    res.render('home.hbs', { username: user.email });
  } else {
    res.redirect('/login');
  }
});

router.get('/login', async (req, res) => {
  res.sendFile('login.html', { root: 'public' });
});

router.get('/register', async (req, res) => {
  res.sendFile('register.html', { root: 'public' });
});

router.get('/logout', async (req, res) => {
  try {
    await req.session.destroy((err) => {
      if (err) {
        console.log(err);
        res.clearCookie('my-session');
      } else {
        res.clearCookie('my-session');
        res.send('Hasta luego');
        // res.redirect('/login');
      }
    });
  } catch (err) {
    console.log(err);
  }
});

router.get('/signin-error', async (req, res) => {
  res.render('login-error.hbs', {});
});

router.get('/signup-error', async (req, res) => {
  res.render('register-error.hbs', {});
});

module.exports = router;

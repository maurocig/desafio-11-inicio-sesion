const express = require('express');
const authRoutes = require('./auth.routes');
const auth = require('../middlewares/auth');

const router = express.Router();

// Routes
router.use('/auth', authRoutes);

router.get('/', async (req, res) => {
  const username = req.session.user;
  if (!username) {
    res.redirect('/login');
  }
  res.render('home.hbs', { username: username });
});

router.get('/login', async (req, res) => {
  res.sendFile('login.html', { root: 'public' });
});

// router.post('/login', async (req, res) => {
//   const { username } = req.body;
//   req.session.user = username;
//   console.log(username);
//   req.session.save((error) => {
//     if (error) {
//       console.log('Session error => ' + error);
//       return res.redirect('/error');
//     }
//     res.redirect('/');
//   });
// });

router.post('/register', async (req, res) => {});

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

module.exports = router;

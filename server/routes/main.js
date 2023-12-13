const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const jwt = require('jsonwebtoken');



/**
 * GET /
 * HOME
*/
router.get('', async (req, res) => {
  try {
    const locals = {
      title: "Dogan's Blog",
      description: ""
    }
    // Access the token from cookies
    const token = req.cookies.token;

    let perPage = 6;
    let page = req.query.page || 1;

    const data = await Post.aggregate([ { $sort: { createdAt: -1 } } ])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec();

    const count = await Post.count();
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);
  // Set token on res.locals
    res.locals.token = req.cookies.token;
    res.render('index', { 
      locals,
      data,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: '/',
      token // Include the token in the data passed to the view

    });

  } catch (error) {
    console.log(error);
  }

});



/**
 * GET /
 * Post :id
*/
router.get('/post/:id', async (req, res) => {
  try {
    let slug = req.params.id;

    const data = await Post.findById({ _id: slug });

    const locals = {
      title: data.title,
      description: "Getting the post",
    }

    res.render('post', { 
      locals,
      data,
      currentRoute: `/post/${slug}`
    });
  } catch (error) {
    console.log(error);
  }

});



/**
 * GET /
 * Search - Sort
 */
router.get('/search', async (req, res) => {
  try {
    let sort = {};
  
    if (req.query.sort === 'newest') {
      sort.createdAt = -1; // newest first
    } else if (req.query.sort === 'oldest') {
      sort.createdAt = 1; // oldest first
    }

    const posts = await Post.find({}).sort(sort).exec();
    
    res.render('search', { 
      data: posts,
      locals: {
        title: 'Search',
        description: 'Search Results'
      },
      currentRoute: '/search'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


/**
 * POST /
 * Post - searchTerm
*/
router.post('/search', async (req, res) => {
  try {
    const locals = {
      title: "Seach",
      description: "Search"
    }

    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "")

    const data = await Post.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
        { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
      ]
    });

    res.render("search", {
      data,
      locals,
      currentRoute: '/'
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /
 * About
*/
router.get('/about', (req, res) => {
  const token = req.cookies.token;
  res.render('about', {
    
    currentRoute: '/about',
    data: {}, // Add any data you want to pass to the "about" page
    token
  });
});


/**
 * POST /
 * Admin - Register
*/
// Set token on login
// router.post('/admin', (req, res) => {
//   // Login logic

//   const token = jwt.sign({ userId: user._id }, jwtSecret) 
//   res.cookie('token', token, { httpOnly: true })
  
//   res.redirect('/dashboard')
// })

// // Clear cookie on logout
// router.get('/logout', (req, res) => {
//   res.clearCookie('token')
//   res.redirect('/')
// })



module.exports = router;
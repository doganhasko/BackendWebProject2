const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;


/**
 * 
 * Check Login
*/
const authMiddleware = (req, res, next ) => {
  const token = req.cookies.token;

  if(!token) {
    return res.status(401).json( { message: 'YOU HAVE TO LOGIN'} );
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch(error) {
    res.status(401).json( { message: 'An error occured'} );
  }
}


/**
 * GET /
 * Admin - Login Page
*/
router.get('/admin', async (req, res) => {
  try {
    const locals = {
      title: "Admin",
      description: "Admin"
    }

    res.render('admin/index', { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});


/**
 * POST /
 * Admin - Check Login
*/
router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne( { username } );

    if(!user) {
      return res.status(401).json( { message: 'Username - Password DOES NOT MATCH' } );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid) {
      return res.status(401).json( { message: 'Username - Password DOES NOT MATCH' } );
    }

    const token = jwt.sign({ userId: user._id}, jwtSecret );
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/dashboard');

  } catch (error) {
    console.log(error);
  }
});


/**
 * GET /
 * Admin Dashboard
*/
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Dashboard',
      description: 'Dashboard'
    }
    const token = req.cookies.token;

    const data = await Post.find();
    res.render('admin/dashboard', {
      locals,
      data,
      layout: adminLayout,
      token
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /
 * Admin - Create New Post
*/
router.get('/add-post', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Add Post',
      description: 'Add Post'
    }

    const data = await Post.find();
    res.render('admin/add-post', {
      locals,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * POST /
 * Admin - Create New Post
 */
router.post('/add-post', authMiddleware, async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      body: req.body.body
    });

    if (req.body.title.length < 9) {
      return res.status(400).json({ message: 'Title must be at least 9 characters' });
    }

    if (req.body.body.length < 9) {
      return res.status(400).json({ message: 'Body must be at least 9 characters' });
    }

    await Post.create(newPost);
    res.status(200).json({ message: 'Post created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while creating the post' });
  }
});



/**
 * GET /
 * Admin - Create New Post
*/
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {

    const locals = {
      title: "Edit Post",
      description: "Edit Post",
    };

    const data = await Post.findOne({ _id: req.params.id });

    res.render('admin/edit-post', {
      locals,
      data,
      layout: adminLayout
    })

  } catch (error) {
    console.log(error);
  }

});


/**
 * PUT /
 * Admin - Create New Post
*/
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
  try {

    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now()
    });

    res.redirect(`/edit-post/${req.params.id}`);

  } catch (error) {
    console.log(error);
  }

});

router.get('/register', (req, res) => {
  res.render('register', {
    currentRoute: '/register'
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

// Clear cookie on logout
router.get('/logout', (req, res) => {
  res.clearCookie('token')
  res.redirect('/')
})

router.post('/register', async (req, res) => {
  const { username, password,email,phone,address,confirmPassword } = req.body;

  if (username.length < 5) {
    return res.status(400).json({ message: 'Username must be at least 5 characters' });
  }

  if (password.length < 5) {
    return res.status(400).json({ message: 'Password must be at least 5 characters' });
  }

  // Check if the username contains numbers
  if (/\d/.test(username)) {
    return res.status(400).json({ message: 'Username cannot contain numbers' });
  }

  // Validate email
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate phone
  if (!phone.startsWith('+32')) {
    return res.status(400).json({ message: 'Phone number must start with +32' });
  }

  // Check if password and confirm password match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Password and Confirm Password do not match' });
  }

  // If validation passes, hash the password and create the user
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      address,
      phone
    });
    res.status(201).json({ message: 'User Created', user });
  } catch (error) {
    // Handle mongoose errors
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Username already in use' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});



/**
 * DELETE /
 * Admin - Delete Post
*/
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {

  try {
    await Post.deleteOne( { _id: req.params.id } );
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /
 * Admin Logout
*/
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  //res.json({ message: 'Logout successful.'});
  res.redirect('/');
});


// GET /profile - User profile page
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // Get user information from the database using req.userId
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = req.cookies.token;

    res.render('profile', {
      
        title: 'Profile',
        description: 'User Profile',
        user,
        currentRoute: '/profile',
        token,
      
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /profile - Update user profile
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    // Get user data from the request body
    const { username, email, phone,address } = req.body;

    // Update user information in the database
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { username, email, phone,address },
      { new: true } // Return the updated user
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = req.cookies.token;

    res.render('profile', {
      
        title: 'Profile',
        description: 'User Profile',
        user: updatedUser,
        currentRoute: '/profile',
        token,
      
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE profile
router.post('/profile/delete', authMiddleware, async (req, res) => {
  try {
    // Get user ID from the request
    const userId = req.userId;

    // Delete the user from the database
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear the authentication token
    res.clearCookie('token');

    // Redirect to the home page
    res.redirect('/');

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



module.exports = router;
const express= require('express');
const User = require('../models/User');
const router= express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser');

const JWT_SECRET= 'Kaustubhisagoodb$oy';

//ROUTE 1: Create a user using: POST "/api/auth/". Doesn't require auth
router.post('/createuser', [
    body('email',"Enter a valid name").isEmail(),
    body('name', "Enter a valid email").isLength({ min: 3 }),
    body('password', "Password must be atleast 5 characters").isLength({ min: 5 }),
] ,async (req,res)=>{

  let success=false;

// If there are errors return bad request and the errors

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({success, errors: errors.array() });
    }

    // Check whether the user exists already
    try {
        
    let user=await User.findOne({email:req.body.email});
    if(user){
        return res.status(400).json({success, error: "Sorry a user with this email already exists"})
    }

    
    const salt=await bcrypt.genSalt(10);
   const secPass= await bcrypt.hash(req.body.password, salt);


    // Create a new user

     user= await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      })

      // Token generation

      const data={
        user:{ 
          id:user.id
        }
      }
      const authtoken=jwt.sign(data, JWT_SECRET);  // with the help of Secret we can find if someone has tampered with the data
      // console.log(jwtData);


    // res.json(user)
    success=true;
    res.json({success, authtoken});  // whenever authtoken is returned it can be converted into the above mentioned data object


} catch (error) {
        console.error(error.message);
        res.status(500).send("Some error occured")
}
})

  // ROUTE 2: Autheenticate a user using: POST "/api/auth/login" No login required

  router.post('/login', [
    body('email',"Enter a valid name").isEmail(),
    body('password',"Password cannot be blank").exists()  // checking the validity of email
] ,async (req,res)=>{
  let success=false;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const {email,password}= req.body;

  try {
    let user= await User.findOne({email});
    if(!User){
      
      return res.status(400).json({success , error: "Please try to login with correct credintials"});
    }

    const passwordCompare=await bcrypt.compare(password, user.password)  // matches the password with hash

    if(!passwordCompare){
      success=false;
      return res.status(400).json({success, error: "Please try to login with correct credintials"});
    }

    const data={
      user:{ 
        id:user.id
      }
    }
    const authtoken=jwt.sign(data, JWT_SECRET);
    success=true;
    res.json({success, authtoken});

  } catch (error) {
    console.error(error.message);
        res.status(500).send("Internal server error occured")
  }
})


  //ROUTE 3: Get logged in user details using: POST "/api/auth/getuser". Login required
  router.post('/getuser', fetchuser ,async (req,res)=>{
  try {
    userId=req.user.id;
    const user=await User.findById(userId).select("-password")  // Select everyting except the password
    res.send(user)
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error occured")
  }})
module.exports = router;
const router = require('express').Router();

router.get('/',(req,res)=>{
    res.status(200).send("server is running...");
})

module.exports = router;
 
const express = require('express')    ;
const path = require('path');
const fs = require('fs');
const {MongoClient, ObjectId} = require('mongodb');
const formidable = require('formidable');
const { fileURLToPathBuffer } = require('url');
// const { use } = require('react');

// express port 
const app = express();
const PORT = 4000;

// mongodb 
const url = 'mongodb+srv://sultan_admin:Sultan78600@cluster0.jmxcnam.mongodb.net/Groups?retryWrites=true&w=majority';
const client = new MongoClient(url);
const DATABASE = 'Groups';
const COLLECTION = 'Mem';

// middleware  
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use('/uploads',express.static(path.join(__dirname,'uploads')))

async function ConnectToDatabase(){
    try {
        await client.connect();
        console.log('connected to database')
    }
    catch(err){
        console.log(err)
    }
}
ConnectToDatabase();

app.get('/',(req,res)=>{
    res.render('form')
})

app.post('/register',(req,res)=>{
    const form = new formidable.IncomingForm();
    form.parse(req, async(err,fields,files)=>{
        if(err){
            console.log(err)
        }
        const name = fields.name[0];
        const email = fields.email[0];
        const course = fields.course[0];
        const originalFilename = files.image[0].originalFilename;
        const filepath = files.image[0].filepath;
        const extension = originalFilename.split('.').pop();

        const collection = client.db(DATABASE).collection(COLLECTION);
        const userFound = await collection.findOne({email:email})
        if(userFound){
            res.send('user with this email already exists')
        }
        const result =await collection.insertOne({
            name,
            email,
            course,
            image:originalFilename,
        })
        const insertedId = (await result).insertedId.toString();
        const newFilename = `${insertedId}.${extension}`;
        const uploadDir = path.join(__dirname, 'uploads');
        if(!fs.existsSync(uploadDir)){
            (fs.mkdirSync(uploadDir))
        }
        const newFilePath = path.join(uploadDir,newFilename);
        fs.copyFile(filepath,newFilePath, (copyErr)=>{
            if(copyErr){
                console.log('failed to copy image')
            }
            fs.unlink(filepath, (unlinkErr)=>{
                if(unlinkErr){
                    console.log(unlinkErr)
                }
            })
            res.redirect('/')
        })
        

    })
})
app.get('/show-students', async(req,res)=>{
const collection = client.db(DATABASE).collection(COLLECTION);
const users =await collection.find({}).toArray();
console.log(users)


    res.render('show-students', {users})
})
app.post('/delete', async(req,res)=>{
    const id =req.body.id
    const collection = client.db(DATABASE).collection(COLLECTION);
    const userFound = await collection.findOne({_id:new ObjectId(id)});
    const userImageExtension = userFound.image.split('.').pop();
    const userImageName = `${id}.${userImageExtension}`;
    const userImagePath = path.join(__dirname, 'uploads', userImageName);
    fs.unlink(userImagePath,async(unlinkErr)=>{
        if(unlinkErr){
            console.log(unlinkErr)
        }
        const result = await collection.deleteOne({_id:new ObjectId(id)}); 
    })
    
    res.redirect('/show-students')
})
app.post('/edit',async (req,res)=>{
    const id = req.body.id;
    const collection = client.db(DATABASE).collection(COLLECTION);
    const foundUser = await collection.findOne({_id: new ObjectId(id)})

    res.render('edit', {foundUser})
})

app.post('/update-student', (req, res)=>{
    const form = new formidable.IncomingForm();
    form.parse(req, async(err, fields, files) => {
        if (err) {
            console.log(err)};
            
            


        const name = fields.name[0];
        const email = fields.email[0];
        const course = fields.course[0];
        const originalFilename = files.image[0].originalFilename;
        const filepath = files.image[0].filepath;
        const id = fields.id[0];
        
        const data = { name, email, course, image:originalFilename};



        const extension = originalFilename.split('.').pop();
        const oldUserImageName = `${id}.${extension}`;
        const oldUserImagePath = path.join(__dirname,'upload', oldUserImageName);
        

        

        const collection = client.db(DATABASE).collection(COLLECTION);

    
            
            const uploadDir = path.join(__dirname, 'uploads');
            const newFilename = `${id}.${extension}`;
            const newFilePath = path.join(uploadDir, newFilename);
            

            
                // fs.unlink(filepath, (unlinkErr) => {
                //     if (unlinkErr) console.log(unlinkErr);
                // });
                
                fs.rename(filepath,newFilePath, async(copyErr)=>{
            if (copyErr) {
                    console.log('failed to copy image');
                }
            
                const collection = client.db(DATABASE).collection(COLLECTION);
                           await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: data }),

            
        res.redirect('/show-students')
          });
          
    });

})




app.listen(PORT,()=>{
    console.log(`app is listening on port${PORT}`)
})
module.exports = app;
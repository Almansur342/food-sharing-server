const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express();

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.skihu85.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {

  const foodCollection = client.db('foodSharing').collection('food');
  const requestCollection = client.db('foodSharing').collection('request');

  app.get('/sixFood', async(req,res)=>{
    const cursor = foodCollection.find().limit(6);
    const result = await cursor.toArray();
    res.send(result);
  });

  // save a request data
  app.post('/request', async(req,res)=>{
    const info = req.body;
    const result = await requestCollection.insertOne(info)
    res.send(result)
  });

  app.get('/requestedFood/:email', async(req,res)=>{
    const email = req.params.email;
    const query = {requestor: email}
    const results = await requestCollection.find(query).toArray()
    res.send(results)
  });

  app.get('/details/:id', async(req,res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await foodCollection.findOne(query)
    res.send(result);
  })

  app.post('/addFood', async(req,res)=>{
    const foodData = req.body
    const result = await foodCollection.insertOne(foodData)
    res.send(result)
  });

  app.get('/allFood', async(req,res)=>{
    const sort = req.query.sort
    const search = req.query.search
    console.log(sort);

    let query = {
      food_name: { $regex : search, $options: 'i'}
    }
    let options = {}
    if(sort) options={sort: {expired_date: sort === 'asc' ? 1 : -1}}
    const cursor = foodCollection.find(query, options);
    const result = await cursor.toArray();
    res.send(result);
  });

  app.get('/myFood/:email', async(req,res)=>{
    const email = req.params.email;
    const query = {'donator.email': email}
    const results = await foodCollection.find(query).toArray()
    res.send(results)
  });

  app.delete('/deleteFood/:id', async(req,res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await foodCollection.deleteOne(query)
    res.send(result)
  })

  app.put('/update/:id', async(req,res)=>{
    const id = req.params.id;
    const info = req.body
    const query = {_id: new ObjectId(id)}
    const options = {upsert: true}
    const updateDoc = {
      $set:{
        ...info,
      },
    }
    const result = await foodCollection.updateOne(query,updateDoc,options)
    res.send(result)
  });


  app.patch('/updateStatus/:id', async(req,res)=>{
    const id = req.params.id;
    const food_status = req.body;
    const query = {_id: new ObjectId(id)}
    const updateDoc={
      $set: food_status
    }
    const result = await foodCollection.updateOne(query,updateDoc)
    res.send(result)
  })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
  res.send('hello from food sharing server')
})

app.listen(port, ()=>{
  console.log(`server is running on port: ${port}`)
})

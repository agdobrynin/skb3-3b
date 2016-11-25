import express from 'express';
import cors from 'cors';
require('es6-promise').polyfill();
require('isomorphic-fetch');
import jsonQuery from 'json-query';

const app = express();
app.use(cors());

const DbUrl='https://gist.githubusercontent.com/isuvorov/55f38b82ce263836dadc0503845db4da/raw/pets.json';
let Db = {};

function SendResult(result, res){
  if(result){
      res.json(result);
  }else{
      res.status(404).send('Not Found');
  }
}

fetch(DbUrl)
  .then(async (res) => {
    Db = await res.json();
  })
  .catch(err => {
    console.log('Чтото пошло не так:', err);
  });

//вся база
app.get('/', (req, res) => {
  SendResult(Db, res);
});

//все поьзоватеkи
///users?havePet=cat Пользователи у которых есть коты
app.get('/users', (req, res) =>{

  let result=null, qs=[];

  if(req.query.havePet){
    result=jsonQuery(`[*type=${req.query.havePet}].userId`, {data: Db.pets}).value;
    if(result.length){
      let new_qs = result.map( function(e){return 'id='+e;});
      result=jsonQuery(`[* ${new_qs.join(' | ')}]`, {data: Db.users}).value;
    }
  }else{
    result=jsonQuery('[* ]', {data: Db.users}).value;
  }

  SendResult(result, res);
});

//данные пользователя по его ID
app.get('/users/:id', (req, res) =>{
    let result;
    if(/([0-9]+)/g.test(req.params.id)){
      result=jsonQuery(`[id=${req.params.id}]`, {data: Db.users});
    }else{
      result=jsonQuery(`[username=${req.params.id}]`, {data: Db.users});
    }
    SendResult(result.value, res);
});

//Все пользователи вывести с pets
// /users/populate?havePet=cat се пользователи у которых коты, вывести с pets
app.get('/users/populate', (req, res) =>{
  res.json({});
});

//Получить данные конкретного пользователя по его username/id, внутри объекта должен лежить массив pets
app.get('/users/:usernameOrId/populate', (req, res) =>{
  res.json({});
});

//Получить список животных
// /pets?type=cat  Получить список только котов
// /pets?age_gt=12 Получить животных возраст которых строго больше 12 месяцев
// /pets?age_lt=25 Получить животных возраст которых строго меньше 25 месяцев
app.get('/pets', (req, res) =>{

  let result=null, qs=[];

  if(req.query.type){
    qs.push(`type=${req.query.type}`);
  }
  if(req.query.age_gt){
    qs.push(`age>${req.query.age_gt}`);
  }
  if(req.query.age_lt){
    qs.push(`age<${req.query.age_lt}`);
  }
  if(req.query == null ){
    qs=[];
  }

  result=jsonQuery('[* ' + qs.join(' & ') + ']', {data: Db.pets}).value;

  SendResult(result, res);
});

//Получить список животных Получить животного по его ID
app.get('/pets/:id',  (req, res) =>{
  let result=jsonQuery(`[id=${req.params.id}]`, {data: Db.pets});
  SendResult(result.value, res);
});

//Получить список животных с пользовательской структурой, положить пользователя в поле user
// /pets/populate?type=cat Популяция с возможностью фильтра
// /pets/populate?type=cat&age_gt=12 Популяция с возможностью фильтра
app.get('/pets/populate', (req, res) =>{
  let result=null;
  /*
  {
    "id":1,"userId":1,"type":"dog","color":"#f44242","age":1,
    "user":{"id":1,"username":"greenday","fullname":"Billie Joe Armstrong","password":"Sweet Children","values":{"money":"200042$","origin":"East Bay, California, United States"}}
  }
  */
  res.json({});
});

//Популяция user в pet
app.get('/pets/:id/populate', (req, res) =>{
  res.json({});
});

//данные пользователя по его имени
app.get('/users/:username', (req, res) =>{
  res.json({});
});

//Получить список животных конкретного пользователя по его username/id
app.get('/users/:id/pets', (req, res) =>{
  res.json({});
});

app.listen(3000, () => {
  console.log('Your app listening on port 3000!');
});
